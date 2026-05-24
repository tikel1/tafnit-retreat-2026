/**
 * Tiny localStorage shim for the Gemininio chat, with a fall-back to
 * a build-time env var so the site can ship with a default key.
 *
 * Resolution order (first non-empty wins):
 *   1. localStorage entry — a key the current visitor pasted.
 *   2. import.meta.env.VITE_GEMINI_API_KEY — baked in at build time.
 *   3. null — the setup screen asks the visitor for a key.
 */

const KEY = "tafnit2026.gemininio.apiKey";
const HISTORY_KEY = "tafnit2026.gemininio.history"; // legacy single-chat key
const CONVERSATIONS_KEY = "tafnit2026.gemininio.conversations";
const ACTIVE_CONV_ID_KEY = "tafnit2026.gemininio.activeConvId";

/** Build-time default key. */
const BUILD_KEY: string =
  typeof import.meta !== "undefined" &&
  typeof import.meta.env?.VITE_GEMINI_API_KEY === "string"
    ? (import.meta.env.VITE_GEMINI_API_KEY as string)
    : "";

/** Did we ship with a default key? */
export function hasBuildTimeKey(): boolean {
  return BUILD_KEY.trim().length > 0;
}

export function getApiKey(): string | null {
  const userKey = readUserKey();
  if (userKey) return userKey;
  return BUILD_KEY.trim() || null;
}

function readUserKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw && raw.trim() ? raw.trim() : null;
  } catch {
    return null;
  }
}

/** Did the user paste their own key? */
export function hasUserOverride(): boolean {
  return readUserKey() !== null;
}

export function setApiKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, key.trim());
  } catch {
    /* ignore */
  }
}

export function clearApiKey(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export interface PersistedMessage {
  role: "user" | "model";
  text: string;
  ts: number;
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
  messages: PersistedMessage[];
}

const MAX_HISTORY_PER_CONV = 30;

export function createId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/** Loads all conversations. */
export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CONVERSATIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(c => c && typeof c.id === "string" && Array.isArray(c.messages));
      }
    }

    // Try migrating old history
    const oldRaw = window.localStorage.getItem(HISTORY_KEY);
    if (oldRaw) {
      const parsed = JSON.parse(oldRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const msgs = parsed.filter(
          (m): m is PersistedMessage => m && (m.role === "user" || m.role === "model") && typeof m.text === "string"
        );
        if (msgs.length > 0) {
          const defaultConv: Conversation = {
            id: createId(),
            title: "שיחה חדשה",
            updatedAt: msgs[msgs.length - 1].ts || Date.now(),
            messages: msgs
          };
          window.localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify([defaultConv]));
          window.localStorage.removeItem(HISTORY_KEY);
          return [defaultConv];
        }
      }
    }
    return [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmedConvs = conversations.map(c => ({
      ...c,
      messages: c.messages.slice(-MAX_HISTORY_PER_CONV)
    }));
    window.localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(trimmedConvs));
  } catch {
    /* ignore */
  }
}

export function loadActiveConversationId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACTIVE_CONV_ID_KEY);
  } catch {
    return null;
  }
}

export function saveActiveConversationId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_CONV_ID_KEY, id);
  } catch {
    /* ignore */
  }
}

export function clearAllConversations(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CONVERSATIONS_KEY);
    window.localStorage.removeItem(ACTIVE_CONV_ID_KEY);
    window.localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

export function loadHistory(): PersistedMessage[] {
  const convs = loadConversations();
  if (convs.length === 0) return [];
  const activeId = loadActiveConversationId();
  const active = convs.find(c => c.id === activeId) || convs[0];
  return active.messages;
}

export function saveHistory(messages: PersistedMessage[]): void {
  let convs = loadConversations();
  let activeId = loadActiveConversationId();
  let activeIndex = convs.findIndex(c => c.id === activeId);

  if (activeIndex === -1 && convs.length > 0) {
    activeIndex = 0;
    activeId = convs[0].id;
  }

  if (activeIndex >= 0) {
    convs[activeIndex].messages = messages;
    convs[activeIndex].updatedAt = Date.now();
  } else {
    const newConv: Conversation = {
      id: createId(),
      title: "שיחה חדשה",
      updatedAt: Date.now(),
      messages
    };
    convs = [newConv];
    saveActiveConversationId(newConv.id);
  }

  saveConversations(convs);
}

export function clearHistory(): void {
  let convs = loadConversations();
  const activeId = loadActiveConversationId();
  convs = convs.filter(c => c.id !== activeId);
  saveConversations(convs);
  if (convs.length > 0) {
    saveActiveConversationId(convs[0].id);
  } else {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ACTIVE_CONV_ID_KEY);
    }
  }
}

export function getBuiltinKey(): string | undefined {
  return hasBuildTimeKey() ? (getApiKey() || undefined) : undefined;
}

export function getUserKey(): string | undefined {
  return hasUserOverride() ? (readUserKey() || undefined) : undefined;
}

export function setUserKey(key: string): void {
  setApiKey(key);
}

export function clearUserKey(): void {
  clearApiKey();
}

export function getActiveKey(): string | undefined {
  return getApiKey() || undefined;
}

export function shouldShowChatFab(): boolean {
  return getActiveKey() !== undefined;
}
