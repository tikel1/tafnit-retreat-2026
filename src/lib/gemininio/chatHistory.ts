/**
 * Chat message shape + localStorage persistence.
 */

export type Role = "user" | "model";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  /** Unix ms. Used only for sort stability. */
  ts: number;
}

export type ChatTurn = { role: "user" | "model"; text: string };

export function completedTurnsForApi(
  messages: Array<{ role: "user" | "model"; text: string; streaming?: boolean }>
): ChatTurn[] {
  return messages
    .filter(
      (m) =>
        (m.role === "user" || m.role === "model") &&
        m.text.trim().length > 0 &&
        !m.streaming
    )
    .map((m) => ({ role: m.role, text: m.text.trim() }));
}

export function formatRecentChatBlock(turns: ChatTurn[], maxChars = 6000): string {
  const slice = turns.length > 20 ? turns.slice(-20) : turns;
  const lines = slice.map(
    (m) => `${m.role === "user" ? "User" : "ChatTFNT"}: ${m.text}`
  );
  let text = lines.join("\n");
  if (text.length > maxChars) {
    text = "…(earlier turns omitted)\n" + text.slice(text.length - maxChars + 28);
  }
  return text;
}

const STORAGE_KEY = "tafnit:chat-history:v1";

export function loadHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is ChatMessage =>
        m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "model") &&
        typeof m.content === "string"
    );
  } catch {
    return [];
  }
}

export function saveHistory(history: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    /* storage may be full / disabled — fail silently */
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function newMessage(role: Role, content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    ts: Date.now()
  };
}
