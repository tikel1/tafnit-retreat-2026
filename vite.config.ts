import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages needs `/tafnit-retreat-2026/`; local dev uses `/` so opening
// http://localhost:5173/ works (same as default Vite UX).
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyUrl = env.VITE_GEMINI_PROXY_URL?.trim()

  // When the Cloudflare proxy is configured, never bake a client API key into
  // the bundle — even if `.env.local` still has VITE_GEMINI_API_KEY for dev.
  const define =
    command === 'build' && proxyUrl
      ? { 'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify('') }
      : undefined

  return {
    plugins: [react(), tailwindcss()],
    base: command === "serve" ? "/" : "/tafnit-retreat-2026/",
    define,
  }
})
