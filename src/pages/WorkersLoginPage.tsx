import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { workshopLogin, type WorkshopAuth } from '../lib/workshopClient'
import './WorkersApp.css'

type Ctx = {
  auth: WorkshopAuth | null
  setAuth: (a: WorkshopAuth | null) => void
}

export function WorkersLoginPage() {
  const { auth, setAuth } = useOutletContext<Ctx>()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [role, setRole] = useState<'worker' | 'manager'>(() =>
    params.get('role') === 'manager' ? 'manager' : 'worker',
  )
  const [code, setCode] = useState(params.get('code') || 'W01')
  const [pin, setPin] = useState(params.get('pin') || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [installHint, setInstallHint] = useState(false)

  useEffect(() => {
    if (params.get('role') === 'manager') setRole('manager')
    if (params.get('code')) setCode(params.get('code')!.toUpperCase())
    if (params.get('pin')) setPin(params.get('pin')!)
  }, [params])

  if (auth?.role === 'worker') return <Navigate to="/workers/home" replace />
  if (auth?.role === 'manager') return <Navigate to="/workers/manage" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const session = await workshopLogin({
        role,
        code: role === 'worker' ? code : undefined,
        pin,
      })
      setAuth(session)
      navigate(session.role === 'manager' ? '/workers/manage' : '/workers/home', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="ws-login">
      <section className="ws-login__hero">
        <p className="ws-login__kicker">Priyabadal Homes</p>
        <h2>Floor orders on every phone</h2>
        <p>
          Managers assign cutting, pasting, colouring, finishing, QC, and dispatch. Workers open
          their job, post what they are doing, and close their stage with a clear trail.
        </p>
        <button type="button" className="ws__ghost" onClick={() => setInstallHint((v) => !v)}>
          Install on Android
        </button>
        {installHint && (
          <ol className="ws-login__install">
            <li>Open this page in Chrome on the worker phone.</li>
            <li>Tap the menu → <strong>Add to Home screen</strong> / Install app.</li>
            <li>Sign in with worker code (W01–W60) and PIN.</li>
          </ol>
        )}
      </section>

      <form className="ws-login__form" onSubmit={onSubmit}>
        <fieldset className="ws-seg">
          <legend className="sr-only">Sign in as</legend>
          <label className={role === 'worker' ? 'is-on' : ''}>
            <input
              type="radio"
              name="ws-role"
              value="worker"
              checked={role === 'worker'}
              onChange={() => setRole('worker')}
            />
            Worker
          </label>
          <label className={role === 'manager' ? 'is-on' : ''}>
            <input
              type="radio"
              name="ws-role"
              value="manager"
              checked={role === 'manager'}
              onChange={() => setRole('manager')}
            />
            Manager
          </label>
        </fieldset>

        {role === 'worker' && (
          <label>
            Worker code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              autoComplete="username"
              placeholder="W01"
              required
            />
          </label>
        )}

        <label>
          {role === 'manager' ? 'Manager PIN' : 'PIN'}
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoComplete="current-password"
            placeholder={role === 'manager' ? '2468' : '••••'}
            required
          />
        </label>

        {error && <p className="ws-error">{error}</p>}

        <button type="submit" className="ws__primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Enter floor'}
        </button>

        <p className="ws-login__hint">
          Demo: worker <code>W01</code> PIN from roster on manager board · manager PIN{' '}
          <code>2468</code>
        </p>
      </form>
    </main>
  )
}
