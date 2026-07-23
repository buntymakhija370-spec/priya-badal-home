import { baseProducts, type Product } from '../data/catalog'

const STORAGE_KEY = 'priya-badal-custom-products'

function readCustom(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Product[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeCustom(products: Product[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
}

export function getAllProducts(): Product[] {
  return [...baseProducts, ...readCustom()]
}

export function getProductById(id: string): Product | undefined {
  return getAllProducts().find((p) => p.id === id)
}

export function getProductsByCategory(
  categoryId: string,
  subcategoryId?: string,
): Product[] {
  return getAllProducts().filter((p) => {
    if (p.categoryId !== categoryId) return false
    if (subcategoryId && p.subcategoryId !== subcategoryId) return false
    return true
  })
}

export type NewProductInput = {
  name: string
  categoryId: Product['categoryId']
  subcategoryId: string
  price: number
  description: string
  image: string
  style?: string[]
  rooms?: string[]
}

export function addCustomProduct(input: NewProductInput): Product {
  const product: Product = {
    id: `custom-${Date.now()}`,
    name: input.name.trim(),
    categoryId: input.categoryId,
    subcategoryId: input.subcategoryId,
    price: input.price,
    currency: 'INR',
    description: input.description.trim(),
    style: input.style?.length ? input.style : ['warm'],
    rooms: input.rooms?.length ? input.rooms : ['living room'],
    image: input.image.trim(),
    custom: true,
  }

  const next = [...readCustom(), product]
  writeCustom(next)
  return product
}

export function removeCustomProduct(id: string) {
  writeCustom(readCustom().filter((p) => p.id !== id))
}
