import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  BOXBHANDAAR_BRAND,
  BOXBHANDAAR_WA_DISPLAY,
  boxWhatsAppUrl,
} from '../data/boxbhandaar'
import './BoxbhandaarLayout.css'

export function BoxbhandaarLayout() {
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const onHome = location.pathname === '/boxbhandaar' || location.pathname === '/boxbhandaar/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.documentElement.classList.add('bb-root')
    document.title = `${BOXBHANDAAR_BRAND} — Festive boxes`
    return () => {
      document.documentElement.classList.remove('bb-root')
      document.title = 'Priyabadal Homes'
    }
  }, [])

  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null
    const targetId = location.hash.replace(/^#/, '') || state?.scrollTo
    if (targetId) {
      const tryScroll = (attempt = 0) => {
        const el = document.getElementById(targetId)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          return
        }
        if (attempt < 8) window.setTimeout(() => tryScroll(attempt + 1), 50)
      }
      requestAnimationFrame(() => tryScroll())
      return
    }
    window.scrollTo(0, 0)
  }, [location.pathname, location.hash, location.state])

  return (
    <div className="bb">
      <header
        className={`bb-nav ${scrolled || !onHome ? 'bb-nav--scrolled' : ''}`}
      >
        <NavLink className="bb-nav__brand" to="/boxbhandaar" end>
          <img
            className="bb-nav__mark"
            src="/brand/boxbhandaar-mark.svg"
            alt=""
            aria-hidden="true"
          />
          <span>{BOXBHANDAAR_BRAND}</span>
        </NavLink>
        <nav className="bb-nav__links" aria-label="Boxbhandaar">
          <NavLink to="/boxbhandaar#boxes">Boxes</NavLink>
          <NavLink to="/boxbhandaar#films">Films</NavLink>
          <a
            className="bb-nav__order"
            href={boxWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            Order
          </a>
        </nav>
      </header>

      <Outlet />

      <footer className="bb-footer">
        <div className="bb-footer__brand">
          <p className="bb-footer__name">{BOXBHANDAAR_BRAND}</p>
          <p className="bb-footer__note">Limited festive boxes · Made to gift</p>
        </div>
        <div className="bb-footer__meta">
          <a href={boxWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
            WhatsApp {BOXBHANDAAR_WA_DISPLAY}
          </a>
          <NavLink to="/">Priyabadal Homes</NavLink>
        </div>
      </footer>
    </div>
  )
}
