import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { isWorkshopAuthed, staffLogin, staffLogout } from './api'
import './workshop.css'

const nav = [
  { to: '/workshop', end: true, label: 'Dashboard' },
  { to: '/workshop/orders', label: 'Orders' },
  { to: '/workshop/new-order', label: 'New order' },
  { to: '/workshop/departments', label: 'Departments' },
  { to: '/workshop/partners', label: 'Partners' },
  { to: '/workshop/display', label: 'Floor display' },
]

export function WorkshopLayout() {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(isWorkshopAuthed())
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.body.classList.add('workshop-body')
    return () => document.body.classList.remove('workshop-body')
  }, [])

  if (!authed) {
    return (
      <div className="ws-login">
        <div className="ws-login__card">
          <p className="ws-login__eyebrow">Priyabadal Homes · Private</p>
          <h1>Workshop Panel</h1>
          <p className="ws-login__lede">
            Staff only. Orders, CNC, paint booth, dispatch, and accounts stay behind this login.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setLoading(true)
              setError('')
              try {
                await staffLogin(pin.trim())
                setAuthed(true)
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Login failed')
              } finally {
                setLoading(false)
              }
            }}
          >
            <label>
              Staff PIN
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                autoFocus
                autoComplete="current-password"
              />
            </label>
            {error ? <p className="ws-login__error">{error}</p> : null}
            <button type="submit" className="ws-btn ws-btn--primary" disabled={loading}>
              {loading ? 'Checking…' : 'Enter workshop'}
            </button>
          </form>
          <p className="ws-login__hint">
            Ask admin for staff PIN. Demo PIN still works in this preview environment.
          </p>
          <button type="button" className="ws-linkish" onClick={() => navigate('/')}>
            ← Back to website
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="ws-shell">
      <aside className="ws-side">
        <div className="ws-side__brand">
          <strong>Priyabadal</strong>
          <span>Workshop Ops</span>
        </div>
        <nav className="ws-side__nav" aria-label="Workshop">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          className="ws-btn ws-btn--ghost"
          style={{ margin: '1rem' }}
          onClick={async () => {
            await staffLogout()
            setAuthed(false)
          }}
        >
          Sign out
        </button>
      </aside>
      <div className="ws-main">
        <Outlet />
      </div>
    </div>
  )
}
