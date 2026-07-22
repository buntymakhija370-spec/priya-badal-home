const STORAGE_KEY = 'priya-badal-favorites'

type Listener = () => void

const listeners = new Set<Listener>()

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

function writeIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  listeners.forEach((listener) => listener())
}

export function getFavoriteIds(): string[] {
  return readIds()
}

export function isFavorite(id: string): boolean {
  return readIds().includes(id)
}

export function toggleFavorite(id: string): boolean {
  const current = readIds()
  const exists = current.includes(id)
  const next = exists ? current.filter((item) => item !== id) : [...current, id]
  writeIds(next)
  return !exists
}

export function subscribeFavorites(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
