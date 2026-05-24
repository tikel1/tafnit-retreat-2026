// One-shot fetcher for the Tafnit retreat photo set.
// Hits Wikipedia REST + Wikimedia Commons + Unsplash and saves into
// public/images/. Adapted from the tuscany-2026 script — same polite UA,
// retry/backoff, and gracefull failure (the app falls back to a styled
// placeholder when an image is missing).
//
// Run with:   node scripts/fetch-images.mjs
//
// Re-runs are idempotent — anything already on disk is skipped, so it's
// safe to iterate on the TARGETS list.

import { writeFile, mkdir, access } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "public", "images");

const UA =
  "Mozilla/5.0 (compatible; tafnit-retreat-2026/1.0; +https://github.com/tikel1)";

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url, opts = {}, tries = 4) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, opts);
      if (res.status === 429 || res.status >= 500) {
        const wait = 1500 * Math.pow(2, i);
        console.log(`  retry ${i + 1}/${tries} after ${wait}ms (HTTP ${res.status})`);
        await sleep(wait);
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      const wait = 1500 * Math.pow(2, i);
      await sleep(wait);
    }
  }
  if (lastErr) throw lastErr;
  throw new Error(`gave up after ${tries} attempts: ${url}`);
}

/** Bump a Wikimedia thumbnail URL to a wider width (when possible). */
function widenThumb(url, target = 1400) {
  return url.replace(/\/(\d+)px-([^/]+)$/, `/${target}px-$2`);
}

async function getWikiLeadImage(title) {
  const api = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetchWithRetry(api, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Wiki summary ${title} HTTP ${res.status}`);
  const data = await res.json();
  const original = data.originalimage?.source;
  const thumb = data.thumbnail?.source;
  if (original && (data.originalimage?.width ?? 0) <= 2400) return original;
  if (thumb) return widenThumb(thumb, 1400);
  if (original) return original;
  return null;
}

async function getCommonsFile(fileTitle, width) {
  const widthParam = width ? `&iiurlwidth=${width}` : "";
  const api =
    `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url${widthParam}&format=json&origin=*&titles=` +
    encodeURIComponent(fileTitle);
  const res = await fetchWithRetry(api, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Commons ${fileTitle} HTTP ${res.status}`);
  const data = await res.json();
  const pages = data?.query?.pages ?? {};
  const page = Object.values(pages)[0];
  const info = page?.imageinfo?.[0];
  return info?.thumburl ?? info?.url ?? null;
}

/** Sensibly-sized Unsplash JPG. We pin to specific photo IDs we've
 *  vetted as on-topic and freely licensed under the Unsplash license. */
const unsplash = (photoId, w = 1600) =>
  `https://images.unsplash.com/${photoId}?fm=jpg&q=85&w=${w}&auto=format&fit=crop`;

const FALLBACK_UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

