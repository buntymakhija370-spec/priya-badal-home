import type { Product } from '../data/catalog'
import { formatPrice } from './currency'
import {
  calculatePrice,
  getFinish,
  getFinishOptionsForProduct,
  getSizeLimits,
  getThickness,
  getThicknessOptionsForProduct,
  type PriceConfig,
} from './pricing'
import { WHATSAPP_QUOTE_NUMBER } from './whatsapp'

export type CarcassCategory = 'wardrobe' | 'kitchen'

export type BayKind =
  | 'hanging'
  | 'double-hanging'
  | 'shelves'
  | 'drawers'
  | 'combo'
  | 'shoes'
  | 'open-display'
  | 'base-cabinet'
  | 'wall-cabinet'
  | 'tall-unit'
  | 'sink-base'
  | 'appliance'

export type CarcassBay = {
  id: string
  kind: BayKind
  /** Relative width weight among bays */
  weight: number
  label: string
}

export type LayoutPresetId =
  | 'balanced'
  | 'max-hanging'
  | 'max-drawers'
  | 'family'
  | 'compact'
  | 'luxe-open'

export type CarcassPlannerRates = {
  shutterPerSqft: number
  carcassPerSqft: number
  finishId: string
  thicknessId: string
}

export type CarcassQuote = {
  width: number
  height: number
  depth: number
  sqft: number
  shutterRate: number
  carcassRate: number
  combinedRate: number
  finishMult: number
  thicknessMult: number
  moduleAddOn: number
  boardPrice: number
  unitPrice: number
  baySummary: string
}

const WARDROBE_KINDS: BayKind[] = [
  'hanging',
  'double-hanging',
  'shelves',
  'drawers',
  'combo',
  'shoes',
  'open-display',
]

const KITCHEN_KINDS: BayKind[] = [
  'base-cabinet',
  'wall-cabinet',
  'tall-unit',
  'sink-base',
  'appliance',
  'drawers',
  'open-display',
]

const BAY_META: Record<
  BayKind,
  { label: string; short: string; moduleCost: number; tone: string }
> = {
  hanging: { label: 'Long hanging', short: 'Hang', moduleCost: 0, tone: '#6b5344' },
  'double-hanging': {
    label: 'Double hanging',
    short: '2× Hang',
    moduleCost: 400,
    tone: '#5c4a3a',
  },
  shelves: { label: 'Open shelves', short: 'Shelves', moduleCost: 0, tone: '#7a6550' },
  drawers: { label: 'Drawer bank', short: 'Drawers', moduleCost: 1200, tone: '#8a6a45' },
  combo: { label: 'Hang + drawers', short: 'Combo', moduleCost: 800, tone: '#6f5844' },
  shoes: { label: 'Shoe racks', short: 'Shoes', moduleCost: 600, tone: '#6a5a48' },
  'open-display': {
    label: 'Open display',
    short: 'Display',
    moduleCost: 300,
    tone: '#7d6b55',
  },
  'base-cabinet': {
    label: 'Base cabinet',
    short: 'Base',
    moduleCost: 0,
    tone: '#5a6b58',
  },
  'wall-cabinet': {
    label: 'Wall cabinet',
    short: 'Wall',
    moduleCost: 0,
    tone: '#6a7a68',
  },
  'tall-unit': { label: 'Tall unit', short: 'Tall', moduleCost: 900, tone: '#4f6a58' },
  'sink-base': { label: 'Sink base', short: 'Sink', moduleCost: 1500, tone: '#5c7060' },
  appliance: {
    label: 'Appliance bay',
    short: 'Appliance',
    moduleCost: 700,
    tone: '#556b58',
  },
}

/** Default rates when no catalog product is selected (INR / sq ft) */
export const DEFAULT_RATES: Record<CarcassCategory, CarcassPlannerRates> = {
  wardrobe: {
    shutterPerSqft: 1300,
    carcassPerSqft: 2200,
    finishId: 'pu',
    thicknessId: '25',
  },
  kitchen: {
    shutterPerSqft: 1400,
    carcassPerSqft: 2400,
    finishId: 'laminated',
    thicknessId: '18',
  },
}

