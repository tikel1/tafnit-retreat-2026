/**
 * Capture `beforeinstallprompt` as early as possible. Chrome emits it
 * as a single-shot event — if listeners attach only inside React's
 * `useEffect`, it is often missed.
 */

/** Non-colliding global key consumed by `install.ts` after mount */
export const DEFERRED_BIP_GLOBAL = "__tafnitDeferredBip";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function setDeferredBip(ev: BeforeInstallPromptEvent | null): void {
  const w = window as unknown as Record<string, BeforeInstallPromptEvent | null | undefined>;
  if (ev == null) {
    delete w[DEFERRED_BIP_GLOBAL];
  } else {
    w[DEFERRED_BIP_GLOBAL] = ev;
  }
}

export function bootstrapInstallPromptCapture(): void {
  if (typeof window === "undefined") return;
  window.addEventListener(
    "beforeinstallprompt",
    (e: Event) => {
      e.preventDefault();
      setDeferredBip(e as BeforeInstallPromptEvent);
      window.dispatchEvent(new Event("tafnit:bip-deferred-ready"));
    },
    { passive: false }
  );
}

/** Move queued event into app ownership. Safe once on hook mount */
export function takeDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, BeforeInstallPromptEvent | undefined>;
  const ev = w[DEFERRED_BIP_GLOBAL];
  if (!ev) return null;
  delete w[DEFERRED_BIP_GLOBAL];
  return ev;
}
