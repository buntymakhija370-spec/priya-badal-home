import { categories, type Product } from '../data/catalog'
import {
  CARCASS_ASSEMBLY_PATH,
  CARCASS_CONSTRUCTION_DETAIL,
  CARCASS_CONSTRUCTION_SHORT,
  CARCASS_SPEC_ROWS,
} from '../data/carcassSpec'
import { MATERIAL_POINTS, PRODUCT_WARRANTY } from '../data/materials'
import { getAllProducts, getProductById } from './products'
import {
  calculatePrice,
  defaultConfig,
  describeConfig,
  productHasCarcass,
  type BuildScopeId,
} from './pricing'
import { formatPrice } from '../data/catalog'
import type { ConsultBrief } from './interiorAI'

function productLine(p: Product): string {
  const mode = p.pricingMode === 'per-sqft' ? '/sqft' : '/unit'
  const carcass =
    p.carcassPrice != null
      ? ` | carcass ${p.carcassPrice}${mode}`
      : ''
  const specs = (p.specifications ?? [])
    .slice(0, 3)
    .map((s) => `${s.label}:${s.value}`)
    .join('; ')
  return [
    `${p.id} | ${p.name} | ${p.categoryId}/${p.subcategoryId}`,
    `shutter ${p.price}${mode}${carcass}`,
    `styles:${p.style.join(',') || '-'} rooms:${p.rooms.join(',') || '-'}`,
    p.description?.slice(0, 140) || '',
    specs ? `specs:${specs}` : '',
    (p.highlights ?? []).slice(0, 3).join('; '),
  ]
    .filter(Boolean)
    .join(' · ')
}

