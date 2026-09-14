import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  fetchWorkerJobs,
  loadWsSettings,
  saveWsSettings,
  type WorkshopAuth,
  type WsLocalSettings,
} from '../lib/workshopClient'
import './WorkersApp.css'

type Ctx = { auth: WorkshopAuth | null; logout: () => void }

export function WorkerSettingsPage() {
  const { auth, logout } = useOutletContext<Ctx>()
  const workerId = auth?.role === 'worker' ? auth.workerId : ''
  const [workerBay, setWorkerBay] = useState('')
  const [settings, setSettings] = useState<WsLocalSettings>(() => loadWsSettings())

  useEffect(() => {
    if (!workerId) return
    void fetchWorkerJobs(workerId)
      .then((j) => setWorkerBay(j.worker.bay || ''))
      .catch(() => {})
  }, [workerId])

  if (!auth || auth.role !== 'worker') return null

  function toggle(key: keyof WsLocalSettings) {
    const next = { ...settings, [key]: !settings[key] }
    setSettings(next)
    saveWsSettings(next)
  }

  return (
    <main className="ws-home ws-page">
      <header className="ws-home__head">
        <div>
          <p className="ws-login__kicker">Account</p>
          <h2>Settings</h2>
        </div>
      </header>

      <section className="ws-panel ws-settings-block">
        <h3>Your profile</h3>
        <dl className="ws-profile-dl">
          <div><dt>Code</dt><dd>{auth.code}</dd></div>
          <div><dt>Name</dt><dd>{auth.name}</dd></div>
          <div><dt>Role</dt><dd>{auth.workerRole.replace(/_/g, ' ')}</dd></div>
          <div><dt>Bay</dt><dd>{workerBay || '—'}</dd></div>
        </dl>
      </section>

      <section className="ws-panel ws-settings-block">
        <h3>Preferences</h3>
        <label className="ws-toggle">
          <input type="checkbox" checked={settings.sound} onChange={() => toggle('sound')} />
          <span>Sound alerts (placeholder)</span>
        </label>
        <label className="ws-toggle">
          <input type="checkbox" checked={settings.vibration} onChange={() => toggle('vibration')} />
          <span>Vibration alerts (placeholder)</span>
        </label>
      </section>

      <section className="ws-panel ws-settings-block">
        <h3>Install on Android</h3>
        <ol className="ws-install-steps">
          <li>Open this page in Chrome on your phone.</li>
          <li>Tap menu (⋮) → <strong>Add to Home screen</strong>.</li>
          <li>Use the home-screen icon to open your jobs quickly.</li>
        </ol>
      </section>

      <section className="ws-panel ws-settings-block">
        <button type="button" className="ws__secondary ws-settings-signout" onClick={logout}>
          Sign out
        </button>
      </section>
    </main>
  )
}
