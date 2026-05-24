import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { bootstrapInstallPromptCapture } from './lib/installBootstrap'
import { LangProvider } from './lib/i18n'

// Capture Chromium's one-shot install event before React hydrates (`install.ts`).
bootstrapInstallPromptCapture()

// Minimal SW — required by Chrome installability checklist; enables reliable
// `beforeinstallprompt`. See `public/sw.js` (network-only passes through).
function registerMinimalServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  const swUrl = `${import.meta.env.BASE_URL}sw.js`
  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register(swUrl, { scope: import.meta.env.BASE_URL })
      .catch(() => {
        /* non-fatal */
      })
  })
}
registerMinimalServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </StrictMode>,
)
