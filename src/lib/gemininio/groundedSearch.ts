/**
 * One-shot Gemini `generateContent`. Optionally attaches the Google
 * Search tool — only the REST path supports that; Gemini Live cannot
 * use the same tool bundle, which is why "ChatTFNT voice" and "web search"
 * are separate actions in the UI.
 */

import type { ChatTurn } from "./chatHistory";
import { buildGenerateContentUrl } from "./geminiEndpoint";

const MODELS_TO_TRY = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"] as const;

const MAX_REST_HISTORY_TURNS = 40;

function extractTextFromCandidate(candidate: unknown): string {
  if (!candidate || typeof candidate !== "object") return "";
  const c = candidate as { content?: { parts?: unknown[] } };
  const parts = c.content?.parts;
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

export interface GroundedReplyParams {
  apiKey: string;
  systemInstruction: string;
  userMessage: string;
  signal?: AbortSignal;
  useGoogleSearch?: boolean;
  history?: ChatTurn[];
}

/**
 * Returns the model's plain-text reply.
 */
export async function generateGroundedReply(params: GroundedReplyParams): Promise<string> {
  const useSearch = params.useGoogleSearch === true;
  let lastErr = "No model accepted the request.";

  const prior = (params.history ?? []).slice(-MAX_REST_HISTORY_TURNS);
  const contents: Array<{ role: string; parts: { text: string }[] }> = prior.map(
    m => ({ role: m.role, parts: [{ text: m.text }] })
  );
  contents.push({
    role: "user",
    parts: [{ text: params.userMessage }]
  });

  for (const model of MODELS_TO_TRY) {
    const url = buildGenerateContentUrl(model, params.apiKey);
    const body: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: params.systemInstruction }] },
      contents,
      generationConfig: {
        temperature: 0.45,
        maxOutputTokens: 1200
      }
    };
    if (useSearch) {
      body.tools = [{ google_search: {} }];
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: params.signal
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

    const root = json as {
      candidates?: unknown[];
      error?: { message?: string };
    };
    if (root.error?.message) {
      lastErr = root.error.message;
      continue;
    }

    const candidate = root.candidates?.[0];
    const text = extractTextFromCandidate(candidate);
    if (text) return text;

    const block = candidate as { finishReason?: string } | undefined;
    lastErr = block?.finishReason
      ? `Model stopped (${block.finishReason}). Try rephrasing.`
      : "Empty reply from model.";
  }

  throw new Error(lastErr);
}

export async function generateChatTitle(apiKey: string, firstMessage: string, lang: "en" | "he"): Promise<string> {
  const prompt =
    lang === "he"
      ? "כתוב כותרת קצרה מאוד (עד 5 מילים) לשיחה שמתחילה במשפט הבא. החזר רק את הכותרת, בלי מירכאות או נקודה בסוף:\n\n"
      : "Write a very short title (max 5 words) for a conversation starting with this message. Return ONLY the title, no quotes, no period:\n\n";

  for (const model of MODELS_TO_TRY) {
    const url = buildGenerateContentUrl(model, apiKey);
    const body = {
      contents: [{ role: "user", parts: [{ text: prompt + firstMessage }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 20 }
    };

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } catch {
      continue;
    }

    if (!res.ok) continue;

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      continue;
    }

    const root = json as { candidates?: unknown[]; error?: { message?: string } };
    if (root.error?.message) continue;

    const candidate = root.candidates?.[0];
    const text = extractTextFromCandidate(candidate);
    if (text) return text;
  }

  return lang === "he" ? "שיחה חדשה" : "New Chat";
}
