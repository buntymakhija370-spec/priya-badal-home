import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { categories } from '../data/catalog'
import { shopPath } from '../lib/links'
import { useCartCount } from '../hooks/useCart'
import {
  WHATSAPP_CHAT_URL,
  WHATSAPP_DISPLAY,
} from '../lib/whatsapp'
import { CurrencySelect } from './CurrencySelect'
import { isApproxDisplayCurrency } from '../lib/currency'
import { useCurrency } from '../hooks/useCurrency'
import './Layout.css'

const utilityLinks = [
  { to: '/shop', label: 'All products' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/visualise', label: 'Visualise AI' },
  { to: '/favorites', label: 'Favorites' },
  { to: '/chat', label: 'AI Guide' },
  { to: '/add-product', label: 'Add Product' },
]

export function Layout() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const cartCount = useCartCount()
  const { currency } = useCurrency()
  const showFxNote = isApproxDisplayCurrency(currency)

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
        <NavLink className="nav__brand" to="/" onClick={close} aria-label="Priyabadal Homes home">
          <img
            className="nav__logo"
            src="/brand/priyabadal-homes-logo.svg"
            alt="Priyabadal Homes"
          />
        </NavLink>

        <nav className="nav__desktop" aria-label="Shop categories">
          {categories.slice(0, 4).map((cat) => (
            <NavLink key={cat.id} to={shopPath(cat.id)} onClick={close}>
              {cat.name}
            </NavLink>
          ))}
          <NavLink to="/visualise" onClick={close}>
            Visualise
          </NavLink>
          <NavLink to="/shop" onClick={close}>
            All
          </NavLink>
        </nav>

        <div className="nav__end">
          <CurrencySelect compact className="nav__currency" />
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
          <p className="nav__section-label">Categories</p>
          {categories.map((cat) => (
            <NavLink
              key={cat.id}
              className="nav__category"
              to={shopPath(cat.id)}
              onClick={close}
            >
              {cat.name}
            </NavLink>
          ))}

          <div className="nav__divider" aria-hidden="true" />

          <div className="nav__currency-menu">
            <CurrencySelect />
            {showFxNote ? (
              <p className="nav__fx-note">Approx. display · quotes confirmed in ₹ INR</p>
            ) : null}
          </div>

          {utilityLinks.map((link) => (
            <NavLink key={link.to} className="nav__utility" to={link.to} onClick={close}>
              {link.label}
            </NavLink>
          ))}
          <NavLink className="nav__links-cart nav__utility" to="/cart" onClick={close}>
            Cart{cartCount > 0 ? ` (${cartCount})` : ''}
          </NavLink>
        </nav>
      </header>

      <Outlet />

      <footer className="footer">
        <div className="footer__brand-block">
          <img
            className="footer__logo"
            src="/brand/priyabadal-homes-logo.svg"
            alt="Priyabadal Homes — Shutters, Doors, Wall Panels"
          />
          <p className="footer__tag">
            Shutters · Doors · Wall Panels · Silai Bunai · Made-to-measure interiors
          </p>
        </div>

        <div className="footer__cols">
          <div>
            <p className="footer__heading">Shop</p>
            <ul>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <NavLink to={shopPath(cat.id)}>{cat.name}</NavLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="footer__heading">Help</p>
            <ul>
              <li>
                <NavLink to="/how-it-works">How your order works</NavLink>
              </li>
              <li>
                <NavLink to="/cart">Cart</NavLink>
              </li>
              <li>
                <NavLink to="/favorites">Favorites</NavLink>
              </li>
              <li>
                <NavLink to="/visualise">Visualise AI</NavLink>
              </li>
              <li>
                <NavLink to="/chat">AI Guide</NavLink>
              </li>
              <li>
                <a href={WHATSAPP_CHAT_URL} target="_blank" rel="noopener noreferrer">
                  WhatsApp {WHATSAPP_DISPLAY}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>

      <a
        className="wa-fab"
        href={WHATSAPP_CHAT_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
      >
        WhatsApp
      </a>
    </div>
  )
}
