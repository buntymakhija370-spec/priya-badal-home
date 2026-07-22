import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './Layout.css'

const links = [
  { to: '/shop', label: 'Shop' },
  { to: '/favorites', label: 'Favorites' },
  { to: '/chat', label: 'AI Guide' },
  { to: '/add-product', label: 'Add Product' },
]

export function Layout() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const close = () => setMenuOpen(false)

  return (
    <div className="site">
      <div className="grain" aria-hidden="true" />
      <header className={`nav ${scrolled ? 'nav--scrolled' : ''} ${menuOpen ? 'nav--open' : ''}`}>
        <NavLink className="nav__brand" to="/" onClick={close}>
          Priya Badal
        </NavLink>

        <button
          className={`nav__toggle ${menuOpen ? 'is-open' : ''}`}
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
        </button>

        <nav className={`nav__links ${menuOpen ? 'is-open' : ''}`} aria-label="Primary">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={close}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <Outlet />

      <footer className="footer">
        <p className="footer__brand">Priya Badal Home</p>
        <p className="footer__meta">Interiors · Products · AI Guide</p>
      </footer>
    </div>
  )
}
