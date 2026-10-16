import { Link, Navigate, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { loadSession, saveSession, type WorkshopAuth } from '../lib/workshopClient'
import './WorkersApp.css'

type MenuItem = { label: string; to: string; hint?: string }
type MenuGroup = { title: string; items: MenuItem[] }

function pageTitle(pathname: string, search: string, auth: WorkshopAuth | null): string {
  if (!auth) return 'Worker app'
  if (auth.role === 'worker') {
    if (pathname.includes('/settings')) return 'Settings'
    if (pathname.includes('/scan')) return 'Scan barcode'
    if (pathname.includes('/job/')) return 'Job detail'
    return 'My jobs'
  }
  if (pathname.includes('/post-order')) return 'Post order'
  if (pathname.includes('/labels')) return 'Print barcodes'
  if (pathname.includes('/process')) return 'Process tracking'
  if (pathname.includes('/machinery')) return 'Machinery'
  if (pathname.includes('/overview')) return 'Track everything'
  if (pathname.includes('/settings')) return 'Settings'
  if (pathname.includes('/orders/')) return 'Order detail'
  if (pathname.includes('/workers/')) return 'Worker detail'
  const tab = new URLSearchParams(search).get('tab')
  if (tab === 'orders') return 'All orders'
  if (tab === 'workers') return 'Workers'
  if (tab === 'activity') return 'Activity'
  return 'Live floor'
}

function managerMenu(): MenuGroup[] {
  return [
    {
      title: 'Overview',
      items: [
        { label: 'Live floor', to: '/workers/manage?tab=floor' },
        { label: 'Track everything', to: '/workers/manage/overview' },
      ],
    },
    {
      title: 'Orders',
      items: [
        { label: 'Post new order', to: '/workers/manage/post-order' },
        { label: 'All orders', to: '/workers/manage?tab=orders' },
      ],
    },
    {
      title: 'People',
      items: [
        { label: 'Workers', to: '/workers/manage?tab=workers', hint: 'Tap a worker for details' },
      ],
    },
    {
      title: 'Tracking',
      items: [
        { label: 'Track process', to: '/workers/manage/process' },
        { label: 'Track machinery', to: '/workers/manage/machinery' },
        { label: 'Activity', to: '/workers/manage?tab=activity' },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Settings', to: '/workers/manage/settings' },
      ],
    },
  ]
}

function workerMenu(): MenuGroup[] {
  return [
    {
      title: 'Jobs',
      items: [
        { label: 'My jobs', to: '/workers/home' },
        { label: 'Scan barcode', to: '/workers/home/scan', hint: 'Claim work from a label' },
      ],
    },
    {
      title: 'Account',
      items: [{ label: 'Settings', to: '/workers/home/settings' }],
    },
  ]
}

export function WorkersLayout() {
  const [auth, setAuth] = useState<WorkshopAuth | null>(() => loadSession())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    document.title = 'Floor ops'
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

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  const logout = useCallback(() => {
    saveSession(null)
    setAuth(null)
    setDrawerOpen(false)
    navigate('/workers', { replace: true })
  }, [navigate])

  const isManager = auth?.role === 'manager'
  const isWorker = auth?.role === 'worker'
  const title = pageTitle(location.pathname, location.search, auth)
  const menuGroups = isManager ? managerMenu() : isWorker ? workerMenu() : []

  return (
    <div className={`ws${drawerOpen ? ' ws--drawer-open' : ''}`}>
      <div className="ws__grain" aria-hidden="true" />
      <header className="ws__top">
        {auth && (
          <button
            type="button"
            className="ws-hamburger"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
        )}
        <div className="ws__brand">
          <img src="/brand/priyabadal-homes-logo.svg" alt="" className="ws__logo" />
          <div>
            <p className="ws__eyebrow">Floor ops</p>
            <h1 className="ws__title">{title}</h1>
          </div>
        </div>
        {auth && (
          <div className="ws__user">
            <span>
              {auth.role === 'manager' ? 'Manager' : auth.code} · {auth.name}
            </span>
          </div>
        )}
      </header>

      {auth && drawerOpen && (
        <>
          <button
            type="button"
            className="ws-drawer-overlay"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
          <nav className="ws-drawer" aria-label="Main navigation">
            <div className="ws-drawer__head">
              <div>
                <p className="ws-drawer__role">
                  {auth.role === 'manager' ? 'Floor manager' : auth.code}
                </p>
                <strong className="ws-drawer__name">{auth.name}</strong>
              </div>
              <button
                type="button"
                className="ws-drawer__close"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
              >
                ×
              </button>
            </div>

            {menuGroups.map((group) => (
              <div key={group.title} className="ws-drawer__group">
                <p className="ws-drawer__group-title">{group.title}</p>
                <ul className="ws-drawer__list">
                  {group.items.map((item) => {
                    const active =
                      location.pathname + location.search === item.to ||
                      (item.to.includes('?tab=') &&
                        location.pathname === '/workers/manage' &&
                        location.search === item.to.split('/workers/manage')[1])
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          className={active ? 'is-active' : ''}
                          onClick={() => setDrawerOpen(false)}
                        >
                          {item.label}
                          {item.hint && <span className="ws-drawer__hint">{item.hint}</span>}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}

            <div className="ws-drawer__foot">
              <button type="button" className="ws-drawer__signout" onClick={logout}>
                Sign out
              </button>
            </div>
          </nav>
        </>
      )}

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
