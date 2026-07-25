import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

function forceScroll(y: number) {
  const html = document.documentElement
  const previous = html.style.scrollBehavior
  html.style.scrollBehavior = 'auto'
  window.scrollTo(0, y)
  html.scrollTop = y
  document.body.scrollTop = y
  html.style.scrollBehavior = previous
}

function readScroll() {
  return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0
}

/**
 * - New pages (PUSH / REPLACE): jump to top
 * - Back / forward (POP): restore the scroll position where you left
 *
 * Important: save the leaving page's scroll in a layout cleanup *before*
 * the next page scrolls to top. A normal useEffect cleanup runs too late
 * and would overwrite the saved position with 0.
 */
export function ScrollToTop() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const positions = useRef(new Map<string, number>())

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  // Keep updating the current entry while the user scrolls
  useEffect(() => {
    const key = location.key
    const save = () => {
      positions.current.set(key, readScroll())
    }
    window.addEventListener('scroll', save, { passive: true })
    return () => window.removeEventListener('scroll', save)
  }, [location.key])

  // Save scroll for the page we are leaving — runs before the next page's jump-to-top
  useLayoutEffect(() => {
    const key = location.key
    return () => {
      positions.current.set(key, readScroll())
      try {
        sessionStorage.setItem(`pbh:scroll:${key}`, String(readScroll()))
      } catch {
        /* private mode */
      }
    }
  }, [location.key])

  // Restore on Back, or start at top on a new navigation
  useLayoutEffect(() => {
    if (navigationType === 'POP') {
      let y = positions.current.get(location.key)
      if (y == null) {
        try {
          const raw = sessionStorage.getItem(`pbh:scroll:${location.key}`)
          if (raw != null) y = Number(raw) || 0
        } catch {
          y = 0
        }
      }
      const top = y ?? 0
      forceScroll(top)
      // Re-apply after layout/images settle
      requestAnimationFrame(() => forceScroll(top))
      const t1 = window.setTimeout(() => forceScroll(top), 50)
      const t2 = window.setTimeout(() => forceScroll(top), 200)
      return () => {
        window.clearTimeout(t1)
        window.clearTimeout(t2)
      }
    }

    forceScroll(0)
    return undefined
  }, [location.key, navigationType])

  return null
}