export const LAYOUT_PRESETS: {
  id: LayoutPresetId
  name: string
  hint: string
}[] = [
  { id: 'balanced', name: 'Balanced', hint: 'Hang + shelves + drawers' },
  { id: 'max-hanging', name: 'Max hanging', hint: 'More hanging rails' },
  { id: 'max-drawers', name: 'Max drawers', hint: 'Folded storage focus' },
  { id: 'family', name: 'Family', hint: 'Mixed zones for two people' },
  { id: 'compact', name: 'Compact', hint: 'Tight wall, essential bays' },
  { id: 'luxe-open', name: 'Luxe open', hint: 'Display + lit open feel' },
]

let baySeq = 0
function nextBayId() {
  baySeq += 1
  return `bay-${baySeq}`
}

export function bayMeta(kind: BayKind) {
  return BAY_META[kind]
}

export function kindsForCategory(category: CarcassCategory): BayKind[] {
  return category === 'kitchen' ? KITCHEN_KINDS : WARDROBE_KINDS
}

export function makeBay(kind: BayKind, weight = 1): CarcassBay {
  return {
    id: nextBayId(),
    kind,
    weight,
    label: BAY_META[kind].label,
  }
}

function bayCountForWidth(widthFt: number, compact: boolean) {
  if (compact) return Math.max(2, Math.min(4, Math.round(widthFt / 2.4)))
  return Math.max(2, Math.min(6, Math.round(widthFt / 1.8)))
}

/** Rule-based layout engine — works offline, no API key */
export function suggestLayout(
  category: CarcassCategory,
  widthFt: number,
  preset: LayoutPresetId = 'balanced',
  prompt = '',
): CarcassBay[] {
  const lower = prompt.toLowerCase()
  const compact = preset === 'compact' || lower.includes('small') || lower.includes('compact')
  const count = bayCountForWidth(widthFt, compact)

  if (category === 'kitchen') {
    return suggestKitchen(count, preset, lower)
  }
  return suggestWardrobe(count, preset, lower)
}

function suggestWardrobe(
  count: number,
  preset: LayoutPresetId,
  prompt: string,
): CarcassBay[] {
  const wantsHang =
    prompt.includes('hang') ||
    prompt.includes('clothes') ||
    preset === 'max-hanging'
  const wantsDrawers =
    prompt.includes('drawer') ||
    prompt.includes('fold') ||
    preset === 'max-drawers'
  const wantsShoes = prompt.includes('shoe') || preset === 'family'
  const wantsOpen =
    prompt.includes('open') ||
    prompt.includes('display') ||
    prompt.includes('led') ||
    preset === 'luxe-open'

  const plan: BayKind[] = []

  if (preset === 'max-hanging' || wantsHang) {
    plan.push('hanging', 'double-hanging', 'hanging')
  } else if (preset === 'max-drawers' || wantsDrawers) {
    plan.push('drawers', 'shelves', 'drawers')
  } else if (preset === 'luxe-open' || wantsOpen) {
    plan.push('open-display', 'hanging', 'shelves', 'combo')
  } else if (preset === 'family') {
    plan.push('hanging', 'double-hanging', 'drawers', 'shoes', 'shelves')
  } else if (preset === 'compact') {
    plan.push('combo', 'shelves')
  } else {
    plan.push('hanging', 'shelves', 'drawers', 'combo')
  }

  if (wantsShoes && !plan.includes('shoes')) plan.push('shoes')
  if (wantsDrawers && !plan.includes('drawers')) plan.push('drawers')
  if (wantsOpen && !plan.includes('open-display')) plan.splice(1, 0, 'open-display')

  while (plan.length < count) {
    plan.push(plan.length % 2 === 0 ? 'shelves' : 'hanging')
  }

  return plan.slice(0, count).map((kind, i) => {
    const weight =
      kind === 'open-display' || kind === 'shoes' ? 0.85 : kind === 'hanging' ? 1.15 : 1
    return makeBay(kind, i === 0 ? weight + 0.1 : weight)
  })
}

