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

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  // Production / preview builds only (not Vite HMR dev)
  if (import.meta.env.DEV) return
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    // Pick up fresh event builds quickly
    reg.update().catch(() => undefined)
  } catch {
    /* install is best-effort */
  }
}

markStandalone()
void registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
