export type CartItem = {
  productId: string
  quantity: number
}

const STORAGE_KEY = 'priya-badal-cart'

type Listener = () => void
const listeners = new Set<Listener>()

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is CartItem =>
        item &&
        typeof item === 'object' &&
        typeof (item as CartItem).productId === 'string' &&
        typeof (item as CartItem).quantity === 'number' &&
        (item as CartItem).quantity > 0,
    )
  } catch {
    return []
  }
}

function writeCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  listeners.forEach((listener) => listener())
}

export function getCartItems(): CartItem[] {
  return readCart()
}

export function getCartCount(): number {
  return readCart().reduce((sum, item) => sum + item.quantity, 0)
}

export function getCartQuantity(productId: string): number {
  return readCart().find((item) => item.productId === productId)?.quantity ?? 0
}

export function addToCart(productId: string, quantity = 1) {
  const cart = readCart()
  const existing = cart.find((item) => item.productId === productId)
  if (existing) {
    existing.quantity += quantity
  } else {
    cart.push({ productId, quantity })
  }
  writeCart(cart)
}

export function setCartQuantity(productId: string, quantity: number) {
  const cart = readCart().filter((item) => item.productId !== productId)
  if (quantity > 0) {
    cart.push({ productId, quantity })
  }
  writeCart(cart)
}

export function removeFromCart(productId: string) {
  writeCart(readCart().filter((item) => item.productId !== productId))
}

export function clearCart() {
  writeCart([])
}

export function subscribeCart(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
