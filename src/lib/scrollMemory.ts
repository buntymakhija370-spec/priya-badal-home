/** In-memory + session scroll positions for reliable Back restoration */

const memory = new Map<string, number>()
const STORAGE_KEY = 'pbh:scroll-map'

function readScroll() {
  return (
    window.scrollY ||
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    0
  )
}

function pathKey(pathname: string) {
  return `path:${pathname}`
}

function loadStorage() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Record<string, number>
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'number') memory.set(k, v)
    }
  } catch {
    /* ignore */
  }
}

function persistStorage() {
  try {
    const obj: Record<string, number> = {}
    for (const [k, v] of memory.entries()) obj[k] = v
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
  } catch {
    /* ignore */
  }
}

let storageLoaded = false
function ensureLoaded() {
  if (storageLoaded) return
  storageLoaded = true
  loadStorage()
}

/** Save current window scroll for this history entry + list path */
export function saveScrollMemory(locationKey: string, pathname: string) {
  ensureLoaded()
  const y = readScroll()
  memory.set(locationKey, y)
  // List pages: also key by path so Back still works if history key mismatches
  if (
    pathname === '/' ||
    pathname === '/favorites' ||
    pathname === '/shop' ||
    pathname.startsWith('/shop/')
  ) {
    memory.set(pathKey(pathname), y)
  }
  persistStorage()
  return y
}

export function readScrollMemory(locationKey: string, pathname: string) {
  ensureLoaded()
  const byKey = memory.get(locationKey)
  if (typeof byKey === 'number') return byKey
  const byPath = memory.get(pathKey(pathname))
  if (typeof byPath === 'number') return byPath
  return 0
}

export function forceWindowScroll(y: number) {
  const html = document.documentElement
  const previous = html.style.scrollBehavior
  html.style.scrollBehavior = 'auto'
  window.scrollTo(0, y)
  html.scrollTop = y
  document.body.scrollTop = y
  html.style.scrollBehavior = previous
}

export function restoreScrollMemory(
  locationKey: string,
  pathname: string,
): () => void {
  const y = readScrollMemory(locationKey, pathname)
  if (y <= 0) {
    forceWindowScroll(0)
    return () => {}
  }

  const timers: number[] = []
  let frames = 0
  let stopped = false

  const apply = () => {
    if (stopped) return
    forceWindowScroll(y)
    frames += 1
    const at = readScroll()
    const tallEnough =
      document.documentElement.scrollHeight >= y + window.innerHeight * 0.5
    const closeEnough = Math.abs(at - y) <= 2
    // Keep trying until layout is tall enough and we landed near the target
    if (frames < 30 && (!tallEnough || !closeEnough)) {
      requestAnimationFrame(apply)
    }
  }

  apply()
  for (const ms of [32, 80, 160, 320, 640, 1200]) {
    timers.push(window.setTimeout(apply, ms))
  }

  return () => {
    stopped = true
    for (const id of timers) window.clearTimeout(id)
  }
}
