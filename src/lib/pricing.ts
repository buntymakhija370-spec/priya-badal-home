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

/** Shutter front only, or shutter + carcass (cabinet box) */
export type BuildScopeId = 'shutter' | 'with-carcass'

export type BuildScopeOption = {
  id: BuildScopeId
  name: string
  shortName: string
  description: string
  /** Applied on top of catalog base (catalog = shutter rate) */
  multiplier: number
}

export const BUILD_SCOPES: BuildScopeOption[] = [
  {
    id: 'shutter',
    name: 'Shutter only',
    shortName: 'Shutter',
    description: 'Front shutters / doors only — carcass not included.',
    multiplier: 1,
  },
  {
    id: 'with-carcass',
    name: 'With carcass',
    shortName: 'Carcass',
    description: 'Shutter + carcass combined (both rates added).',
    /** Fallback when product has no carcassPrice: shutter × this */
    multiplier: 1.7,
  },
]

const BUILD_SCOPE_LOOKUP: Record<BuildScopeId, BuildScopeOption> = {
  shutter: BUILD_SCOPES[0]!,
  'with-carcass': BUILD_SCOPES[1]!,
}

/** Kitchen, wardrobe, temple & shutters use shutter vs carcass pricing */
const BUILD_SCOPE_CATEGORIES = new Set([
  'kitchen',
  'wardrobe',
  'temple',
  'sculpted-furniture',
])

export function supportsBuildScope(categoryId: string): boolean {
  return BUILD_SCOPE_CATEGORIES.has(categoryId)
}

/** With-carcass row only when the product defines a carcass rate */
export function productHasCarcass(
  product?: Pick<Product, 'carcassPrice'> | null,
): boolean {
  return product?.carcassPrice != null
}

export function getBuildScope(id: string): BuildScopeOption {
  return BUILD_SCOPE_LOOKUP[id as BuildScopeId] ?? BUILD_SCOPE_LOOKUP.shutter
}

export function getBuildScopeOptions(categoryId: string): BuildScopeOption[] {
  return supportsBuildScope(categoryId) ? BUILD_SCOPES : []
}

/**
 * Rate used in estimates.
 * - shutter: product.price (shutter rate)
 * - with-carcass: shutter + carcass (both added). If no carcassPrice, uses multiplier fallback.
 */
export function getBuildScopeRate(
  product: Pick<Product, 'price' | 'carcassPrice'>,
  scopeId: BuildScopeId,
): number {
  if (scopeId === 'with-carcass') {
    if (product.carcassPrice != null) {
      return product.price + product.carcassPrice
    }
    return Math.round(product.price * getBuildScope('with-carcass').multiplier)
  }
  return product.price
}

/**
 * Finished product (paint/laminate/PU as catalogued) vs unfinished CNC-Carve HD Board.
 * CNC board is a white-canvas carve — no paint, no finishing — clients finish it themselves.
 * Available on every customisable product (not Live Edge / non-customisable).
 */
export type BoardSupplyId = 'finished' | 'cnc-carve-hd'

export type BoardSupplyOption = {
  id: BoardSupplyId
  name: string
  shortName: string
  description: string
}

/** Unfinished CNC-Carve HD Board rate (₹ / sq ft) — no paint, no finishing */
export const CNC_CARVE_HD_RATE_PER_SQFT = 400

export const BOARD_SUPPLIES: BoardSupplyOption[] = [
  {
    id: 'finished',
    name: 'Finished product',
    shortName: 'Finished',
    description: 'Catalogued finish as shown — paint, laminate, PU, or coating included.',
  },
  {
    id: 'cnc-carve-hd',
    name: 'CNC-Carve HD Board',
    shortName: 'CNC HD',
    description:
      'Unfinished HD board carve only — no paint, no finishing. White canvas for you to finish as you like.',
  },
]

const BOARD_SUPPLY_LOOKUP: Record<BoardSupplyId, BoardSupplyOption> = {
  finished: BOARD_SUPPLIES[0]!,
  'cnc-carve-hd': BOARD_SUPPLIES[1]!,
}

