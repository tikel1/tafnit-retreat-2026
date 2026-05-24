/**
 * Resolve a path under `public/` for the active Vite `base`.
 *
 * Dev serves at `/` (base = "/"); GitHub Pages at
 * `/tafnit-retreat-2026/` (base = "/tafnit-retreat-2026/").
 * Relative `./images/...` URLs break when the browser path doesn't
 * match — always go through this helper instead.
 */
export function assetUrl(path: string): string {
  const clean = path.replace(/^\.\//, "");
  const base = import.meta.env.BASE_URL;
  return `${base}${clean}`;
}