function suggestKitchen(
  count: number,
  preset: LayoutPresetId,
  prompt: string,
): CarcassBay[] {
  const wantsTall =
    prompt.includes('tall') || prompt.includes('pantry') || preset === 'family'
  const wantsSink = prompt.includes('sink') || preset !== 'compact'
  const wantsAppliance =
    prompt.includes('oven') ||
    prompt.includes('fridge') ||
    prompt.includes('appliance') ||
    preset === 'luxe-open'

  const plan: BayKind[] = []
  if (wantsTall) plan.push('tall-unit')
  if (wantsSink) plan.push('sink-base')
  if (wantsAppliance) plan.push('appliance')

  if (preset === 'max-drawers') {
    plan.push('drawers', 'base-cabinet', 'drawers')
  } else if (preset === 'compact') {
    plan.push('base-cabinet', 'wall-cabinet')
  } else {
    plan.push('base-cabinet', 'wall-cabinet', 'drawers', 'base-cabinet')
  }

  while (plan.length < count) {
    plan.push(plan.length % 2 === 0 ? 'base-cabinet' : 'wall-cabinet')
  }

  return plan.slice(0, count).map((kind) => makeBay(kind, kind === 'tall-unit' ? 1.2 : 1))
}

export function parsePromptToPreset(prompt: string): LayoutPresetId {
  const lower = prompt.toLowerCase()
  if (lower.includes('hang') || lower.includes('rail')) return 'max-hanging'
  if (lower.includes('drawer') || lower.includes('fold')) return 'max-drawers'
  if (lower.includes('family') || lower.includes('couple') || lower.includes('two'))
    return 'family'
  if (lower.includes('small') || lower.includes('compact') || lower.includes('tight'))
    return 'compact'
  if (lower.includes('open') || lower.includes('display') || lower.includes('luxe'))
    return 'luxe-open'
  return 'balanced'
}

export function bayWidthsFt(bays: CarcassBay[], totalWidth: number): number[] {
  const sum = bays.reduce((s, b) => s + b.weight, 0) || 1
  return bays.map((b) => Math.round((totalWidth * (b.weight / sum)) * 10) / 10)
}

export function moduleAddOnInr(bays: CarcassBay[]): number {
  return bays.reduce((sum, b) => sum + BAY_META[b.kind].moduleCost, 0)
}

export function ratesFromProduct(
  category: CarcassCategory,
  product?: Product | null,
): CarcassPlannerRates {
  const fallback = DEFAULT_RATES[category]
  if (!product) return { ...fallback }

  const useCatalogRates =
    product.pricingMode === 'per-sqft' &&
    product.price > 0 &&
    product.price < 20000

  return {
    shutterPerSqft: useCatalogRates ? product.price : fallback.shutterPerSqft,
    carcassPerSqft:
      useCatalogRates && product.carcassPrice != null
        ? product.carcassPrice
        : fallback.carcassPerSqft,
    finishId: product.defaultFinishId ?? fallback.finishId,
    thicknessId: product.defaultThicknessId ?? fallback.thicknessId,
  }
}

/** Synthetic product so we can reuse calculatePrice for finish/thickness */
export function plannerAsProduct(
  category: CarcassCategory,
  rates: CarcassPlannerRates,
): Pick<
  Product,
  | 'price'
  | 'carcassPrice'
  | 'categoryId'
  | 'pricingMode'
  | 'defaultFinishId'
  | 'defaultThicknessId'
> {
  return {
    price: rates.shutterPerSqft,
    carcassPrice: rates.carcassPerSqft,
    categoryId: category,
    pricingMode: 'per-sqft',
    defaultFinishId: rates.finishId,
    defaultThicknessId: rates.thicknessId,
  }
}

export function quoteCarcass(input: {
  category: CarcassCategory
  width: number
  height: number
  depth: number
  bays: CarcassBay[]
  rates: CarcassPlannerRates
  finishId: string
  thicknessId: string
}): CarcassQuote {
  const product = plannerAsProduct(input.category, input.rates)
  const config: PriceConfig = {
    finishId: input.finishId,
    thicknessId: input.thicknessId,
    width: input.width,
    height: input.height,
    depth: input.depth,
    buildScope: 'with-carcass',
    boardSupply: 'finished',
    includeHandlePair: false,
  }
  const priced = calculatePrice(product, config)
  const addOn = moduleAddOnInr(input.bays)
  const unitPrice = priced.boardPrice + addOn
  const widths = bayWidthsFt(input.bays, input.width)
  const baySummary = input.bays
    .map((b, i) => `${BAY_META[b.kind].short} ${widths[i]}ft`)
    .join(' · ')

  return {
    width: priced.config.width,
    height: priced.config.height,
    depth: priced.config.depth,
    sqft: priced.sqft,
    shutterRate: input.rates.shutterPerSqft,
    carcassRate: input.rates.carcassPerSqft,
    combinedRate: input.rates.shutterPerSqft + input.rates.carcassPerSqft,
    finishMult: getFinish(input.finishId).multiplier / getFinish(product.defaultFinishId!).multiplier,
    thicknessMult:
      getThickness(input.thicknessId).multiplier /
      getThickness(product.defaultThicknessId!).multiplier,
    moduleAddOn: addOn,
    boardPrice: priced.boardPrice,
    unitPrice,
    baySummary,
  }
}

