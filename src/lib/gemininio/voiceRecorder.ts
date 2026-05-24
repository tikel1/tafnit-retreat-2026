/**
 * Thin wrapper around MediaRecorder for one-shot voice capture, with
 * built-in voice-activity detection so the recording auto-stops a
 * short moment after the user stops speaking.
 *
 * Pattern: `start()` → user speaks → silence triggers `onAutoStop`
 * (or the caller can `stop()` manually) → `stop()` resolves with a
 * Blob ready to ship to Gemini's REST transcription endpoint. We
 * pick the best MIME type the current browser supports
 * (webm/opus on Chromium, mp4/aac on Safari, ogg/opus on Firefox).
 *
 * VAD design:
 *   - A parallel AnalyserNode (time-domain) is fed the same MediaStream
 *     we record. Every animation frame we compute the RMS level.
 *   - The first ~300 ms is treated as a noise-floor calibration window.
 *     The active speech threshold is set to max(BASE_FLOOR,
 *     baseline * 3.5), so a quiet living room and a busy kitchen both
 *     resolve to a sensible level.
 *   - We only start counting silence once the user has actually
 *     spoken (level crossed the threshold at least once). That way we
 *     don't auto-stop a recording that hasn't begun.
 *   - After speech started, if the level stays below the threshold
 *     for SILENCE_HOLD_MS, `onAutoStop` fires.
 *   - A hard MAX_DURATION_MS safety cap exists so a stuck mic in a
 *     noisy environment can't record forever.
 */

const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",
  "audio/aac"
];

/* Tunables. */
const CALIBRATION_MS = 300;        // window used to learn ambient noise floor
const BASE_FLOOR = 0.012;          // RMS level treated as "definitely silence"
const FLOOR_MULTIPLIER = 3.5;      // speech threshold = floor * this
const SILENCE_HOLD_MS = 1400;      // sustained silence required to auto-stop
const MIN_RECORDING_MS = 500;      // VAD never triggers in this initial grace
const MAX_DURATION_MS = 30_000;    // hard safety cap

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const t of PREFERRED_MIME_TYPES) {
    try {
      if (MediaRecorder.isTypeSupported(t)) return t;
    } catch {
      /* some browsers throw on unknown types — ignore and continue */
    }
  }
  return undefined;
}

export interface VoiceRecorderOptions {
  /** Fired exactly once when the recorder decides the user has gone
   *  quiet (or the safety cap fires). The caller is expected to call
   *  `stop()` to drain the audio blob — we don't auto-stop the
   *  MediaRecorder ourselves so the caller stays in full control of
   *  the UI state machine. */
  onAutoStop?: (reason: "silence" | "max-duration") => void;
  /** Fires on animation frame with the current RMS volume level. */
  onVolumeChange?: (volume: number) => void;
}

