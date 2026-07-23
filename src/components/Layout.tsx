import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useCartCount } from '../hooks/useCart'
import { SITE, whatsappUrl } from '../lib/site'
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
  const cartCount = useCartCount()

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
          <span className="nav__brand-main">{SITE.shortName}</span>
          <span className="nav__brand-sub">Homes</span>
        </NavLink>

        <div className="nav__end">
          <a
            className="nav__whatsapp"
            href={whatsappUrl('Hi Priyabadal Homes — I want a custom quote.')}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp
          </a>
          <NavLink className="nav__cart" to="/cart" onClick={close}>
            Cart
            {cartCount > 0 && <span className="nav__cart-count">{cartCount}</span>}
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
        </div>

        <nav className={`nav__links ${menuOpen ? 'is-open' : ''}`} aria-label="Primary">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={close}>
              {link.label}
            </NavLink>
          ))}
          <NavLink className="nav__links-cart" to="/cart" onClick={close}>
            Cart{cartCount > 0 ? ` (${cartCount})` : ''}
          </NavLink>
          <a
            className="nav__links-wa"
            href={whatsappUrl('Hi Priyabadal Homes — I want a custom quote.')}
            target="_blank"
            rel="noreferrer"
            onClick={close}
          >
            Get Quote
          </a>
        </nav>
      </header>

      <Outlet />

      <footer className="footer">
        <div className="footer__brand-block">
          <p className="footer__brand">{SITE.name}</p>
          <p className="footer__meta">
            Handcrafted by Local Artists · Custom Made · Priced Per Sq Ft · Made in India
          </p>
        </div>
        <div className="footer__contact">
          <a href={`tel:${SITE.phoneTel}`}>{SITE.phoneDisplay}</a>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          <a href={whatsappUrl()} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        </div>
        <p className="footer__copy">
          © {new Date().getFullYear()} {SITE.name} · {SITE.domain}
        </p>
      </footer>
    </div>
  )
}
