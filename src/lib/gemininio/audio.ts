/**
 * Audio plumbing for Gemini Live: capture mic input as 16 kHz PCM
 * mono and play streamed 24 kHz PCM mono replies smoothly.
 *
 * Why so much code for "just record / play audio"?
 * - Browsers default to 44.1 / 48 kHz; the Live API expects 16 kHz
 *   for input and emits 24 kHz for output. We need to resample on
 *   both sides without a lib.
 * - Output arrives in many small chunks. Naive `new Audio().play()`
 *   per chunk gives constant gaps. We schedule each buffer with a
 *   running `playTime` cursor on a Web Audio AudioContext so they
 *   stitch seamlessly.
 * - Input must be sent as base64 little-endian 16-bit PCM, which
 *   means converting Float32 [-1, 1] → Int16 [-32768, 32767].
 *
 * The two main exports are `MicCapture` (start / stop, fires PCM
 * chunks via callback) and `PcmPlayer` (queue PCM chunks and they
 * play in order from a single AudioContext).
 */

const TARGET_INPUT_RATE = 16000; // Gemini Live wants 16 kHz mono PCM in
const OUTPUT_RATE = 24000; // Gemini Live emits 24 kHz mono PCM out

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Linear-interpolation downsample of a Float32 buffer to a lower
 *  rate. Good enough for speech — we're not shipping a music player. */
function downsampleFloat32(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (toRate === fromRate) return input;
  if (toRate > fromRate) {
    // We never need to upsample for mic capture, but be safe.
    return input;
  }
  const ratio = fromRate / toRate;
  const newLength = Math.floor(input.length / ratio);
  const out = new Float32Array(newLength);
  let offset = 0;
  for (let i = 0; i < newLength; i++) {
    const next = Math.floor((i + 1) * ratio);
    let sum = 0;
    let count = 0;
    for (let j = offset; j < next && j < input.length; j++) {
      sum += input[j];
      count++;
    }
    out[i] = count ? sum / count : 0;
    offset = next;
  }
  return out;
}

/** Float32 [-1, 1] → Int16 LE bytes. */
function floatToPcm16Bytes(input: Float32Array): Uint8Array {
  const out = new Uint8Array(input.length * 2);
  const view = new DataView(out.buffer);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return out;
}

/** Int16 LE bytes → Float32 [-1, 1] for playback. */
function pcm16BytesToFloat(bytes: Uint8Array): Float32Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const len = Math.floor(bytes.byteLength / 2);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const v = view.getInt16(i * 2, true);
    out[i] = v < 0 ? v / 0x8000 : v / 0x7fff;
  }
  return out;
}

/** Browser-friendly base64 encoder for binary buffers. btoa() chokes
 *  on bytes outside Latin-1; chunking by 0x8000 is the standard
 *  workaround that keeps memory usage reasonable. */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/* ------------------------------------------------------------------ */
/* MicCapture — getUserMedia → 16 kHz PCM chunks via callback          */
/* ------------------------------------------------------------------ */

export class MicCapture {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private node: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private onChunk: (pcm16: Uint8Array) => void;

  constructor(onChunk: (pcm16: Uint8Array) => void) {
    this.onChunk = onChunk;
  }

  async start(): Promise<void> {
    if (this.ctx) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1
      }
    });

    // Some browsers ignore the constraint and the AudioContext sample
    // rate ends up at 44.1 / 48 kHz. We'll resample whatever we get.
    this.ctx = new AudioContext();
    const sourceRate = this.ctx.sampleRate;

    this.source = this.ctx.createMediaStreamSource(this.stream);

    // ScriptProcessorNode is deprecated in favour of AudioWorklet,
    // but Worklets need a separate file (a bigger lift) and SP works
    // fine for a low-rate speech stream. Buffer size 4096 keeps the
    // chunks ~85 ms at 48 kHz — small enough for low latency, large
    // enough that we're not flooding the WebSocket.
    this.node = this.ctx.createScriptProcessor(4096, 1, 1);
    this.node.onaudioprocess = e => {
      const input = e.inputBuffer.getChannelData(0);
      const downsampled = downsampleFloat32(input, sourceRate, TARGET_INPUT_RATE);
      const pcm = floatToPcm16Bytes(downsampled);
      this.onChunk(pcm);
    };

    this.source.connect(this.node);
    // SP nodes need a destination connection to run, but we don't
    // actually want to hear ourselves. Route through a muted gain.
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    this.node.connect(gain).connect(this.ctx.destination);
  }

  async stop(): Promise<void> {
    try {
      this.node?.disconnect();
      this.source?.disconnect();
      this.stream?.getTracks().forEach(t => t.stop());
      await this.ctx?.close();
    } catch {
      /* ignore */
    }
    this.node = null;
    this.source = null;
    this.stream = null;
    this.ctx = null;
  }

  isRunning(): boolean {
    return this.ctx !== null;
  }
}

/* ------------------------------------------------------------------ */
/* PcmPlayer — queue 24 kHz PCM chunks and play seamlessly             */
/* ------------------------------------------------------------------ */

export class PcmPlayer {
  private ctx: AudioContext | null = null;
  private playTime = 0;
  /** Chunks received while `AudioContext` was still `suspended` (iOS). */
  private pending: Uint8Array[] = [];
  private resumeInFlight = false;

  /**
   * Call from a **user gesture** (mic up, unmute tap) so the playback
   * context is not stuck `suspended` — iOS Safari will not play Live
   * PCM until `resume()` runs after a tap. Mic capture uses a *different*
   * AudioContext, so unlocking the mic does not unlock playback.
   */
  async ensureAudioUnlocked(): Promise<void> {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      this.ctx = new AudioContext({ sampleRate: OUTPUT_RATE });
      this.playTime = this.ctx.currentTime;
    }
    if (this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
      } catch {
        /* ignore */
      }
    }
    this.flushPending();
  }

  private flushPending(): void {
    if (!this.ctx || this.ctx.state !== "running") return;
    while (this.pending.length) {
      const pcm = this.pending.shift();
      if (pcm) this.scheduleChunk(pcm);
    }
  }

  private scheduleChunk(pcm: Uint8Array): void {
    if (!this.ctx) return;
    const float = pcm16BytesToFloat(pcm);
    if (float.length === 0) return;

    const buffer = this.ctx.createBuffer(1, float.length, OUTPUT_RATE);
    buffer.getChannelData(0).set(float);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    if (this.playTime < now) this.playTime = now;
    source.start(this.playTime);
    this.playTime += buffer.duration;
  }

  /** Queue a chunk. The first call lazily creates the AudioContext.
   *  Returns when the chunk is scheduled (not when it finishes). */
  enqueue(pcm: Uint8Array): void {
    if (!this.ctx) {
      this.ctx = new AudioContext({ sampleRate: OUTPUT_RATE });
      this.playTime = this.ctx.currentTime;
    }
    if (this.ctx.state !== "running") {
      this.pending.push(pcm);
      if (!this.resumeInFlight) {
        this.resumeInFlight = true;
        void this.ctx
          .resume()
          .then(() => {
            this.resumeInFlight = false;
            this.flushPending();
          })
          .catch(() => {
            this.resumeInFlight = false;
          });
      }
      return;
    }
    this.scheduleChunk(pcm);
  }

  /** Hard-cut current playback (e.g. user interrupted Gemininio). */
  stop(): void {
    this.pending = [];
    this.resumeInFlight = false;
    try {
      this.ctx?.close();
    } catch {
      /* ignore */
    }
    this.ctx = null;
    this.playTime = 0;
  }
}
