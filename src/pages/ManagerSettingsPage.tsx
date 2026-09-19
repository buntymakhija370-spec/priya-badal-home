import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import {
  loadWsSettings,
  resetWorkshop,
  saveWsSettings,
  type WorkshopAuth,
  type WsLocalSettings,
} from '../lib/workshopClient'
import './WorkersApp.css'

type Ctx = { auth: WorkshopAuth | null }

export function ManagerSettingsPage() {
  const { auth } = useOutletContext<Ctx>()
  const pin = auth?.role === 'manager' ? auth.pin : ''
  const [settings, setSettings] = useState<WsLocalSettings>(() => loadWsSettings())
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!auth || auth.role !== 'manager') return null

  function toggle(key: keyof WsLocalSettings) {
    const next = { ...settings, [key]: !settings[key] }
    setSettings(next)
    saveWsSettings(next)
  }

  async function onReset() {
    if (!pin) return
    if (!window.confirm('Reset demo floor data (60 workers + sample orders + machines)?')) return
    setBusy(true)
    setMsg(null)
    try {
      await resetWorkshop(pin)
      setMsg('Demo floor reset — machines reseeded')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="ws-mgr ws-page">
      <header className="ws-detail-head">
        <div>
          <p className="ws-login__kicker">Account</p>
          <h2>Settings</h2>
        </div>
      </header>

      {msg && <p className="ws-banner">{msg}</p>}

      <section className="ws-panel ws-settings-block">
        <h3>Shop</h3>
        <p className="ws-settings-shop">Floor ops</p>
        <p className="ws-muted">Manager app for live orders, workers, and machinery.</p>
      </section>

      <section className="ws-panel ws-settings-block">
        <h3>Preferences</h3>
        <label className="ws-toggle">
          <input
            type="checkbox"
            checked={settings.sound}
            onChange={() => toggle('sound')}
          />
          <span>Sound alerts (placeholder)</span>
        </label>
        <label className="ws-toggle">
          <input
            type="checkbox"
            checked={settings.vibration}
            onChange={() => toggle('vibration')}
          />
          <span>Vibration alerts (placeholder)</span>
        </label>
      </section>

      <section className="ws-panel ws-settings-block">
        <h3>Install on Android</h3>
        <ol className="ws-install-steps">
          <li>Open this page in Chrome on the workshop phone.</li>
          <li>Tap the menu (⋮) → <strong>Add to Home screen</strong> or <strong>Install app</strong>.</li>
          <li>Confirm — the workshop icon will appear like a native app.</li>
        </ol>
      </section>

      <section className="ws-panel ws-settings-block ws-settings-actions">
        <Link to="/workers/manage?tab=floor" className="ws__secondary">
          Go to live floor
        </Link>
        <button type="button" className="ws__secondary" onClick={() => void onReset()} disabled={busy}>
          Reset demo data
        </button>
      </section>
    </main>
  )
}