export function buildCarcassWhatsAppUrl(input: {
  category: CarcassCategory
  productName?: string
  quote: CarcassQuote
  finishId: string
  thicknessId: string
  notes?: string
  usedLiveAi?: boolean
}) {
  const title =
    input.category === 'kitchen' ? 'Kitchen carcass plan' : 'Wardrobe carcass plan'
  const lines = [
    `Hi Priyabadal Homes, I designed a ${title} on the Carcass Planner:`,
    '',
    input.productName ? `Style reference: ${input.productName}` : null,
    `Size: ${input.quote.width} × ${input.quote.height} × ${input.quote.depth} ft`,
    `Area: ${input.quote.sqft.toFixed(1)} sq ft`,
    `Layout: ${input.quote.baySummary}`,
    `Finish: ${getFinish(input.finishId).name} · ${getThickness(input.thicknessId).label}`,
    input.usedLiveAi
      ? 'Visual: Live-size AI carcass generated on the website'
      : null,
    `Rates: shutter ${formatPrice(input.quote.shutterRate, 'INR')}/sq ft · carcass ${formatPrice(input.quote.carcassRate, 'INR')}/sq ft`,
    `Module add-ons: ${formatPrice(input.quote.moduleAddOn, 'INR')}`,
    `Estimated total: ${formatPrice(input.quote.unitPrice, 'INR')} (with carcass)`,
    input.notes?.trim() ? `Notes: ${input.notes.trim()}` : null,
    '',
    'Please confirm final quote. Thank you.',
  ].filter(Boolean) as string[]

  return `https://wa.me/${WHATSAPP_QUOTE_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`
}

export function finishOptionsForPlanner(
  category: CarcassCategory,
  product?: Product | null,
) {
  if (product) {
    const opts = getFinishOptionsForProduct(product)
    if (opts.length) return opts
  }
  if (category === 'kitchen') {
    return ['laminated', 'pu', 'laminate-solid-wood'].map((id) => getFinish(id))
  }
  return ['pu', 'laminated', 'laminate-solid-wood', 'walnut'].map((id) => getFinish(id))
}

export function thicknessOptionsForPlanner(
  category: CarcassCategory,
  product?: Product | null,
) {
  if (product) {
    const opts = getThicknessOptionsForProduct(product)
    if (opts.length) return opts
  }
  if (category === 'kitchen') {
    return ['18', '16', '25'].map((id) => getThickness(id))
  }
  return ['25', '18', '22'].map((id) => getThickness(id))
}

export function defaultSize(category: CarcassCategory) {
  return getSizeLimits(category)
}

export function aiExplanation(
  category: CarcassCategory,
  preset: LayoutPresetId,
  bays: CarcassBay[],
  width: number,
): string {
  const kinds = bays.map((b) => BAY_META[b.kind].label.toLowerCase())
  const unique = [...new Set(kinds)]
  const room = category === 'kitchen' ? 'kitchen run' : 'wardrobe wall'
  const presetName = LAYOUT_PRESETS.find((p) => p.id === preset)?.name ?? 'Balanced'
  return `${presetName} plan for a ${width} ft ${room}: ${bays.length} bays — ${unique.join(', ')}. Price updates from shutter + carcass rates and module add-ons.`
}

/** Exterior / closed façade — first catalog image */
export function getProductExteriorImage(product?: Product | null): string | null {
  if (!product) return null
  const images = product.images?.length ? product.images : product.image ? [product.image] : []
  return images[0] ?? null
}

/**
 * Open carcass / interior photo.
 * Wardrobe catalog stores carcass as the last gallery image.
 */
export function getProductCarcassImage(product?: Product | null): string | null {
  if (!product) return null
  const images = product.images?.length ? product.images : product.image ? [product.image] : []
  if (!images.length) return null
  if (images.length === 1) return images[0]!
  return images[images.length - 1]!
}
