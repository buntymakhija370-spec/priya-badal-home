import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  getFavoriteIds,
  isFavorite,
  subscribeFavorites,
  toggleFavorite,
} from '../lib/favorites'

function getSnapshot() {
  return getFavoriteIds().join('|')
}

export function useFavoriteIds(): string[] {
  const snapshot = useSyncExternalStore(subscribeFavorites, getSnapshot, () => '')
  return snapshot ? snapshot.split('|') : []
}

export function useFavorite(productId: string) {
  const ids = useFavoriteIds()
  const active = ids.includes(productId)

  const toggle = () => toggleFavorite(productId)

  return { isFavorite: active, toggle }
}

export function useIsFavorite(productId: string) {
  const [active, setActive] = useState(() => isFavorite(productId))

  useEffect(() => {
    return subscribeFavorites(() => setActive(isFavorite(productId)))
  }, [productId])

  return active
}