async function downloadTo(url, dest) {
  let res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "image/*" },
  });
  if (res.status === 403 || res.status === 406) {
    res = await fetch(url, {
      headers: { "User-Agent": FALLBACK_UA, Accept: "image/*,*/*;q=0.8" },
    });
  }
  if (!res.ok) throw new Error(`Download ${url} HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf.byteLength;
}

async function resolveUrl(spec) {
  if (spec.url) return spec.url;
  if (spec.commons) return await getCommonsFile(spec.commons, spec.width);
  if (spec.wiki) return await getWikiLeadImage(spec.wiki);
  return null;
}

/**
 * Tafnit photo targets. Specs:
 *   { wiki: "Article_Title" }                  -> Wikipedia REST lead image
 *   { commons: "File:Some_File.jpg" }          -> Wikimedia Commons file (most reliable)
 *   { url: "https://..." }                     -> direct URL (Unsplash etc.)
 *
 * Order chosen so the most-visible images (the three venues + the two
 * day lead images + the spa) come first.
 */
const TARGETS = [
  // ---------- Venues — used by MapView popups + the StaysSection hero ----------
  // Azrieli — the iconic triangle tower shot, 2009 (Commons).
  ["azrieli.jpg", { commons: "File:Azrieli Center 2.jpg", width: 2000 }],
  // Marina Herzliya — official aerial of the basin and yachts (Commons).
  ["marina-herzliya.jpg", { commons: "File:Herzliya Marina Aerial View.jpg", width: 2000 }],
  // Dan Tel Aviv — the famously rainbow-striped façade by Yaacov Agam,
  // shot from the beach promenade. Iconic, immediately recognizable.
  ["dan-tel-aviv.jpg", { commons: "File:PikiWiki Israel 51690 dan hotel, tel aviv beach.jpg", width: 2000 }],

  // ---------- Day lead images ----------
  // Day 1 — sailing photos. The previous `boat.jpg` Unsplash ID was
  // actually a misty pine-forest photo (wrong copy-paste); kept around
  // for backwards-compat but no longer referenced from the itinerary.
  //
  // We pull two distinct sailing shots from Wikipedia article leads
  // (more reliable than guessing Unsplash IDs):
  //   sailing-hero.jpg  -> day lead, "יוצאים לים"
  //   sailing-deck.jpg  -> the שייט activity tile in the day schedule
  ["boat.jpg", { url: unsplash("photo-1469474968028-56623f02e42e") }],
  ["sailing-hero.jpg", { wiki: "Sailing" }],
  ["sailing-deck.jpg", { wiki: "Yacht" }],
  // Day 2's lead image now reuses `dan-tel-aviv.jpg` (the iconic Agam
  // rainbow façade fetched above) — it's the strongest "you're at Dan
  // Tel Aviv" signal in the whole photo set.

  // ---------- Spa — Via LOMAH header in the StaysSection sub-card ----------
  // Warm-lit treatment room / hot stones / orchids — generic but on-brand.
  ["via-lomah-spa.jpg", { url: unsplash("photo-1540555700478-4be289fbecef") }],

  // ---------- Atmospheric extras used by activity tiles / future galleries ----------
  // Hotel pool with sea horizon — for "אחר הצהריים — בריכה".
  ["pool.jpg", { url: unsplash("photo-1582719508461-905c673771fd") }],
  // Mobile espresso cart — for "עגלת קפה — מיקא".
  ["coffee-cart.jpg", { url: unsplash("photo-1442550528053-c431ecb55509") }],
  // Long candle-lit dinner table — for "ארוחת ערב חגיגית".
  ["dinner.jpg", { url: unsplash("photo-1414235077428-338989a2e8c0") }],
  // Israeli/Mediterranean breakfast spread — for Day 2 "ארוחת בוקר".
  ["breakfast.jpg", { url: unsplash("photo-1533089860892-a7c6f0a88666") }],
  // Tel Aviv beachfront skyline at dusk — bonus visual context.
  ["tel-aviv-skyline.jpg", { url: unsplash("photo-1547483036-24bc77c79804") }],
  // Stage / spotlight / microphone — for the mystery-guest evening teaser.
  ["mystery-stage.jpg", { url: unsplash("photo-1501386761578-eac5c94b800a") }],
];

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const [name, spec] of TARGETS) {
    const dest = resolve(OUT_DIR, name);
    if (await fileExists(dest)) {
      console.log(`= skip  ${name}  (already exists)`);
      skip++;
      continue;
    }
    try {
      const url = await resolveUrl(spec);
      if (!url) {
        console.log(`! miss  ${name}  (no image found for ${JSON.stringify(spec)})`);
        fail++;
        continue;
      }
      const bytes = await downloadTo(url, dest);
      console.log(`+ saved ${name}  ${(bytes / 1024).toFixed(0)} KB  <- ${url}`);
      ok++;
      await sleep(250);
    } catch (e) {
      console.log(`! fail  ${name}  ${e.message}`);
      fail++;
    }
  }

  console.log(`\nDone.  saved=${ok}  skipped=${skip}  failed=${fail}`);
  console.log(`Note: failed entries fall back to the styled placeholder in the app.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