/** Categories that do not offer CNC-Carve HD Board (unique / bulk packs) */
const CNC_BOARD_EXCLUDED = new Set([
  'live-edge-furniture',
  'commercials',
  'silaibunai',
  'handles',
])

export function supportsBoardSupply(categoryId: string): boolean {
  return !CNC_BOARD_EXCLUDED.has(categoryId)
}

/** Category allows CNC, unless the product sets cncAvailable: false */
export function productSupportsCnc(
  categoryId: string,
  product?: Pick<Product, 'cncAvailable'> | null,
): boolean {
  if (product?.cncAvailable === false) return false
  return supportsBoardSupply(categoryId)
}

export function getBoardSupply(id: string): BoardSupplyOption {
  return BOARD_SUPPLY_LOOKUP[id as BoardSupplyId] ?? BOARD_SUPPLY_LOOKUP.finished
}

export function getBoardSupplyOptions(categoryId: string): BoardSupplyOption[] {
  return supportsBoardSupply(categoryId) ? BOARD_SUPPLIES : []
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
  /** shutter only vs with carcass — required for cabinetry categories */
  buildScope?: BuildScopeId
  /** Finished catalog product vs unfinished CNC-Carve HD Board */
  boardSupply?: BoardSupplyId
  /** Include sculpted handle pair add-on when product has handlePairPrice */
  includeHandlePair?: boolean
}

export function isCncCarveHd(config: Pick<PriceConfig, 'boardSupply'>): boolean {
  return config.boardSupply === 'cnc-carve-hd'
}

export function getCncCarveHdRate(
  product?: Pick<Product, 'cncCarveHdRate'>,
): number {
  return product?.cncCarveHdRate ?? CNC_CARVE_HD_RATE_PER_SQFT
}

const FINISH_LOOKUP: Record<string, FinishOption> = {
  pu: { id: 'pu', name: 'PU', multiplier: 1 },
  laminated: { id: 'laminated', name: 'Laminated', multiplier: 1 },
  'laminate-solid-wood': {
    id: 'laminate-solid-wood',
    name: 'Laminate + solid wood',
    multiplier: 1,
  },
  matte: { id: 'matte', name: 'Matte laminate', multiplier: 0.92 },
  'natural-oak': { id: 'natural-oak', name: 'Natural oak', multiplier: 1.18 },
  walnut: { id: 'walnut', name: 'Walnut veneer', multiplier: 1.32 },
  gloss: { id: 'gloss', name: 'High gloss lacquer', multiplier: 1.2 },
  textured: { id: 'textured', name: 'Textured finish', multiplier: 1.08 },
  ceramic: { id: 'ceramic', name: 'Ceramic coating', multiplier: 1 },
  /** 20% above product base finish (e.g. PU) */
  'ceramic-20': {
    id: 'ceramic-20',
    name: 'Ceramic coating (+20%)',
    multiplier: 1.2,
  },
  'ceramic-ss': {
    id: 'ceramic-ss',
    name: 'Ceramic + stainless steel',
    multiplier: 1,
  },
  /** 30% above ceramic / product base finish */
  oxidised: { id: 'oxidised', name: 'Oxidised finish (+30%)', multiplier: 1.3 },
  'iron-metallic': {
    id: 'iron-metallic',
    name: 'Iron metallic coating',
    multiplier: 1,
  },
  metallic: { id: 'metallic', name: 'Metallic', multiplier: 1 },
}

