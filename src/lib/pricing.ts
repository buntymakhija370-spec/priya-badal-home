import type { Product } from '../data/catalog'

export type FinishOption = {
  id: string
  name: string
  multiplier: number
}

export type ThicknessOption = {
  id: string
  label: string
  mm: number
  multiplier: number
}

export type SizeLimits = {
  minWidth: number
  maxWidth: number
  minHeight: number
  maxHeight: number
  minDepth: number
  maxDepth: number
  defaultWidth: number
  defaultHeight: number
  defaultDepth: number
  baseWidth: number
  baseHeight: number
  baseDepth: number
  usesDepth: boolean
}

export type PriceConfig = {
  finishId: string
  thicknessId: string
  width: number
  height: number
  depth: number
}

export const FINISHES: FinishOption[] = [
  { id: 'pu', name: 'PU finish', multiplier: 1 },
  { id: 'matte', name: 'Matte laminate', multiplier: 0.92 },
  { id: 'natural-oak', name: 'Natural oak', multiplier: 1.18 },
  { id: 'walnut', name: 'Walnut veneer', multiplier: 1.32 },
  { id: 'gloss', name: 'High gloss lacquer', multiplier: 1.2 },
  { id: 'textured', name: 'Textured finish', multiplier: 1.08 },
]

export const THICKNESSES: ThicknessOption[] = [
  { id: '12', label: '12 mm', mm: 12, multiplier: 0.82 },
  { id: '18', label: '18 mm', mm: 18, multiplier: 0.92 },
  { id: '25', label: '25 mm', mm: 25, multiplier: 1 },
  { id: '32', label: '32 mm', mm: 32, multiplier: 1.18 },
]

const DEFAULT_SIZE: SizeLimits = {
  minWidth: 30,
  maxWidth: 400,
  minHeight: 20,
  maxHeight: 300,
  minDepth: 20,
  maxDepth: 120,
  defaultWidth: 120,
  defaultHeight: 75,
  defaultDepth: 45,
  baseWidth: 120,
  baseHeight: 75,
  baseDepth: 45,
  usesDepth: true,
}

const SIZE_BY_CATEGORY: Record<string, Partial<SizeLimits>> = {
  'wall-panels': {
    defaultWidth: 60,
    defaultHeight: 240,
    defaultDepth: 2,
    baseWidth: 60,
    baseHeight: 240,
    baseDepth: 2,
    usesDepth: false,
    minWidth: 30,
    maxWidth: 120,
    minHeight: 60,
    maxHeight: 300,
  },
  kitchen: {
    defaultWidth: 240,
    defaultHeight: 210,
    defaultDepth: 60,
    baseWidth: 240,
    baseHeight: 210,
    baseDepth: 60,
    maxWidth: 500,
    maxHeight: 270,
    maxDepth: 90,
  },
  wardrobe: {
    defaultWidth: 180,
    defaultHeight: 210,
    defaultDepth: 60,
    baseWidth: 180,
    baseHeight: 210,
    baseDepth: 60,
    maxWidth: 360,
    maxHeight: 270,
    maxDepth: 80,
  },
  temple: {
    defaultWidth: 90,
    defaultHeight: 180,
    defaultDepth: 45,
    baseWidth: 90,
    baseHeight: 180,
    baseDepth: 45,
    maxWidth: 180,
    maxHeight: 240,
    maxDepth: 70,
  },
  doors: {
    defaultWidth: 90,
    defaultHeight: 210,
    defaultDepth: 4,
    baseWidth: 90,
    baseHeight: 210,
    baseDepth: 4,
    usesDepth: false,
    minWidth: 60,
    maxWidth: 120,
    minHeight: 180,
    maxHeight: 240,
  },
  'sculpted-furniture': {
    defaultWidth: 180,
    defaultHeight: 85,
    defaultDepth: 90,
    baseWidth: 180,
    baseHeight: 85,
    baseDepth: 90,
    maxWidth: 320,
    maxDepth: 120,
  },
}

