/**
 * Minimal service worker — no offline caching strategy.
 *
 * Chromium-based browsers require a SW with a fetch handler for the
 * PWA installability checklist and reliable `beforeinstallprompt`.
 * Requests pass straight through (network-only behaviour).
 */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
