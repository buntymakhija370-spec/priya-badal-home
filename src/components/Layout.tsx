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
import { BottomNav } from './BottomNav'
import { isOpenAllCategoriesActive } from '../lib/eventAccess'
import './Layout.css'

const utilityLinks = [
  { to: '/chat', label: 'AI Chat' },
  { to: '/shop', label: 'Collections' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/favorites', label: 'Favorites' },
  { to: '/add-product', label: 'Add Product' },
]

export function Layout() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const cartCount = useCartCount()
  const openAll = isOpenAllCategoriesActive()
  const desktopCategories = openAll ? categories : categories.slice(0, 4)

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

  const close = () => {
    setMenuOpen(false)
    setCategoriesOpen(false)
  }

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

        <nav
          className={`nav__desktop${openAll ? ' nav__desktop--open-all' : ''}`}
          aria-label="Shop categories"
        >
          {desktopCategories.map((cat) => (
            <NavLink key={cat.id} to={shopPath(cat.id)} onClick={close}>
              {cat.name}
            </NavLink>
          ))}
          <NavLink to="/chat" onClick={close}>
            AI Chat
          </NavLink>
          <NavLink to="/shop" onClick={close}>
            All
          </NavLink>
        </nav>

        <div className="nav__end">
          <CurrencySelect compact className="nav__currency" />
          <NavLink className="nav__cart" to="/cart" onClick={close}>
            <span className="nav__cart-label">Cart</span>
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
          <div className="nav__categories">
            <button
              className={`nav__categories-btn ${categoriesOpen ? 'is-open' : ''}`}
              type="button"
              aria-expanded={categoriesOpen}
              aria-controls="nav-all-categories"
              onClick={() => setCategoriesOpen((v) => !v)}
            >
              <span>All categories</span>
              <span className="nav__categories-chevron" aria-hidden="true" />
            </button>
            <div
              id="nav-all-categories"
              className={`nav__categories-panel ${categoriesOpen ? 'is-open' : ''}`}
              aria-hidden={!categoriesOpen}
            >
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
              <NavLink className="nav__category nav__category--all" to="/shop" onClick={close}>
                View full shop
              </NavLink>
            </div>
          </div>

          <div className="nav__divider" aria-hidden="true" />

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
            Shutters · Doors · Wall Panels · Wardrobes · Made-to-measure interiors
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
                <NavLink to="/chat">AI Chat</NavLink>
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

      <BottomNav />
    </div>
  )
}
