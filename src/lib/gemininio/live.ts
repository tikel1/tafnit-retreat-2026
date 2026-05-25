/**
 * Tiny client for the Gemini Live API (BidiGenerateContent).
 *
 * Talks the JSON-over-WebSocket protocol described at
 * https://ai.google.dev/api/live — just the bits Gemininio needs:
 *
 *   1. Connect to wss://…BidiGenerateContent?key=API_KEY
 *   2. Send a `setup` message (model + system instruction + voice)
 *   3. Stream user audio (16 kHz PCM base64) and/or text
 *   4. Receive interleaved text + audio chunks (24 kHz PCM base64)
 *      with intermediate "input transcription" deltas so the user
 *      sees what the mic heard, and "model turn" deltas + final
 *      "turn complete" markers
 *
 * The class is event-emitter-ish: callers register callbacks
 * (onText, onAudio, onTranscript, onError, onClose, onTurnComplete)
 * and call sendText() / sendAudioChunk() / endTurn() / close().
 */

import { bytesToBase64 } from "./audio";
import { buildLiveWebSocketUrl } from "./geminiEndpoint";

const MODELS_TO_TRY = [
  "models/gemini-3.1-flash-live-preview",
  "models/gemini-2.5-flash-native-audio-latest",
  "models/gemini-2.0-flash-exp"
] as const;

/** Voices ship with the Live model. "Charon" is warm and slightly husky. */
const VOICE_NAME = "Charon";

export interface LiveCallbacks {
  /** Streamed text deltas from the model's reply. */
  onText?: (delta: string) => void;
  /** Streamed PCM audio (24 kHz, mono, 16-bit LE). */
  onAudio?: (pcm: Uint8Array) => void;
  /** Transcript of what the user actually said. */
  onTranscript?: (delta: string, isFinal: boolean) => void;
  /** Model finished its turn. */
  onTurnComplete?: () => void;
  /** Connection-level errors. */
  onError?: (err: string) => void;
  /** WebSocket closed. */
  onClose?: () => void;
}

export interface LiveOptions {
  apiKey: string;
  systemInstruction: string;
  language: "en" | "he";
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private cb: LiveCallbacks;
  private opts: LiveOptions;
  private setupComplete = false;
  private closed = false;

  constructor(opts: LiveOptions, cb: LiveCallbacks = {}) {
    this.opts = opts;
    this.cb = cb;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const tryModels = [...MODELS_TO_TRY];

      const tryNext = () => {
        const model = tryModels.shift();
        if (!model) {
          reject(new Error("All Live models failed to connect or ran out of quota."));
          return;
        }
        this.openOnce(model).then(resolve).catch(tryNext);
      };

      tryNext();
    });
  }

  private openOnce(model: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = buildLiveWebSocketUrl(this.opts.apiKey);
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch (e) {
        reject(e);
        return;
      }
      this.ws = ws;
      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        const setup = {
          setup: {
            model,
            system_instruction: {
              parts: [{ text: this.opts.systemInstruction }]
            },
            generation_config: {
              temperature: 0.85,
              response_modalities: ["AUDIO"],
              speech_config: {
                voice_config: {
                  prebuilt_voice_config: { voice_name: VOICE_NAME }
                },
                language_code: this.opts.language === "he" ? "he-IL" : "en-US"
              }
            },
            input_audio_transcription: {},
            output_audio_transcription: {}
          }
        };
        ws.send(JSON.stringify(setup));
      };

      ws.onmessage = ev => this.handleMessage(ev, resolve);
      ws.onerror = () => reject(new Error("WebSocket error connecting to Gemini Live"));
      ws.onclose = e => {
        this.closed = true;
        if (!this.setupComplete) {
          const reason = e.reason ? ` — ${e.reason}` : "";
          reject(
            new Error(
              `Gemini Live closed before setup (code ${e.code} on ${model})${reason}`
            )
          );
        }
        this.cb.onClose?.();
      };
    });
  }

  private async handleMessage(ev: MessageEvent, resolveSetup: () => void) {
    let payload: unknown;
    try {
      const raw =
        ev.data instanceof ArrayBuffer
          ? new TextDecoder().decode(ev.data)
          : typeof ev.data === "string"
            ? ev.data
            : await (ev.data as Blob).text();
      payload = JSON.parse(raw);
    } catch (e) {
      this.cb.onError?.("Bad message from Gemini Live: " + String(e));
      return;
    }

    const msg = payload as Record<string, unknown>;

    if (msg.setupComplete !== undefined) {
      this.setupComplete = true;
      resolveSetup();
      return;
    }

    const sc = msg.serverContent as Record<string, unknown> | undefined;
    if (sc) {
      const it = sc.inputTranscription as { text?: string } | undefined;
      if (it?.text) this.cb.onTranscript?.(it.text, false);

      const ot = sc.outputTranscription as { text?: string } | undefined;
      if (ot?.text) this.cb.onText?.(ot.text);

      const turn = sc.modelTurn as
        | { parts?: Array<Record<string, unknown>> }
        | undefined;
      if (turn?.parts) {
        for (const part of turn.parts) {
          if (part.thought === true) continue;

          const inline = part.inlineData as
            | { mimeType?: string; data?: string }
            | undefined;
          if (inline?.data && inline.mimeType?.startsWith("audio/")) {
            try {
              const bin = atob(inline.data);
              const bytes = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
              this.cb.onAudio?.(bytes);
            } catch (e) {
              this.cb.onError?.("Bad audio chunk: " + String(e));
            }
          }
        }
      }

      if (sc.turnComplete) this.cb.onTurnComplete?.();
    }

    if (msg.error) {
      const err = msg.error as { message?: string };
      this.cb.onError?.(err.message ?? "Unknown Gemini Live error");
    }
  }

  sendText(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const msg = {
      client_content: {
        turns: [{ role: "user", parts: [{ text }] }],
        turn_complete: true
      }
    };
    this.ws.send(JSON.stringify(msg));
  }

  sendAudioChunk(pcm16: Uint8Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const msg = {
      realtime_input: {
        media_chunks: [
          {
            mime_type: "audio/pcm;rate=16000",
            data: bytesToBase64(pcm16)
          }
        ]
      }
    };
    this.ws.send(JSON.stringify(msg));
  }

  endTurn(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const msg = { realtime_input: { activity_end: {} } };
    this.ws.send(JSON.stringify(msg));
  }

  close(): void {
    this.closed = true;
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
    this.ws = null;
  }

  isOpen(): boolean {
    return !this.closed && this.ws?.readyState === WebSocket.OPEN;
  }
}
