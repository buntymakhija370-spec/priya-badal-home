import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Reset window scroll instantly on every route change (no smooth animation). */
export function ScrollToTop() {
  const { pathname, search } = useLocation()

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    // CSS `html { scroll-behavior: smooth }` makes scrollTo(0,0) animate.
    // Temporarily force instant so product pages open without scrolling first.
    const html = document.documentElement
    const previous = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    html.scrollTop = 0
    document.body.scrollTop = 0
    html.style.scrollBehavior = previous
  }, [pathname, search])

  return null
}
