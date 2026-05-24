import { useEffect, useRef, useState } from "react";

import { takeDeferredInstallPrompt } from "./installBootstrap";

/* =====================================================================
 * Add-to-Home-Screen (A2HS) plumbing
 * ---------------------------------------------------------------------
 * The browser story is split clean down the middle:
 *
 *  - Android Chrome / Edge / desktop Chrome:
 *      Fires `beforeinstallprompt`. We capture the event, suppress the
 *      default mini-infobar, and re-fire it from our own button so the
 *      install dialog is one tap away inside our prompt.
 *
 *  - iOS Safari:
 *      No install API at all. Apple insists the user goes through the
 *      Share sheet → "Add to Home Screen". We can't trigger anything;
 *      the best we can do is show illustrated steps.
 *
 *  - iOS Chrome / Firefox / Edge:
 *      A2HS is gated to Safari on iOS. We tell the user to switch.
 *
 * Plus a respectful "don't show again" + soft-snooze stored in
 * localStorage so the popup isn't a nag.
 * ===================================================================== */

export type Platform =
  | "ios-safari"
  | "ios-other"
  | "android"
  | "desktop-chromium"
  | "other";

export type IOSDevice = "iphone" | "ipad";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/* ---------- Platform detection ---------- */

function ua(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent || "";
}

/** True for both classic iPhone/iPad UAs and iPadOS 13+ (which lies and
 *  reports Mac, but exposes touch points). */
function isIOS(): boolean {
  const u = ua();
  if (/iPad|iPhone|iPod/.test(u)) return true;
  // iPadOS 13+ desktop-class UA
  return /Macintosh/.test(u) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1;
}

export function detectIOSDevice(): IOSDevice {
  const u = ua();
  if (/iPhone|iPod/.test(u)) return "iphone";
  if (/iPad/.test(u)) return "ipad";
  // iPadOS-as-Mac case
  if (/Macintosh/.test(u) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1) {
    return "ipad";
  }
  return "iphone";
}

function isIOSNonSafari(): boolean {
  return /CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/.test(ua());
}

function isAndroid(): boolean {
  return /Android/.test(ua());
}

export function detectPlatform(): Platform {
  if (isIOS()) return isIOSNonSafari() ? "ios-other" : "ios-safari";
  if (isAndroid()) return "android";
  if (typeof navigator !== "undefined" && /Chrome|Edg|OPR/.test(ua())) {
    return "desktop-chromium";
  }
  return "other";
}

/* ---------- "Already installed" detection ---------- */

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS legacy flag
  const navAny = navigator as Navigator & { standalone?: boolean };
  return navAny.standalone === true;
}

/* ---------- Mobile-only gate ---------- */

const MOBILE_MAX_VIEWPORT = 1024;

export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_MAX_VIEWPORT;
}

export function isLikelyMobile(): boolean {
  if (typeof window === "undefined") return false;
  if (!isMobileViewport()) return false;

  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const hasTouch =
    (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0) ||
    "ontouchstart" in window;

  return coarsePointer && hasTouch;
}

/* ---------- Persistence ---------- */

const STORAGE_KEY = "tafnit:a2hs-prefs:v1";
const SOFT_DISMISS_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

interface Prefs {
  neverShow?: boolean;
  dismissedAt?: number;
}

function readPrefs(): Prefs {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as Prefs;
    return {};
  } catch {
    return {};
  }
}

function writePrefs(p: Prefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* storage may be full / blocked — fail quietly */
  }
}

function isSnoozed(p: Prefs): boolean {
  if (p.neverShow) return true;
  if (typeof p.dismissedAt === "number" && Date.now() - p.dismissedAt < SOFT_DISMISS_MS) {
    return true;
  }
  return false;
}

/* ---------- Manual / imperative trigger ---------- */

const FORCE_OPEN_EVENT = "tafnit:a2hs:force-open";

export function triggerInstallPrompt(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(FORCE_OPEN_EVENT));
}

export function canShowInstallOption(): boolean {
  if (typeof window === "undefined") return false;
  if (isStandalone()) return false;
  const p = detectPlatform();
  return p === "ios-safari" || p === "ios-other" || p === "android";
}

/* ---------- The hook ---------- */

export interface InstallPromptApi {
  open: boolean;
  platform: Platform;
  iosDevice: IOSDevice;
  canNativeInstall: boolean;
  install: () => Promise<"accepted" | "dismissed" | null>;
  dismiss: () => void;
  dismissForever: () => void;
}

interface Options {
  openDelayMs?: number;
}

export function useInstallPrompt(opts: Options = {}): InstallPromptApi {
  const { openDelayMs = 6000 } = opts;

  const [open, setOpen] = useState(false);
  const [platform] = useState<Platform>(() => detectPlatform());
  const [iosDevice] = useState<IOSDevice>(() => detectIOSDevice());
  const [canNativeInstall, setCanNativeInstall] = useState(false);
  const bipRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const queued = takeDeferredInstallPrompt();
    if (queued) {
      bipRef.current = queued;
      queueMicrotask(() => setCanNativeInstall(true));
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      bipRef.current = e as BeforeInstallPromptEvent;
      setCanNativeInstall(true);
    };
    const onInstalled = () => {
      bipRef.current = null;
      setCanNativeInstall(false);
      setOpen(false);
      writePrefs({ ...readPrefs(), neverShow: true });
    };

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!isMobileViewport()) return;

    if (platform === "other") return;
    if (platform === "desktop-chromium") return;
    const uaTrustedMobilePhone =
      platform === "android" || platform === "ios-safari" || platform === "ios-other";
    if (!uaTrustedMobilePhone && !isLikelyMobile()) return;
    if (isStandalone()) return;
    if (isSnoozed(readPrefs())) return;

    const id = window.setTimeout(() => {
      if (!isMobileViewport()) return;
      if (isStandalone()) return;
      if (isSnoozed(readPrefs())) return;
      if (!uaTrustedMobilePhone && !isLikelyMobile()) return;
      setOpen(true);
    }, openDelayMs);

    return () => window.clearTimeout(id);
  }, [platform, openDelayMs]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onResize = () => {
      if (!isMobileViewport()) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onForce = () => {
      if (isStandalone()) return;
      setOpen(true);
    };
    window.addEventListener(FORCE_OPEN_EVENT, onForce);
    return () => window.removeEventListener(FORCE_OPEN_EVENT, onForce);
  }, []);

  const install: InstallPromptApi["install"] = async () => {
    const evt = bipRef.current;
    if (!evt) return null;
    try {
      await evt.prompt();
      const choice = await evt.userChoice;
      bipRef.current = null;
      setCanNativeInstall(false);
      if (choice.outcome === "accepted") {
        setOpen(false);
      }
      return choice.outcome;
    } catch {
      return null;
    }
  };

  const dismiss = () => {
    writePrefs({ ...readPrefs(), dismissedAt: Date.now() });
    setOpen(false);
  };

  const dismissForever = () => {
    writePrefs({ ...readPrefs(), neverShow: true, dismissedAt: Date.now() });
    setOpen(false);
  };

  return { open, platform, iosDevice, canNativeInstall, install, dismiss, dismissForever };
}
