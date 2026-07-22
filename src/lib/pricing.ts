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
  { id: 'matte', name: 'Matte laminate', multiplier: 1 },
  { id: 'natural-oak', name: 'Natural oak', multiplier: 1.18 },
  { id: 'walnut', name: 'Walnut veneer', multiplier: 1.32 },
  { id: 'gloss', name: 'High gloss lacquer', multiplier: 1.25 },
  { id: 'textured', name: 'Textured finish', multiplier: 1.1 },
]

export const THICKNESSES: ThicknessOption[] = [
  { id: '12', label: '12 mm', mm: 12, multiplier: 0.88 },
  { id: '18', label: '18 mm', mm: 18, multiplier: 1 },
  { id: '25', label: '25 mm', mm: 25, multiplier: 1.22 },
  { id: '32', label: '32 mm', mm: 32, multiplier: 1.45 },
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
  'living-room': {
    defaultWidth: 180,
    defaultHeight: 85,
    defaultDepth: 90,
    baseWidth: 180,
    baseHeight: 85,
    baseDepth: 90,
    maxWidth: 320,
  },
  bedroom: {
    defaultWidth: 160,
    defaultHeight: 100,
    defaultDepth: 200,
    baseWidth: 160,
    baseHeight: 100,
    baseDepth: 200,
    maxWidth: 220,
    maxDepth: 220,
  },
  'kitchen-dining': {
    defaultWidth: 160,
    defaultHeight: 75,
    defaultDepth: 90,
    baseWidth: 160,
    baseHeight: 75,
    baseDepth: 90,
  },
  decor: {
    defaultWidth: 60,
    defaultHeight: 80,
    defaultDepth: 25,
    baseWidth: 60,
    baseHeight: 80,
    baseDepth: 25,
    usesDepth: false,
    maxWidth: 200,
    maxHeight: 250,
  },
  lighting: {
    defaultWidth: 40,
    defaultHeight: 140,
    defaultDepth: 40,
    baseWidth: 40,
    baseHeight: 140,
    baseDepth: 40,
    usesDepth: true,
    maxWidth: 120,
    maxHeight: 220,
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

export function defaultConfig(categoryId: string): PriceConfig {
  const size = getSizeLimits(categoryId)
  return {
    finishId: 'matte',
    thicknessId: '18',
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

/** Price from base product price × finish × thickness × size factor */
export function calculatePrice(basePrice: number, categoryId: string, config: PriceConfig) {
  const size = getSizeLimits(categoryId)
  const normalized = normalizeConfig(categoryId, config)
  const finish = getFinish(normalized.finishId)
  const thickness = getThickness(normalized.thicknessId)

  const baseArea = size.baseWidth * size.baseHeight
  const customArea = normalized.width * normalized.height
  let sizeFactor = customArea / baseArea

  if (size.usesDepth) {
    const baseVol = size.baseWidth * size.baseHeight * size.baseDepth
    const customVol = normalized.width * normalized.height * normalized.depth
    sizeFactor = customVol / baseVol
  }

  // Keep extreme custom sizes from going absurdly cheap/expensive
  sizeFactor = clamp(sizeFactor, 0.45, 3.5)

  const unitPrice = Math.round(
    basePrice * finish.multiplier * thickness.multiplier * sizeFactor,
  )

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
