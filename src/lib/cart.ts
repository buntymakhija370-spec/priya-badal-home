import {
  configKey,
  defaultConfig,
  type PriceConfig,
} from './pricing'

export type CartItem = {
  id: string
  productId: string
  quantity: number
  config: PriceConfig
  unitPrice: number
}

const STORAGE_KEY = 'priyabadal-homes-cart-v2'

type Listener = () => void
const listeners = new Set<Listener>()

function makeId(productId: string, config: PriceConfig) {
  return `${productId}__${configKey(config)}`
}

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is CartItem => {
      if (!item || typeof item !== 'object') return false
      const row = item as CartItem
      return (
        typeof row.productId === 'string' &&
        typeof row.quantity === 'number' &&
        row.quantity > 0 &&
        typeof row.unitPrice === 'number' &&
        row.config &&
        typeof row.config === 'object'
      )
    })
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
  return readCart()
    .filter((item) => item.productId === productId)
    .reduce((sum, item) => sum + item.quantity, 0)
}

/** Simple add using default finish/thickness/size and base price */
export function addToCart(productId: string, quantity = 1, unitPrice?: number) {
  const config = defaultConfig('wall-panels')
  addConfiguredToCart({
    productId,
    quantity,
    config,
    unitPrice: unitPrice ?? 0,
  })
}

export function addConfiguredToCart(input: {
  productId: string
  quantity?: number
  config: PriceConfig
  unitPrice: number
}) {
  const quantity = input.quantity ?? 1
  const id = makeId(input.productId, input.config)
  const cart = readCart()
  const existing = cart.find((item) => item.id === id)
  if (existing) {
    existing.quantity += quantity
    existing.unitPrice = input.unitPrice
  } else {
    cart.push({
      id,
      productId: input.productId,
      quantity,
      config: input.config,
      unitPrice: input.unitPrice,
    })
  }
  writeCart(cart)
}

export function setCartQuantity(itemId: string, quantity: number) {
  const cart = readCart()
  const next = cart
    .map((item) =>
      item.id === itemId ? { ...item, quantity } : item,
    )
    .filter((item) => item.quantity > 0)
  writeCart(next)
}

export function removeFromCart(itemId: string) {
  writeCart(readCart().filter((item) => item.id !== itemId))
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
