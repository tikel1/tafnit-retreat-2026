# Gemini proxy (Cloudflare Worker)

ChatTFNT calls this worker instead of Google directly. The **Gemini API key never ships in the static site**.

## One-time setup

1. Create a free [Cloudflare](https://dash.cloudflare.com/) account.
2. Create an API token with **Workers Edit** permission.
3. In GitHub → **Settings → Secrets and variables → Actions**, add:

   | Secret | Value |
   | --- | --- |
   | `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
   | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
   | `GEMINI_API_KEY` | Your Gemini key from [AI Studio](https://aistudio.google.com/apikey) |

4. Deploy once locally to learn your worker URL:

   ```bash
   cd worker
   npm install
   npx wrangler secret put GEMINI_API_KEY
   npm run deploy
   ```

   Note the URL, e.g. `https://tafnit-gemini-proxy.<account>.workers.dev`

5. In GitHub → **Settings → Secrets and variables → Actions → Variables**, add:

   | Variable | Value |
   | --- | --- |
   | `VITE_GEMINI_PROXY_URL` | `https://tafnit-gemini-proxy.<account>.workers.dev/gemini` |

6. Push to `main`. CI deploys the worker and builds the site with the proxy URL.

## Local dev

In `.env.local` at the repo root, set **either**:

```env
VITE_GEMINI_PROXY_URL=https://tafnit-gemini-proxy.<account>.workers.dev/gemini
```

or (less secure, dev server only — use `.env.development.local`, not `.env.local`):

```env
VITE_GEMINI_API_KEY=AIza...
```

Production builds strip `VITE_GEMINI_API_KEY` when `VITE_GEMINI_PROXY_URL` is set.

## Security

- Allowed browser origins are set in `wrangler.toml` (`ALLOWED_ORIGINS`).
- Rotate your Gemini key if it was ever committed to git or baked into an old bundle.
