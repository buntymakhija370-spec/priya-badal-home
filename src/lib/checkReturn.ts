/** Remember where the client was before opening Check (Favorites). */

const KEY = 'pbh:check-return'

const SKIP = new Set(['/favorites', '/cart', '/ai', '/ai-admin', '/install'])

export function isBrowsePath(pathname: string) {
  if (!pathname || SKIP.has(pathname)) return false
  if (pathname.startsWith('/ai')) return false
  return true
}

export function rememberCheckReturn(pathname: string, search = '') {
  if (!isBrowsePath(pathname)) return
  const full = `${pathname}${search || ''}`
  try {
    sessionStorage.setItem(KEY, full)
  } catch {
    /* ignore */
  }
}

export function readCheckReturn(): string | null {
  try {
    const v = sessionStorage.getItem(KEY)
    if (!v || v === '/favorites') return null
    return v
  } catch {
    return null
  }
}

export function clearCheckReturn() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
