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

/** All size values are in feet */
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
  /** feet */
  width: number
  /** feet */
  height: number
  /** feet */
  depth: number
}

const FINISH_LOOKUP: Record<string, FinishOption> = {
  pu: { id: 'pu', name: 'PU', multiplier: 1 },
  matte: { id: 'matte', name: 'Matte laminate', multiplier: 0.92 },
  'natural-oak': { id: 'natural-oak', name: 'Natural oak', multiplier: 1.18 },
  walnut: { id: 'walnut', name: 'Walnut veneer', multiplier: 1.32 },
  gloss: { id: 'gloss', name: 'High gloss lacquer', multiplier: 1.2 },
  textured: { id: 'textured', name: 'Textured finish', multiplier: 1.08 },
}

const THICKNESS_LOOKUP: Record<string, ThicknessOption> = {
  '12': { id: '12', label: '12 mm', mm: 12, multiplier: 0.82 },
  '18': { id: '18', label: '18 mm', mm: 18, multiplier: 0.92 },
  '25': { id: '25', label: '25 mm', mm: 25, multiplier: 1 },
  '32': { id: '32', label: '32 mm', mm: 32, multiplier: 1.18 },
}

/** @deprecated Prefer getFinishOptionsForProduct — kept for lookups only */
export const FINISHES: FinishOption[] = Object.values(FINISH_LOOKUP)

export const THICKNESSES: ThicknessOption[] = Object.values(THICKNESS_LOOKUP)

const DEFAULT_SIZE: SizeLimits = {
  minWidth: 1,
  maxWidth: 14,
  minHeight: 1,
  maxHeight: 12,
  minDepth: 0.5,
  maxDepth: 4,
  defaultWidth: 4,
  defaultHeight: 2.5,
  defaultDepth: 1.5,
  baseWidth: 4,
  baseHeight: 2.5,
  baseDepth: 1.5,
  usesDepth: true,
}

const SIZE_BY_CATEGORY: Record<string, Partial<SizeLimits>> = {
  'wall-panels': {
    defaultWidth: 2,
    defaultHeight: 8,
    defaultDepth: 0.1,
    baseWidth: 2,
    baseHeight: 8,
    baseDepth: 0.1,
    usesDepth: false,
    minWidth: 1,
    maxWidth: 4,
    minHeight: 2,
    maxHeight: 10,
  },
  kitchen: {
    defaultWidth: 8,
    defaultHeight: 7,
    defaultDepth: 2,
    baseWidth: 8,
    baseHeight: 7,
    baseDepth: 2,
    maxWidth: 16,
    maxHeight: 9,
    maxDepth: 3,
  },
  wardrobe: {
    defaultWidth: 6,
    defaultHeight: 7,
    defaultDepth: 2,
    baseWidth: 6,
    baseHeight: 7,
    baseDepth: 2,
    minWidth: 2,
    maxWidth: 12,
    minHeight: 5,
    maxHeight: 9,
    maxDepth: 3,
  },
  temple: {
    defaultWidth: 3,
    defaultHeight: 6,
    defaultDepth: 1.5,
    baseWidth: 3,
    baseHeight: 6,
    baseDepth: 1.5,
    maxWidth: 6,
    maxHeight: 8,
    maxDepth: 2.5,
  },
  doors: {
    defaultWidth: 3,
    defaultHeight: 7,
    defaultDepth: 0.15,
    baseWidth: 3,
    baseHeight: 7,
    baseDepth: 0.15,
    usesDepth: false,
    minWidth: 2,
    maxWidth: 4,
    minHeight: 6,
    maxHeight: 8,
  },
  'sculpted-furniture': {
    defaultWidth: 6,
    defaultHeight: 2.8,
    defaultDepth: 3,
    baseWidth: 6,
    baseHeight: 2.8,
    baseDepth: 3,
    maxWidth: 10,
    maxDepth: 4,
  },
}

export function getSizeLimits(categoryId: string): SizeLimits {
  return { ...DEFAULT_SIZE, ...SIZE_BY_CATEGORY[categoryId] }
}

export function getFinish(id: string) {
  return FINISH_LOOKUP[id] ?? FINISH_LOOKUP.pu!
}

export function getThickness(id: string) {
  return THICKNESS_LOOKUP[id] ?? THICKNESS_LOOKUP['25']!
}

/** Only the finish stated on the product — never invent extra options */
export function getFinishOptionsForProduct(
  product?: Pick<Product, 'defaultFinishId'>,
): FinishOption[] {
  if (!product?.defaultFinishId) return []
  return [getFinish(product.defaultFinishId)]
}

/** Only the thickness stated on the product */
export function getThicknessOptionsForProduct(
  product?: Pick<Product, 'defaultThicknessId'>,
): ThicknessOption[] {
  if (!product?.defaultThicknessId) return []
  return [getThickness(product.defaultThicknessId)]
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

function roundFt(value: number) {
  return Math.round(value * 10) / 10
}

export function normalizeConfig(categoryId: string, config: PriceConfig): PriceConfig {
  const size = getSizeLimits(categoryId)
  return {
    finishId: getFinish(config.finishId).id,
    thicknessId: getThickness(config.thicknessId).id,
    width: clamp(roundFt(config.width), size.minWidth, size.maxWidth),
    height: clamp(roundFt(config.height), size.minHeight, size.maxHeight),
    depth: clamp(roundFt(config.depth), size.minDepth, size.maxDepth),
  }
}

/** Price from base product price × finish × thickness × size (sizes in feet) */
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
  const baseFinish = getFinish(product.defaultFinishId ?? normalized.finishId)
  const baseThickness = getThickness(product.defaultThicknessId ?? normalized.thicknessId)

  const finishMult = finish.multiplier / baseFinish.multiplier
  const thicknessMult = thickness.multiplier / baseThickness.multiplier

  let unitPrice: number
  let sizeFactor = 1

  if (product.pricingMode === 'per-sqft') {
    const sqft = normalized.width * normalized.height
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
    ? `${config.width} × ${config.height} × ${config.depth} ft`
    : `${config.width} × ${config.height} ft`
  const finishPart = finish.name
  const thicknessPart = thickness.label
  return `${finishPart} · ${thicknessPart} · ${dims}`
}
