/**
 * Streaming text generation against the Gemini REST API.
 *
 * Slim, voice-free wrapper — sends the conversation as `contents` with
 * the ChatTFNT persona as `systemInstruction`, and yields each chunk of the
 * model's reply via an async iterator. Falls back to a single non-stream
 * response if the streaming endpoint fails for any reason.
 */

import type { ChatMessage } from "./chatHistory";
import { CHATTFNT_PERSONA } from "./persona";

const MODEL = "gemini-2.0-flash";
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function toContents(history: ChatMessage[]) {
  return history.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }]
  }));
}

/** Convenience: collect the streaming reply into a single string. */
export async function generateReply(
  apiKey: string,
  history: ChatMessage[]
): Promise<string> {
  const out: string[] = [];
  for await (const chunk of streamReply(apiKey, history)) {
    out.push(chunk);
  }
  return out.join("");
}

/** Async-iterable stream of token chunks from Gemini. */
export async function* streamReply(
  apiKey: string,
  history: ChatMessage[]
): AsyncGenerator<string, void, unknown> {
  const url = `${BASE}/${MODEL}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: toContents(history),
    systemInstruction: {
      role: "system",
      parts: [{ text: CHATTFNT_PERSONA }]
    },
    generationConfig: {
      temperature: 0.6,
      topP: 0.9,
      maxOutputTokens: 800
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok || !res.body) {
    throw new Error(`gemini ${res.status}: ${await res.text().catch(() => "")}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    // SSE — events separated by blank lines.
    const events = buf.split(/\r?\n\r?\n/);
    buf = events.pop() ?? "";
    for (const ev of events) {
      const dataLine = ev
        .split(/\r?\n/)
        .find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      const payload = dataLine.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        const text =
          json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ??
          "";
        if (text) yield text;
      } catch {
        /* swallow parse errors mid-stream */
      }
    }
  }
}
