/**
 * Remember the list page (Home / Shop collection) the client left
 * when opening a product — so Back, breadcrumbs, Shop tab, and refresh
 * can return to the same place and scroll position.
 */

import { forceWindowScroll, saveScrollMemory } from './scrollMemory'

const KEY = 'pbh:browse-return'
const KEY_SHOP = 'pbh:browse-return-shop'

export type BrowseReturn = {
  path: string
  scrollY: number
  locationKey?: string
  productId?: string
  savedAt: number
}

/** Passed through React Router when opening a product */
export type ProductBrowseState = {
  browseFrom?: string
  browseScrollY?: number
  restoreScrollY?: number
}

function readScrollY() {
  return (
    window.scrollY ||
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    0
  )
}

export function isListBrowsePath(pathname: string) {
  if (!pathname) return false
  const path = pathname.split('?')[0] || ''
  if (path === '/') return true
  if (path === '/shop' || path.startsWith('/shop/')) return true
  if (path === '/favorites') return true
  return false
}

function writeJson(key: string, payload: BrowseReturn) {
  try {
    sessionStorage.setItem(key, JSON.stringify(payload))
  } catch {
    /* ignore */
  }
}

function readJson(key: string): BrowseReturn | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BrowseReturn
    if (!parsed?.path || typeof parsed.scrollY !== 'number') return null
    return parsed
  } catch {
    return null
  }
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
  writeJson(KEY, payload)
  // Keep a dedicated shop bookmark so Back never “forgets” the collection
  // if the client later opens a product from the Home featured row.
  if (input.pathname === '/shop' || input.pathname.startsWith('/shop/')) {
    writeJson(KEY_SHOP, payload)
  }
  saveScrollMemory(
    input.locationKey || `path:${input.pathname}`,
    input.pathname,
  )
}

export function readBrowseOrigin(): BrowseReturn | null {
  return readJson(KEY)
}

export function readLastShopBrowse(): BrowseReturn | null {
  return readJson(KEY_SHOP)
}

/** Prefer last shop collection; fall back to /shop */
export function readLastShopPath(): string {
  const shop = readLastShopBrowse()
  if (
    shop &&
    (shop.path === '/shop' || shop.path.startsWith('/shop/'))
  ) {
    return shop.path
  }
  const origin = readBrowseOrigin()
  if (
    origin &&
    (origin.path === '/shop' || origin.path.startsWith('/shop/'))
  ) {
    return origin.path
  }
  return '/shop'
}

/**
 * Where Back on a product page should go.
 * Never jumps to Home unless that is truly where the product was opened.
 */
export function resolveProductBackTarget(input: {
  categoryShopPath: string
  productId: string
  locationState?: ProductBrowseState | null
}): { path: string; scrollY: number } {
  const state = input.locationState
  const stateFrom = (state?.browseFrom || '').trim()
  const statePath = stateFrom.split('?')[0] || ''

  if (stateFrom && isListBrowsePath(statePath)) {
    return {
      path: stateFrom,
      scrollY:
        typeof state?.browseScrollY === 'number' ? state.browseScrollY : 0,
    }
  }

  const origin = readBrowseOrigin()
  if (origin?.path) {
    const originPath = origin.path.split('?')[0] || ''
    // Prefer the shop list for this visit when available
    if (originPath === '/shop' || originPath.startsWith('/shop/')) {
      return { path: origin.path, scrollY: origin.scrollY || 0 }
    }
    if (origin.productId === input.productId && originPath === '/') {
      return { path: origin.path, scrollY: origin.scrollY || 0 }
    }
  }

  const lastShop = readLastShopBrowse()
  if (lastShop?.path) {
    return { path: lastShop.path, scrollY: lastShop.scrollY || 0 }
  }

  // Always fall back to this product’s collection — not Home
  return { path: input.categoryShopPath || '/shop', scrollY: 0 }
}

export function buildProductNavState(
  pathname: string,
  search = '',
  scrollY?: number,
): ProductBrowseState {
  return {
    browseFrom: `${pathname}${search || ''}`,
    browseScrollY: typeof scrollY === 'number' ? scrollY : readScrollY(),
  }
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
