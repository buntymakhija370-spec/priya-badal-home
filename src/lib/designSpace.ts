import type { Product } from '../data/catalog'
import { formatPrice } from './currency'
import {
  calculatePrice,
  defaultConfig,
  getFinish,
  getFinishOptionsForProduct,
  getSizeLimits,
  getThickness,
  getThicknessOptionsForProduct,
  productHasCarcass,
  type BuildScopeId,
  type PriceConfig,
} from './pricing'
import { WHATSAPP_QUOTE_NUMBER } from './whatsapp'

export type DesignRoomId = 'kitchen' | 'wardrobe' | 'temple'

export type DesignRoomOption = {
  id: DesignRoomId
  name: string
  blurb: string
  image: string
}

export const DESIGN_ROOMS: DesignRoomOption[] = [
  {
    id: 'kitchen',
    name: 'Kitchen',
    blurb: 'Renovate or plan a new modular kitchen',
    image: '/products/categories/kitchen.jpg',
  },
  {
    id: 'wardrobe',
    name: 'Wardrobe',
    blurb: 'Bedroom wardrobe or walk-in dressing',
    image: '/products/categories/wardrobe.jpg',
  },
  {
    id: 'temple',
    name: 'Temple / Puja',
    blurb: 'Mandir, temple wall, or prayer niche',
    image: '/products/categories/temple.jpg',
  },
]

export function productsForRoom(
  products: Product[],
  room: DesignRoomId,
): Product[] {
  return products.filter((p) => p.categoryId === room)
}

export function buildDesignConfig(
  product: Product,
  size: { width: number; height: number; depth: number },
  finishId?: string,
  thicknessId?: string,
  buildScope: BuildScopeId = 'with-carcass',
): PriceConfig {
  const base = defaultConfig(product.categoryId, product)
  const finishes = getFinishOptionsForProduct(product)
  const thicknesses = getThicknessOptionsForProduct(product)
  return {
    ...base,
    width: size.width,
    height: size.height,
    depth: size.depth,
    finishId: finishId || finishes[0]?.id || base.finishId,
    thicknessId: thicknessId || thicknesses[0]?.id || base.thicknessId,
    buildScope: productHasCarcass(product) ? buildScope : 'shutter',
  }
}

export function quoteDesignSpace(input: {
  product: Product
  width: number
  height: number
  depth: number
  finishId?: string
  thicknessId?: string
  buildScope?: BuildScopeId
}) {
  const config = buildDesignConfig(
    input.product,
    {
      width: input.width,
      height: input.height,
      depth: input.depth,
    },
    input.finishId,
    input.thicknessId,
    input.buildScope ?? 'with-carcass',
  )
  return calculatePrice(input.product, config)
}

export function designRoomDefaults(room: DesignRoomId) {
  return getSizeLimits(room)
}

export function buildDesignSpaceWhatsAppUrl(input: {
  room: DesignRoomId
  product: Product
  width: number
  height: number
  depth: number
  finishId: string
  thicknessId: string
  unitPrice: number
  buildScope: BuildScopeId
  notes?: string
}) {
  const roomName = DESIGN_ROOMS.find((r) => r.id === input.room)?.name ?? input.room
  const scopeLabel =
    input.buildScope === 'with-carcass' ? 'With carcass' : 'Shutter / façade only'
  const productUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/product/${input.product.id}`
      : `/product/${input.product.id}`
  const lines = [
    'Hi Priyabadal Homes — Design my space request:',
    '',
    `Room: ${roomName}`,
    `Product: ${input.product.name}`,
    `Size: ${input.width} × ${input.height} × ${input.depth} ft`,
    `Finish: ${getFinish(input.finishId).name} · ${getThickness(input.thicknessId).label}`,
    `Scope: ${scopeLabel}`,
    `Estimated price: ${formatPrice(input.unitPrice, 'INR')}`,
    input.notes?.trim() ? `Notes: ${input.notes.trim()}` : null,
    '',
    `Product photo & details: ${productUrl}`,
    '',
    'Please confirm final quote. Thank you.',
  ].filter(Boolean) as string[]

  return `https://wa.me/${WHATSAPP_QUOTE_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`
}