export function getSizeLimits(categoryId: string): SizeLimits {
  return { ...DEFAULT_SIZE, ...SIZE_BY_CATEGORY[categoryId] }
}

export function getFinish(id: string) {
  return FINISHES.find((f) => f.id === id) ?? FINISHES[0]!
}

export function getThickness(id: string) {
  return THICKNESSES.find((t) => t.id === id) ?? THICKNESSES[1]!
}

export function defaultConfig(
  categoryId: string,
  product?: Pick<Product, 'defaultFinishId' | 'defaultThicknessId'>,
): PriceConfig {
  const size = getSizeLimits(categoryId)
  return {
    finishId: product?.defaultFinishId ?? 'pu',
    thicknessId: product?.defaultThicknessId ?? '25',
    width: size.defaultWidth,
    height: size.defaultHeight,
    depth: size.defaultDepth,
  }
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

export function normalizeConfig(categoryId: string, config: PriceConfig): PriceConfig {
  const size = getSizeLimits(categoryId)
  return {
    finishId: getFinish(config.finishId).id,
    thicknessId: getThickness(config.thicknessId).id,
    width: clamp(Math.round(config.width), size.minWidth, size.maxWidth),
    height: clamp(Math.round(config.height), size.minHeight, size.maxHeight),
    depth: clamp(Math.round(config.depth), size.minDepth, size.maxDepth),
  }
}

/** cm² → sq ft */
function toSqFt(widthCm: number, heightCm: number) {
  return (widthCm * heightCm) / 929.0304
}

/** Price from base product price × finish × thickness × size */
export function calculatePrice(
  product: Pick<
    Product,
    'price' | 'categoryId' | 'pricingMode' | 'defaultFinishId' | 'defaultThicknessId'
  >,
  config: PriceConfig,
) {
  const size = getSizeLimits(product.categoryId)
  const normalized = normalizeConfig(product.categoryId, config)
  const finish = getFinish(normalized.finishId)
  const thickness = getThickness(normalized.thicknessId)
  const baseFinish = getFinish(product.defaultFinishId ?? 'pu')
  const baseThickness = getThickness(product.defaultThicknessId ?? '25')

  const finishMult = finish.multiplier / baseFinish.multiplier
  const thicknessMult = thickness.multiplier / baseThickness.multiplier

  let unitPrice: number
  let sizeFactor = 1

  if (product.pricingMode === 'per-sqft') {
    const sqft = toSqFt(normalized.width, normalized.height)
    sizeFactor = sqft
    unitPrice = Math.round(product.price * sqft * finishMult * thicknessMult)
  } else {
    const baseArea = size.baseWidth * size.baseHeight
    const customArea = normalized.width * normalized.height
    sizeFactor = customArea / baseArea

    if (size.usesDepth) {
      const baseVol = size.baseWidth * size.baseHeight * size.baseDepth
      const customVol = normalized.width * normalized.height * normalized.depth
      sizeFactor = customVol / baseVol
    }

    sizeFactor = clamp(sizeFactor, 0.45, 3.5)
    unitPrice = Math.round(
      product.price * finishMult * thicknessMult * sizeFactor,
    )
  }

  return {
    unitPrice: Math.max(499, unitPrice),
    finish,
    thickness,
    size,
    config: normalized,
    sizeFactor,
  }
}

export function configKey(config: PriceConfig) {
  return [
    config.finishId,
    config.thicknessId,
    config.width,
    config.height,
    config.depth,
  ].join('|')
}

export function describeConfig(categoryId: string, config: PriceConfig) {
  const size = getSizeLimits(categoryId)
  const finish = getFinish(config.finishId)
  const thickness = getThickness(config.thicknessId)
  const dims = size.usesDepth
    ? `${config.width} × ${config.height} × ${config.depth} cm`
    : `${config.width} × ${config.height} cm`
  return `${finish.name} · ${thickness.label} · ${dims}`
}
