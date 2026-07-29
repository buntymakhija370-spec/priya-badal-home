import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { isWorkshopAuthed, setWorkshopAuthed, WORKSHOP_PIN } from './api'
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

  useEffect(() => {
    document.body.classList.add('workshop-body')
    return () => document.body.classList.remove('workshop-body')
  }, [])

  if (!authed) {
    return (
      <div className="ws-login">
        <div className="ws-login__card">
          <p className="ws-login__eyebrow">Priyabadal Homes</p>
          <h1>Workshop Panel</h1>
          <p className="ws-login__lede">
            Manufacturing · channel partners · production & dispatch copies
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (pin.trim() === WORKSHOP_PIN) {
                setWorkshopAuthed(true)
                setAuthed(true)
                setError('')
              } else {
                setError('Wrong PIN. Ask workshop admin.')
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
              />
            </label>
            {error ? <p className="ws-login__error">{error}</p> : null}
            <button type="submit" className="ws-btn ws-btn--primary">
              Enter workshop
            </button>
          </form>
          <p className="ws-login__hint">Demo PIN: 2468 · change before production go-live</p>
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
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ws-side__foot">
          <a href="/" target="_blank" rel="noreferrer">
            Open website
          </a>
          <button
            type="button"
            onClick={() => {
              setWorkshopAuthed(false)
              setAuthed(false)
            }}
          >
            Lock panel
          </button>
        </div>
      </aside>
      <div className="ws-main">
        <Outlet />
      </div>
    </div>
  )
}
