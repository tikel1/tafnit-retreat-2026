/**
 * One-shot voice → text transcription using Gemini's REST API.
 *
 * The mic flow uses MediaRecorder, then sends the blob to Gemini
 * `generateContent` with inline audio for transcription.
 */

import { buildGenerateContentUrl } from "./geminiEndpoint";

const TRANSCRIBE_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"] as const;

const TRANSCRIBE_PROMPT_EN =
  "Transcribe the spoken words in this audio clip verbatim. " +
  "Return only the transcription text — no quotes, no labels, no commentary. " +
  "If the audio contains no speech, return an empty string.";

const TRANSCRIBE_PROMPT_HE =
  "תמלל בדיוק את המילים המדוברות בקטע השמע הזה. " +
  "החזר רק את הטקסט המתומלל — בלי מירכאות, בלי תוויות, בלי הערות. " +
  "אם בקטע אין דיבור, החזר מחרוזת ריקה.";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unexpected FileReader result"));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

function extractText(json: unknown): string {
  const root = json as { candidates?: unknown[] };
  const candidate = root.candidates?.[0] as
    | { content?: { parts?: unknown[] } }
    | undefined;
  const parts = candidate?.content?.parts;
  if (!Array.isArray(parts)) return "";
  const chunks: string[] = [];
  for (const p of parts) {
    if (!p || typeof p !== "object") continue;
    if ((p as { thought?: boolean }).thought === true) continue;
    const text = (p as { text?: string }).text;
    if (typeof text === "string" && text.length) chunks.push(text);
  }
  return chunks.join("\n").trim();
}

export interface TranscribeParams {
  apiKey: string;
  audio: Blob;
  language: "en" | "he";
  signal?: AbortSignal;
}

export async function transcribeAudio(params: TranscribeParams): Promise<string> {
  const { apiKey, audio, language, signal } = params;

  if (!audio.size) {
    return "";
  }

  const base64 = await blobToBase64(audio);
  const mimeType = audio.type || "audio/webm";

  const prompt = language === "he" ? TRANSCRIBE_PROMPT_HE : TRANSCRIBE_PROMPT_EN;

  let lastErr = "Transcription failed.";

  for (const model of TRANSCRIBE_MODELS) {
    const url = buildGenerateContentUrl(model, apiKey);
    const body = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64 } }
          ]
        }
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 600
      }
    };

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal
      });
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      continue;
    }

    const raw = await res.text();
    if (!res.ok) {
      lastErr = raw.slice(0, 400) || `HTTP ${res.status}`;
      continue;
    }

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      lastErr = "Invalid JSON from Gemini.";
      continue;
    }

    const root = json as { error?: { message?: string } };
    if (root.error?.message) {
      lastErr = root.error.message;
      continue;
    }

    return extractText(json);
  }

  throw new Error(lastErr);
}
