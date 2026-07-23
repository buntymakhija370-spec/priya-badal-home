import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Reset window scroll whenever the route changes (category, product, etc.). */
export function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    // Instant jump so the first product isn't already scrolled past
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname, search])

  return null
}
