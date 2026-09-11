import { Navigate, Outlet, useNavigate, useOutletContext } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { loadSession, saveSession, type WorkshopAuth } from '../lib/workshopClient'
import './WorkersApp.css'

export function WorkersLayout() {
  const [auth, setAuth] = useState<WorkshopAuth | null>(() => loadSession())
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Priyabadal Workshop'
    const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null
    if (link) link.href = '/workers-manifest.webmanifest'
    const theme = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    if (theme) theme.content = '#1a2420'
    return () => {
      if (link) link.href = '/manifest.webmanifest'
      if (theme) theme.content = '#152019'
      document.title = 'Priyabadal Homes'
    }
  }, [])

  function logout() {
    saveSession(null)
    setAuth(null)
    navigate('/workers', { replace: true })
  }

  return (
    <div className="ws">
      <div className="ws__grain" aria-hidden="true" />
      <header className="ws__top">
        <div className="ws__brand">
          <img src="/brand/priyabadal-homes-logo.svg" alt="" className="ws__logo" />
          <div>
            <p className="ws__eyebrow">Workshop floor</p>
            <h1 className="ws__title">Worker app</h1>
          </div>
        </div>
        {auth && (
          <div className="ws__user">
            <span>
              {auth.role === 'manager' ? 'Manager' : auth.code} · {auth.name}
            </span>
            <button type="button" className="ws__ghost" onClick={logout}>
              Sign out
            </button>
          </div>
        )}
      </header>
      <Outlet context={{ auth, setAuth, logout }} />
    </div>
  )
}

export function RequireAuth({ role }: { role?: 'worker' | 'manager' }) {
  const auth = loadSession()
  const parent = useOutletContext<{
    auth: WorkshopAuth | null
    setAuth: (a: WorkshopAuth | null) => void
    logout: () => void
  }>()
  if (!auth) return <Navigate to="/workers" replace />
  if (role && auth.role !== role) {
    return <Navigate to={auth.role === 'manager' ? '/workers/manage' : '/workers/home'} replace />
  }
  return <Outlet context={parent} />
}
