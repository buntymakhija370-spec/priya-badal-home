/**
 * Remember the list page (Home / Shop collection) the client left
 * when opening a product — so Back, breadcrumbs, Shop tab, and refresh
 * can return to the same place and scroll position.
 */

import { forceWindowScroll, saveScrollMemory } from './scrollMemory'

const KEY = 'pbh:browse-return'

export type BrowseReturn = {
  path: string
  scrollY: number
  /** History location key when they left the list (helps POP restore) */
  locationKey?: string
  productId?: string
  savedAt: number
}

function readScrollY() {
  return (
    window.scrollY ||
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    0
  )
}

/** List / browse surfaces we can restore into */
export function isListBrowsePath(pathname: string) {
  if (!pathname) return false
  if (pathname === '/') return true
  if (pathname === '/shop' || pathname.startsWith('/shop/')) return true
  if (pathname === '/favorites') return true
  return false
}

export function rememberBrowseOrigin(input: {
  pathname: string
  search?: string
  locationKey?: string
  productId?: string
  scrollY?: number
}) {
  if (!isListBrowsePath(input.pathname)) return
  const path = `${input.pathname}${input.search || ''}`
  const scrollY =
    typeof input.scrollY === 'number' ? input.scrollY : readScrollY()
  const payload: BrowseReturn = {
    path,
    scrollY,
    locationKey: input.locationKey,
    productId: input.productId,
    savedAt: Date.now(),
  }
  try {
    sessionStorage.setItem(KEY, JSON.stringify(payload))
  } catch {
    /* ignore */
  }
  // Keep path-keyed scroll in sync for ScrollToTop POP / refresh
  saveScrollMemory(input.locationKey || `path:${input.pathname}`, input.pathname)
}

export function readBrowseOrigin(): BrowseReturn | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BrowseReturn
    if (!parsed?.path || typeof parsed.scrollY !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

/** Prefer last shop collection; fall back to /shop */
export function readLastShopPath(): string {
  const origin = readBrowseOrigin()
  if (
    origin &&
    (origin.path === '/shop' || origin.path.startsWith('/shop/'))
  ) {
    return origin.path
  }
  return '/shop'
}

export function clearBrowseOrigin() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

/** Apply saved scroll after navigating back to a list page */
export function applyBrowseScroll(scrollY: number): () => void {
  if (scrollY <= 0) {
    forceWindowScroll(0)
    return () => {}
  }
  const timers: number[] = []
  let frames = 0
  let stopped = false

  const apply = () => {
    if (stopped) return
    forceWindowScroll(scrollY)
    frames += 1
    const at =
      window.scrollY ||
      document.documentElement.scrollTop ||
      0
    const tallEnough =
      document.documentElement.scrollHeight >= scrollY + window.innerHeight * 0.4
    const closeEnough = Math.abs(at - scrollY) <= 3
    if (frames < 36 && (!tallEnough || !closeEnough)) {
      requestAnimationFrame(apply)
    }
  }

  apply()
  for (const ms of [40, 100, 200, 400, 800, 1400]) {
    timers.push(window.setTimeout(apply, ms))
  }

  return () => {
    stopped = true
    for (const id of timers) window.clearTimeout(id)
  }
}