export class VoiceRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stopPromise: Promise<Blob> | null = null;
  private resolveStop: ((b: Blob) => void) | null = null;
  private rejectStop: ((e: Error) => void) | null = null;
  private mimeType: string = "audio/webm";

  /* VAD state. */
  private vadCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private vadBuffer: Float32Array<ArrayBuffer> | null = null;
  private vadRaf = 0;
  private startedAt = 0;
  private speechStarted = false;
  private silenceSince = 0;
  private noiseFloorSamples: number[] = [];
  private speechThreshold = BASE_FLOOR * FLOOR_MULTIPLIER;
  private autoStopFired = false;
  private onAutoStop?: (reason: "silence" | "max-duration") => void;
  private onVolumeChange?: (volume: number) => void;

  constructor(options: VoiceRecorderOptions = {}) {
    this.onAutoStop = options.onAutoStop;
    this.onVolumeChange = options.onVolumeChange;
  }

  /** Open the mic and begin capturing. Resolves once the recorder is
   *  actually in the `recording` state (so the caller can flip UI). */
  async start(): Promise<void> {
    if (this.recorder && this.recorder.state === "recording") return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone is not available in this browser.");
    }
    if (typeof MediaRecorder === "undefined") {
      throw new Error("Audio recording is not supported in this browser.");
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1
      }
    });

    const mime = pickMimeType();
    this.mimeType = mime ?? "audio/webm";
    this.chunks = [];

    try {
      this.recorder = mime
        ? new MediaRecorder(this.stream, { mimeType: mime })
        : new MediaRecorder(this.stream);
    } catch {
      this.recorder = new MediaRecorder(this.stream);
    }

    this.recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data);
    };

    this.stopPromise = new Promise<Blob>((resolve, reject) => {
      this.resolveStop = resolve;
      this.rejectStop = reject;
    });

    this.recorder.onstop = () => {
      const type = this.recorder?.mimeType || this.mimeType;
      const blob = new Blob(this.chunks, { type });
      this.chunks = [];
      this.cleanupVad();
      this.cleanupStream();
      this.resolveStop?.(blob);
    };

    this.recorder.onerror = ev => {
      const err =
        (ev as unknown as { error?: Error }).error ??
        new Error("Recording failed.");
      this.cleanupVad();
      this.cleanupStream();
      this.rejectStop?.(err);
    };

    this.recorder.start();
    this.startVad();
  }

  /** Stop recording and resolve with the captured audio blob. Safe to
   *  call multiple times — only the first call does work. */
  stop(): Promise<Blob> {
    if (!this.recorder || !this.stopPromise) {
      return Promise.resolve(new Blob([], { type: this.mimeType }));
    }
    if (this.recorder.state === "recording") {
      try {
        this.recorder.stop();
      } catch (e) {
        this.cleanupVad();
        this.cleanupStream();
        this.rejectStop?.(e instanceof Error ? e : new Error(String(e)));
      }
    }
    const p = this.stopPromise;
    return p;
  }

  /** Hard-cancel the recording without resolving with audio. */
  cancel(): void {
    if (this.recorder?.state === "recording") {
      try {
        this.recorder.stop();
      } catch {
        /* ignore */
      }
    }
    this.chunks = [];
    this.cleanupVad();
    this.cleanupStream();
    this.resolveStop?.(new Blob([], { type: this.mimeType }));
    this.recorder = null;
    this.stopPromise = null;
    this.resolveStop = null;
    this.rejectStop = null;
  }

  /* ------------------------- VAD internals ------------------------- */

  private startVad(): void {
    if (!this.stream || !this.onAutoStop) return;
    try {
      this.vadCtx = new AudioContext();
      const source = this.vadCtx.createMediaStreamSource(this.stream);
      this.analyser = this.vadCtx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.6;
      this.vadBuffer = new Float32Array(new ArrayBuffer(this.analyser.fftSize * 4));
      source.connect(this.analyser);
    } catch {
      this.cleanupVad();
      return;
    }

    this.startedAt = performance.now();
    this.speechStarted = false;
    this.silenceSince = 0;
    this.noiseFloorSamples = [];
    this.speechThreshold = BASE_FLOOR * FLOOR_MULTIPLIER;
    this.autoStopFired = false;

    const tick = () => {
      if (!this.analyser || !this.vadBuffer) return;
      this.analyser.getFloatTimeDomainData(this.vadBuffer);

      let sumSq = 0;
      for (let i = 0; i < this.vadBuffer.length; i++) {
        const v = this.vadBuffer[i];
        sumSq += v * v;
      }
      const rms = Math.sqrt(sumSq / this.vadBuffer.length);
      this.onVolumeChange?.(rms);

      const now = performance.now();
      const elapsed = now - this.startedAt;

      if (elapsed < CALIBRATION_MS) {
        this.noiseFloorSamples.push(rms);
        this.vadRaf = requestAnimationFrame(tick);
        return;
      }

      if (this.noiseFloorSamples.length > 0) {
        const sorted = [...this.noiseFloorSamples].sort((a, b) => a - b);
        const idx = Math.floor(sorted.length * 0.8);
        const baseline = sorted[Math.min(idx, sorted.length - 1)] ?? BASE_FLOOR;
        this.speechThreshold = Math.max(BASE_FLOOR, baseline * FLOOR_MULTIPLIER);
        this.noiseFloorSamples = [];
      }

      if (elapsed > MAX_DURATION_MS && !this.autoStopFired) {
        this.autoStopFired = true;
        this.onAutoStop?.("max-duration");
        this.vadRaf = requestAnimationFrame(tick);
        return;
      }

      if (elapsed < MIN_RECORDING_MS) {
        this.vadRaf = requestAnimationFrame(tick);
        return;
      }

      if (rms >= this.speechThreshold) {
        this.speechStarted = true;
        this.silenceSince = 0;
      } else if (this.speechStarted) {
        if (this.silenceSince === 0) {
          this.silenceSince = now;
        } else if (now - this.silenceSince >= SILENCE_HOLD_MS && !this.autoStopFired) {
          this.autoStopFired = true;
          this.onAutoStop?.("silence");
        }
      }

      this.vadRaf = requestAnimationFrame(tick);
    };
    this.vadRaf = requestAnimationFrame(tick);
  }

  private cleanupVad(): void {
    if (this.vadRaf) {
      cancelAnimationFrame(this.vadRaf);
      this.vadRaf = 0;
    }
    try {
      this.analyser?.disconnect();
    } catch {
      /* ignore */
    }
    if (this.vadCtx) {
      void this.vadCtx.close().catch(() => {});
    }
    this.analyser = null;
    this.vadBuffer = null;
    this.vadCtx = null;
  }

  private cleanupStream(): void {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }

  isRecording(): boolean {
    return this.recorder?.state === "recording";
  }
}