/** Compact full-catalog knowledge for the sales LLM */
export function buildCatalogKnowledge(brief: ConsultBrief, query = ''): string {
  const products = getAllProducts()
  const q = query.toLowerCase()

  // Rank: selected first, then name/query hits, then same category, then rest
  const scored = products.map((p) => {
    let score = 0
    if (brief.selectedProductId === p.id) score += 100
    if (brief.categoryId && p.categoryId === brief.categoryId) score += 20
    if (q && p.name.toLowerCase().includes(q)) score += 40
    if (q) {
      for (const token of q.split(/\s+/)) {
        if (token.length > 3 && p.name.toLowerCase().includes(token)) score += 5
        if (token.length > 3 && p.description.toLowerCase().includes(token))
          score += 2
      }
    }
    return { p, score }
  })
  scored.sort((a, b) => b.score - a.score)

  const top = scored.slice(0, 40).map((r) => r.p)
  const rest = scored.slice(40).map((r) => r.p)

  const categoryLines = categories.map(
    (c) =>
      `${c.id}: ${c.name} — ${c.description}${
        c.customizable === false ? ' (fixed pieces, not custom size)' : ''
      }`,
  )

  const selected = brief.selectedProductId
    ? getProductById(brief.selectedProductId)
    : undefined

  const facts: string[] = []
  if (selected) {
    facts.push(`SELECTED PRODUCT: ${selected.name} (${selected.id})`)
    facts.push(
      `Shutter rate: ${formatPrice(selected.price)}${
        selected.pricingMode === 'per-sqft' ? '/sq ft' : ''
      }`,
    )
    if (productHasCarcass(selected)) {
      facts.push(
        `Carcass rate: ${formatPrice(selected.carcassPrice!)}${
          selected.pricingMode === 'per-sqft' ? '/sq ft' : ''
        }`,
      )
      facts.push(
        `With carcass combined rate: ${formatPrice(
          selected.price + selected.carcassPrice!,
        )}${selected.pricingMode === 'per-sqft' ? '/sq ft' : ''}`,
      )
    }
    if (brief.widthFt != null && brief.heightFt != null) {
      const scope: BuildScopeId = productHasCarcass(selected)
        ? 'with-carcass'
        : 'shutter'
      const base = defaultConfig(selected.categoryId, selected)
      const quote = calculatePrice(selected, {
        ...base,
        width: brief.widthFt,
        height: brief.heightFt,
        depth: brief.depthFt ?? base.depth,
        buildScope: scope,
      })
      facts.push(
        `COMPUTED ESTIMATE for ${brief.widthFt}×${brief.heightFt}${
          brief.depthFt != null ? `×${brief.depthFt}` : ''
        } ft (${describeConfig(selected.categoryId, quote.config)}): ${formatPrice(quote.unitPrice)}`,
      )
      if (productHasCarcass(selected) && selected.pricingMode === 'per-sqft') {
        const shutter = calculatePrice(selected, {
          ...base,
          width: brief.widthFt,
          height: brief.heightFt,
          depth: brief.depthFt ?? base.depth,
          buildScope: 'shutter',
        })
        facts.push(
          `Shutter-only same size estimate: ${formatPrice(shutter.unitPrice)}`,
        )
      }
    }
    if (selected.features?.length) {
      facts.push(`Features: ${selected.features.slice(0, 6).join('; ')}`)
    }
    if (selected.specifications?.length) {
      facts.push(
        `Specs: ${selected.specifications
          .slice(0, 8)
          .map((s) => `${s.label}=${s.value}`)
          .join('; ')}`,
      )
    }
  }

  if (brief.room) facts.push(`Client room: ${brief.room}`)
  if (brief.widthFt != null && brief.heightFt != null) {
    facts.push(
      `Client size: ${brief.widthFt}×${brief.heightFt}${
        brief.depthFt != null ? `×${brief.depthFt}` : ''
      } ft`,
    )
  }
  if (brief.style) facts.push(`Client style: ${brief.style}`)
  if (brief.budget != null) facts.push(`Client budget: ${formatPrice(brief.budget)}`)
  if (brief.roomPhotoDataUrl) {
    facts.push(
      brief.attachmentKind === 'drawing'
        ? 'Architect drawing attached in chat'
        : 'Room photo attached in chat',
    )
  }
  if (brief.aiImageUrl) facts.push('AI visualisation already generated in chat')

  return [
    '=== PRIYABADAL HOMES SESSION FACTS (trusted — use these numbers) ===',
    facts.length ? facts.join('\n') : 'No product selected yet.',
    '',
    '=== CATEGORIES ===',
    ...categoryLines,
    '',
    '=== MATERIALS PROMISE ===',
    ...MATERIAL_POINTS.map((m) => `${m.title}: ${m.body}`),
    '',
    '=== WARRANTY (every product) ===',
    PRODUCT_WARRANTY,
    '',
    '=== CARCASS CONSTRUCTION STANDARD (trusted) ===',
    CARCASS_CONSTRUCTION_SHORT,
    CARCASS_CONSTRUCTION_DETAIL,
    ...CARCASS_SPEC_ROWS.map((r) => `${r.label}: ${r.value}`),
    `Assembly guide URL path: ${CARCASS_ASSEMBLY_PATH}`,
    '',
    '=== CATALOG PRIORITY PRODUCTS (detail) ===',
    ...top.map(productLine),
    '',
    '=== OTHER PRODUCTS (compact) ===',
    ...rest.map(
      (p) =>
        `${p.id} | ${p.name} | ${p.categoryId} | ₹${p.price}${
          p.pricingMode === 'per-sqft' ? '/sqft' : ''
        }${p.carcassPrice != null ? ` +carcass₹${p.carcassPrice}` : ''}`,
    ),
  ].join('\n')
}

export function parseAiProductIds(text: string): string[] {
  const match = text.match(/PRODUCTS:\s*([^\n]+)/i)
  if (!match) return []
  return match[1]!
    .split(/[,|]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6)
}

export function parseAiSuggestions(text: string): string[] {
  const match = text.match(/SUGGESTIONS:\s*([^\n]+)/i)
  if (!match) return []
  return match[1]!
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5)
}

/** Strip machine footer lines from user-visible reply */
export function stripAiMeta(text: string): string {
  return text
    .replace(/\n*PRODUCTS:\s*[^\n]+/gi, '')
    .replace(/\n*SUGGESTIONS:\s*[^\n]+/gi, '')
    .trim()
}
