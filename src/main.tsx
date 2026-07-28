import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

function markStandalone() {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  document.documentElement.classList.toggle('is-standalone', standalone)
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  // Only register on production builds / preview — keep HMR simple in Vite
  if (import.meta.env.DEV) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline install is best-effort */
    })
  })
}

markStandalone()
registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
