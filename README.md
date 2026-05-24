# נופש חברה תפנית · Tafnit Retreat 2026

אפליקציית-ווב סטטית, mobile-first, לנופש החברה של **תפנית** — **4–5 ביוני 2026**, בין עזריאלי / מרינה הרצליה למלון דן תל אביב. בפנים: לוח זמנים, מפה אינטראקטיבית, פרטי המלון והספא Via LOMAH, טיפים מקומיים, צ׳ק־ליסט אישי, וצ׳אט עם **ChatTFNT** — מארח הנופש הווירטואלי (Gemini).

הריפו הזה הוא תאומה של [`tuscany-2026`](../tuscany-2026): אותו stack, אותם דפוסי PWA, אבל בעברית בלבד ועם זהות מותג של תפנית.

> **לפרטי אדריכלות מלאים, ראו את המסמך המקור** [`docs/HOW_TO_BUILD_A_VACATION_WEBSITE.md`](../tuscany-2026/docs/HOW_TO_BUILD_A_VACATION_WEBSITE.md) שב-`tuscany-2026`. כאן רק ההבדלים הספציפיים לפרויקט הזה.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 (palette: Tafnit navy, mint, cream)
- Heebo + Assistant — Hebrew web fonts (Google Fonts)
- React Leaflet + CartoDB Voyager tiles (no API key)
- Lucide icons + Framer Motion
- Gemini REST API for the in-app chat (**ChatTFNT**)
- PWA (manifest + minimal SW + custom install prompt) — installable on iOS & Android

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run preview  # preview the production build locally
npm run lint     # ESLint flat config
```

`vite.config.ts` switches the `base` path between local dev (`/`) and the GitHub Pages deploy (`/tafnit-retreat-2026/`) automatically.

## Environment variables

Copy `.env.example` to `.env.local` and fill in any keys you have. The AI chat (ChatTFNT) needs `VITE_GEMINI_API_KEY`; everything else boots without any keys.

| Variable | Used by | Notes |
| --- | --- | --- |
| `VITE_GEMINI_API_KEY` | ChatTFNT (in-app chat) | Baked into the bundle at build time. Restrict by HTTP referrer in [AI Studio](https://aistudio.google.com/). Leave blank to fall back to per-visitor pasted keys. |

When the key is **absent** at build time, the site still works in full — the chat sheet asks each visitor to paste their own free Gemini key.

## Content lives in `src/data/`

All copy is in plain TypeScript — no CMS, no database. Edit a file, push, and GitHub Actions rebuilds and redeploys.

| File | What's in it |
| --- | --- |
| `src/data/itinerary.ts` | The two-day plan (`activities`, `dayTips`, lead image). |
| `src/data/venues.ts` | Azrieli, Marina Herzliya, Dan Tel Aviv — coords + addresses. |
| `src/data/stays.ts` | Dan Tel Aviv stay (check-in/out, highlights, linked spa). |
| `src/data/spa.ts` | Via LOMAH spa details (hours, phone, WhatsApp, booking note). |
| `src/data/tips.ts` | Practical know-how (spa booking, boat attire, Shabbat entry times). |
| `src/data/checklist.ts` | Packing checklist (persisted per-visitor in localStorage). |
| `src/lib/dict.ts` | All UI strings (Hebrew only). |
| `src/lib/gemininio/persona.ts` | The **ChatTFNT** persona + hard-coded retreat facts + mystery-guest guardrail. |

### Mystery guest

The Day-1 evening artist is a **deliberate surprise**. `src/lib/gemininio/persona.ts` instructs ChatTFNT to **never** name, guess, or hint at the performer — and `MysteryGuestCard.tsx` carries the same teaser into the UI. If you want to reveal the guest after the retreat, edit those two files together.

### Adding photos

Image fields point to `./images/<slug>.jpg|png`. Drop your own files into `public/images/` with matching names. Always use **relative** paths (`./images/...`) so they resolve correctly under the GH Pages base path.

The current shipping art:

- `public/images/hero/` — the four "brain of the retreat" key-art shots that crossfade behind the hero (summer, captain, cruise water, spa).
- `public/images/hero-key-art.png` — the original 3-D textured brain used in the install-prompt banner + as the OG source.
- `public/images/flyer-tafnit-retreat.png` — the original Hebrew flyer.
- `public/app-icon-source.png` — the flat brain logotype. Re-run `node scripts/generate-icons.mjs` after editing this file to regenerate the favicon / PWA icon family.
- `public/images/og-cover.jpg` — generated once via `node scripts/generate-og.mjs`.

## Deploying

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds with `VITE_GEMINI_API_KEY` (if set as a repo secret) and publishes `dist/` to GitHub Pages.

1. Create a public repo named `tafnit-retreat-2026`.
2. *Settings → Pages → Build and deployment → Source = GitHub Actions.*
3. *Settings → Secrets and variables → Actions → New repository secret* → `VITE_GEMINI_API_KEY` (optional).
4. `git push origin main`.

The site lands at `https://<owner>.github.io/tafnit-retreat-2026/`.

## Installing on a phone (visitors)

- **iOS**: Safari → Share → *Add to Home Screen*.
- **Android Chrome**: tap the navy "התקנה" bar at the bottom, then *Install*.

The in-app `InstallPrompt` autodetects the platform and shows the matching instructions in Hebrew.
