import { NavLink } from 'react-router-dom'
import { useCartCount } from '../hooks/useCart'
import './BottomNav.css'

const tabs = [
  {
    to: '/',
    end: true,
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4.5 10.8 12 4.5l7.5 6.3V19a1.5 1.5 0 0 1-1.5 1.5h-3.75v-5.25h-4.5V20.5H6A1.5 1.5 0 0 1 4.5 19v-8.2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: '/shop',
    label: 'Shop',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M5 8.5h14l-1.1 10.2a1.5 1.5 0 0 1-1.5 1.3H7.6a1.5 1.5 0 0 1-1.5-1.3L5 8.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M9 8.5V7a3 3 0 0 1 6 0v1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    to: '/chat',
    label: 'Chat',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H11l-3.8 3.2V16H7.5A2.5 2.5 0 0 1 5 13.5v-7Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="10" r="0.9" fill="currentColor" />
        <circle cx="12" cy="10" r="0.9" fill="currentColor" />
        <circle cx="15" cy="10" r="0.9" fill="currentColor" />
      </svg>
    ),
  },
  {
    to: '/cart',
    label: 'Cart',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M3.5 5.5h2.2l1.4 10.2a1.5 1.5 0 0 0 1.5 1.3h8.3a1.5 1.5 0 0 0 1.5-1.25L19.5 8H7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="19.2" r="1.15" fill="currentColor" />
        <circle cx="16.2" cy="19.2" r="1.15" fill="currentColor" />
      </svg>
    ),
  },
] as const

export function BottomNav() {
  const cartCount = useCartCount()

  return (
    <nav className="tabbar" aria-label="App navigation">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={'end' in tab ? tab.end : undefined}
          className={({ isActive }) =>
            isActive ? 'tabbar__item is-active' : 'tabbar__item'
          }
        >
          <span className="tabbar__icon">
            {tab.icon}
            {tab.to === '/cart' && cartCount > 0 ? (
              <span className="tabbar__badge">{cartCount > 99 ? '99+' : cartCount}</span>
            ) : null}
          </span>
          <span className="tabbar__label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
