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

/**
 * - New pages (PUSH / REPLACE): jump to top
 * - Back / forward (POP): restore the scroll position where you left
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

  // Remember scroll for this history entry while the user is on the page
  useEffect(() => {
    const key = location.key
    const save = () => {
      positions.current.set(key, window.scrollY || window.pageYOffset || 0)
    }
    save()
    window.addEventListener('scroll', save, { passive: true })
    return () => {
      save()
      window.removeEventListener('scroll', save)
    }
  }, [location.key])

  useLayoutEffect(() => {
    if (navigationType === 'POP') {
      const y = positions.current.get(location.key) ?? 0
      forceScroll(y)
      // Images/layout can shift height; re-apply once after paint
      requestAnimationFrame(() => forceScroll(y))
      return
    }

    forceScroll(0)
  }, [location.key, navigationType])

  return null
}
