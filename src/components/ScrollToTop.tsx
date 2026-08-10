import { useEffect, useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { applyBrowseScroll } from '../lib/browseReturn'
import {
  forceWindowScroll,
  restoreScrollMemory,
  saveScrollMemory,
} from '../lib/scrollMemory'

type LocationState = {
  restoreScrollY?: number
}

/**
 * - New pages (PUSH / REPLACE): jump to top — unless returning from a product
 * - Back / forward / refresh (POP): restore where the customer left the list
 *
 * Scroll is saved on every scroll AND in the click/touch capture phase
 * before React Router navigates, so it cannot be overwritten with 0.
 */
export function ScrollToTop() {
  const location = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  // Continuously remember scroll for the active page
  useEffect(() => {
    const key = location.key
    const path = location.pathname
    const onScroll = () => saveScrollMemory(key, path)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [location.key, location.pathname])

  // Capture-phase: save BEFORE Link / navigate changes the page
  useEffect(() => {
    const key = location.key
    const path = location.pathname

    const saveNow = () => saveScrollMemory(key, path)

    const onPointerDown = (event: Event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (
        target.closest('a[href]') ||
        target.closest('[data-save-scroll]') ||
        target.closest('.img-scroller__track') ||
        target.closest('.product-card')
      ) {
        saveNow()
      }
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('click', saveNow, true)
    window.addEventListener('pagehide', saveNow)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('click', saveNow, true)
      window.removeEventListener('pagehide', saveNow)
    }
  }, [location.key, location.pathname])

  // Also save in layout cleanup (belt-and-suspenders)
  useLayoutEffect(() => {
    const key = location.key
    const path = location.pathname
    return () => {
      saveScrollMemory(key, path)
    }
  }, [location.key, location.pathname])

  useLayoutEffect(() => {
    const state = (location.state || null) as LocationState | null
    const explicitY =
      typeof state?.restoreScrollY === 'number' ? state.restoreScrollY : null

    // Explicit return from product (Back / crumb / Shop tab)
    if (explicitY != null) {
      return applyBrowseScroll(explicitY)
    }

    // Browser Back / Forward / page refresh → restore list position
    if (navigationType === 'POP') {
      return restoreScrollMemory(location.key, location.pathname)
    }

    forceWindowScroll(0)
    return undefined
  }, [
    location.key,
    location.pathname,
    location.state,
    navigationType,
  ])

  return null
}
