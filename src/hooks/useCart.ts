import { useSyncExternalStore } from 'react'
import {
  addToCart,
  getCartCount,
  getCartItems,
  getCartQuantity,
  removeFromCart,
  setCartQuantity,
  subscribeCart,
  type CartItem,
} from '../lib/cart'

function cartSnapshot() {
  return JSON.stringify(getCartItems())
}

export function useCartItems(): CartItem[] {
  const snapshot = useSyncExternalStore(subscribeCart, cartSnapshot, () => '[]')
  return JSON.parse(snapshot) as CartItem[]
}

export function useCartCount(): number {
  const items = useCartItems()
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export function useCartActions() {
  return {
    addToCart,
    setCartQuantity,
    removeFromCart,
    getCartQuantity,
    getCartCount,
  }
}