const THICKNESS_LOOKUP: Record<string, ThicknessOption> = {
  '6': { id: '6', label: '6 mm', mm: 6, multiplier: 1 },
  '12': { id: '12', label: '12 mm', mm: 12, multiplier: 0.82 },
  '16': { id: '16', label: '16 mm', mm: 16, multiplier: 1 },
  '18': { id: '18', label: '18 mm', mm: 18, multiplier: 0.92 },
  '22': { id: '22', label: '22 mm', mm: 22, multiplier: 1 },
  '25': { id: '25', label: '25 mm', mm: 25, multiplier: 1 },
  '28': { id: '28', label: '28 mm', mm: 28, multiplier: 1 },
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
    maxWidth: 14,
    minHeight: 1,
    maxHeight: 12,
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
    minHeight: 1,
    maxHeight: 12,
    maxDepth: 3,
  },
  temple: {
    defaultWidth: 3,
    defaultHeight: 6,
    defaultDepth: 1.5,
    baseWidth: 3,
    baseHeight: 6,
    baseDepth: 1.5,
    minWidth: 1,
    maxWidth: 14,
    minHeight: 1,
    maxHeight: 12,
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
  handles: {
    defaultWidth: 1,
    defaultHeight: 1,
    defaultDepth: 0.2,
    baseWidth: 1,
    baseHeight: 1,
    baseDepth: 0.2,
    usesDepth: false,
    minWidth: 1,
    maxWidth: 4,
    minHeight: 1,
    maxHeight: 4,
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
  'live-edge-furniture': {
    defaultWidth: 5,
    defaultHeight: 2.5,
    defaultDepth: 2.5,
    baseWidth: 5,
    baseHeight: 2.5,
    baseDepth: 2.5,
    minWidth: 1,
    maxWidth: 12,
    minHeight: 1,
    maxHeight: 4,
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

/** Finishes offered for this product (explicit list, or the single default) */
export function getFinishOptionsForProduct(
  product?: Pick<Product, 'defaultFinishId' | 'finishOptionIds'>,
): FinishOption[] {
  const ids = product?.finishOptionIds?.length
    ? product.finishOptionIds
    : product?.defaultFinishId
      ? [product.defaultFinishId]
      : []
  return ids.map((id) => getFinish(id))
}

/** Thicknesses offered for finished product (CNC uses cncThicknessId separately) */
export function getThicknessOptionsForProduct(
  product?: Pick<Product, 'defaultThicknessId' | 'thicknessOptionIds'>,
): ThicknessOption[] {
  const ids = product?.thicknessOptionIds?.length
    ? product.thicknessOptionIds
    : product?.defaultThicknessId
      ? [product.defaultThicknessId]
      : []
  return ids.map((id) => getThickness(id))
}

export function defaultConfig(
  categoryId: string,
  product?: Pick<
    Product,
    | 'defaultFinishId'
    | 'defaultThicknessId'
    | 'handlePairPrice'
    | 'handlePairDefault'
    | 'cncThicknessId'
  >,
): PriceConfig {
  const size = getSizeLimits(categoryId)
  return {
    finishId: product?.defaultFinishId ?? 'pu',
    thicknessId: product?.defaultThicknessId ?? '25',
    width: size.defaultWidth,
    height: size.defaultHeight,
    depth: size.defaultDepth,
    buildScope: 'shutter',
    boardSupply: 'finished',
    includeHandlePair:
      product?.handlePairPrice != null && product.handlePairDefault !== false,
  }
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

function roundFt(value: number) {
  return Math.round(value * 10) / 10
}

export function normalizeConfig(
  categoryId: string,
  config: PriceConfig,
  product?: Pick<
    Product,
    'cncThicknessId' | 'handlePairPrice' | 'carcassPrice' | 'cncAvailable'
  >,
): PriceConfig {
  const size = getSizeLimits(categoryId)
  const boardSupply = productSupportsCnc(categoryId, product)
    ? getBoardSupply(config.boardSupply ?? 'finished').id
    : 'finished'
  const buildScope =
    supportsBuildScope(categoryId) && productHasCarcass(product)
      ? getBuildScope(config.buildScope ?? 'shutter').id
      : 'shutter'
  const cnc = boardSupply === 'cnc-carve-hd'
  const thicknessId = cnc && product?.cncThicknessId
    ? getThickness(product.cncThicknessId).id
    : getThickness(config.thicknessId).id
  return {
    finishId: getFinish(config.finishId).id,
    thicknessId,
    width: clamp(roundFt(config.width), size.minWidth, size.maxWidth),
    height: clamp(roundFt(config.height), size.minHeight, size.maxHeight),
    depth: clamp(roundFt(config.depth), size.minDepth, size.maxDepth),
    buildScope,
    boardSupply,
    includeHandlePair:
      !cnc && product?.handlePairPrice != null
        ? Boolean(config.includeHandlePair)
        : false,
  }
}

/** Price from base product price × finish × thickness × size (sizes in feet) */
export function calculatePrice(
  product: Pick<
    Product,
    | 'price'
    | 'carcassPrice'
    | 'categoryId'
    | 'pricingMode'
    | 'defaultFinishId'
    | 'defaultThicknessId'
    | 'cncCarveHdRate'
    | 'cncThicknessId'
    | 'handlePairPrice'
  >,
  config: PriceConfig,
) {
  const size = getSizeLimits(product.categoryId)
  const normalized = normalizeConfig(product.categoryId, config, product)
  const finish = getFinish(normalized.finishId)
  const thickness = getThickness(normalized.thicknessId)
  const boardSupply = getBoardSupply(normalized.boardSupply ?? 'finished')
  const buildScope = getBuildScope(normalized.buildScope ?? 'shutter')

  let boardPrice: number
  let sizeFactor = 1
  let baseRate: number
  let handleAddOn = 0
  const sqft = normalized.width * normalized.height

  if (isCncCarveHd(normalized)) {
    // Unfinished CNC-Carve HD Board — flat ₹/sq ft, no paint / finishing / no handles
    sizeFactor = sqft
    baseRate = getCncCarveHdRate(product)
    boardPrice = Math.round(baseRate * sqft)
  } else {
    const baseFinish = getFinish(product.defaultFinishId ?? normalized.finishId)
    const baseThickness = getThickness(product.defaultThicknessId ?? normalized.thicknessId)
    const finishMult = finish.multiplier / baseFinish.multiplier
    // Thickness choices on the same product are rate-neutral unless multipliers differ
    const thicknessMult = thickness.multiplier / baseThickness.multiplier
    const usesScope = supportsBuildScope(product.categoryId)
    baseRate = usesScope
      ? getBuildScopeRate(product, buildScope.id)
      : product.price

    if (product.categoryId === 'commercials') {
      // Bulk packs are quoted per fixed package — not resized on the calculator
      sizeFactor = 1
      boardPrice = Math.round(baseRate * finishMult * thicknessMult)
    } else if (product.pricingMode === 'per-sqft') {
      sizeFactor = sqft
      boardPrice = Math.round(baseRate * sqft * finishMult * thicknessMult)
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
      boardPrice = Math.round(baseRate * finishMult * thicknessMult * sizeFactor)
    }

    if (normalized.includeHandlePair && product.handlePairPrice != null) {
      handleAddOn = product.handlePairPrice
    }
  }

  boardPrice = Math.max(499, boardPrice)

  return {
    /** Material / shutter-carcass / CNC total before handle add-on */
    boardPrice,
    /** Final quote total (board + optional handle pair) */
    unitPrice: boardPrice + handleAddOn,
    finish,
    thickness,
    buildScope,
    boardSupply,
    size,
    config: normalized,
    sizeFactor,
    baseRate,
    handleAddOn,
    sqft,
  }
}

export function configKey(config: PriceConfig) {
  return [
    config.finishId,
    config.thicknessId,
    config.width,
    config.height,
    config.depth,
    config.buildScope ?? 'shutter',
    config.boardSupply ?? 'finished',
    config.includeHandlePair ? 'handles' : 'no-handles',
  ].join('|')
}

export function describeConfig(categoryId: string, config: PriceConfig) {
  const dims = `${config.width} × ${config.height} ft`
  if (isCncCarveHd(config)) {
    return [
      'CNC-Carve HD Board',
      'No paint · No finishing',
      getThickness(config.thicknessId).label,
      dims,
    ].join(' · ')
  }
  const finish = getFinish(config.finishId)
  const thickness = getThickness(config.thicknessId)
  const parts = [`${finish.name} · ${thickness.label} · ${dims}`]
  if (supportsBuildScope(categoryId)) {
    parts.unshift(getBuildScope(config.buildScope ?? 'shutter').name)
  }
  if (config.includeHandlePair) {
    parts.push('Handle pair')
  }
  return parts.join(' · ')
}
