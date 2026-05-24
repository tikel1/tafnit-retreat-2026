/**
 * Tiny pub/sub for "open the Gemininio panel from anywhere on the page".
 */

const EVENT_NAME = "gemininio:open";

export function requestOpenGemininio(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* ignore */
  }
}

export function subscribeOpenGemininio(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = () => handler();
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
