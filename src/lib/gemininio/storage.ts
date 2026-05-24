/**
 * Per-device storage for the user-supplied Gemini API key.
 *
 * The site exposes a built-in `VITE_GEMINI_API_KEY` at build time. If
 * that's missing, the user can paste their own key on the chat setup
 * screen. We persist that personal key in localStorage so they don't
 * have to paste it every session.
 */

const KEY_STORAGE = "tafnit:gemini-key:v1";

/** The build-time key baked into the bundle. May be empty. */
export function getBuiltinKey(): string | undefined {
  const raw = (import.meta.env.VITE_GEMINI_API_KEY ?? "").trim();
  return raw.length > 0 ? raw : undefined;
}

/** The key the user pasted on this device, if any. */
export function getUserKey(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = (localStorage.getItem(KEY_STORAGE) ?? "").trim();
    return raw.length > 0 ? raw : undefined;
  } catch {
    return undefined;
  }
}

export function setUserKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY_STORAGE, key.trim());
  } catch {
    /* ignore */
  }
}

export function clearUserKey(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* ignore */
  }
}

/** Resolve the effective key: built-in first, then user-supplied. */
export function getActiveKey(): string | undefined {
  return getBuiltinKey() ?? getUserKey();
}

/** Whether the chat UI should be shown at all. We hide the FAB cleanly
 *  if there's no built-in key AND no user key (and no setup form
 *  flowing — the form is only useful when at least one of them is
 *  configurable). For this build we hide on "no built-in key" — the
 *  user-pasted key path stays available but isn't surfaced as a FAB
 *  to avoid confusing employees who don't have a Gemini key handy. */
export function shouldShowChatFab(): boolean {
  return getActiveKey() !== undefined;
}
