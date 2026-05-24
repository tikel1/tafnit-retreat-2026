/**
 * Routes Gemini REST + Live calls either through the Cloudflare proxy
 * (secure — key stays on the worker) or directly with a client key
 * (local dev / legacy fallback).
 */

const DIRECT_HTTP = "https://generativelanguage.googleapis.com";
const LIVE_WS_PATH =
  "/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

function proxyBase(): string | null {
  const raw = import.meta.env.VITE_GEMINI_PROXY_URL;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().replace(/\/$/, "");
  return trimmed.length > 0 ? trimmed : null;
}

/** True when ChatTFNT should call the Cloudflare proxy (no client key). */
export function isProxyMode(): boolean {
  return proxyBase() !== null;
}

export function hasGeminiBackend(): boolean {
  if (isProxyMode()) return true;
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

/** REST URL for `:generateContent` (optional `?alt=sse` for streaming). */
export function buildGenerateContentUrl(
  model: string,
  apiKey: string,
  opts?: { stream?: boolean }
): string {
  const action = opts?.stream ? "streamGenerateContent" : "generateContent";
  const proxy = proxyBase();
  if (proxy) {
    const url = `${proxy}/v1beta/models/${model}:${action}`;
    return opts?.stream ? `${url}?alt=sse` : url;
  }
  const qs = new URLSearchParams();
  if (opts?.stream) qs.set("alt", "sse");
  qs.set("key", apiKey);
  return `${DIRECT_HTTP}/v1beta/models/${model}:${action}?${qs.toString()}`;
}

/** WebSocket URL for Gemini Live (BidiGenerateContent). */
export function buildLiveWebSocketUrl(apiKey: string): string {
  const proxy = proxyBase();
  if (proxy) {
    const wsBase = proxy.replace(/^http:\/\//i, "ws://").replace(/^https:\/\//i, "wss://");
    return `${wsBase}${LIVE_WS_PATH}`;
  }
  return `${DIRECT_HTTP.replace(/^https:\/\//i, "wss://")}${LIVE_WS_PATH}?key=${encodeURIComponent(apiKey)}`;
}
