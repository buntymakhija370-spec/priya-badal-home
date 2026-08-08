import { formatPrice, type Product } from '../data/catalog'
import {
  CARCASS_ASSEMBLY_PATH,
  CARCASS_CONSTRUCTION_DETAIL,
  CARCASS_CONSTRUCTION_SHORT,
  CARCASS_SPEC_ROWS,
} from '../data/carcassSpec'
import { MATERIAL_POINTS } from '../data/materials'
import { getAllProducts, getProductById } from './products'
import { resolveProductPresentation } from './productSpecs'
import {
  calculatePrice,
  defaultConfig,
  describeConfig,
  productHasCarcass,
  supportsBuildScope,
  type BuildScopeId,
  type PriceConfig,
} from './pricing'
import type { ChatMessage, ConsultBrief } from './interiorAI'

export type CatalogIntent =
  | 'price'
  | 'carcass'
  | 'specs'
  | 'materials'
  | 'design'
  | 'range'
  | null

/** Detect sales Q&A intents (price / carcass / specs / materials / design / range) */
export function detectCatalogIntent(text: string): CatalogIntent {
  const t = text.trim().toLowerCase()
  if (!t) return null

  // Visualisation requests are handled by the chat router — not catalog Q&A
  if (
    /\bvisuali[sz](?:e|es|ed|ing|ation|ations)\b/i.test(t) ||
    /\b(open[- ]?carcass|live[- ]?size carcass)\b/i.test(t)
  ) {
    return null
  }

  if (
    /\b(carcass|kaka|kakas|with[- ]?carcass|cabinet box|shutter only|shutter vs|box rate|carcus)\b/i.test(
      t,
    )
  ) {
    return 'carcass'
  }

  // Economic / collection range asks — salesperson pitches options + tentative rates
  if (
    /\b(economic|economy|affordable|cheap|entry[- ]?level|low[- ]?cost)\b/i.test(t) ||
    /\b(wall )?panel(s)? range\b/i.test(t) ||
    /\b(g[- ]?series|poly coating|hdr panels?|pu panels?)\b/i.test(t) ||
    /\b(show|give|send|share|list)\b.{0,48}\b(economic|budget|affordable|g[- ]?series).{0,40}\b(panel|range|design|option)/i.test(
      t,
    ) ||
    /\b(range of|collection of)\b.{0,30}\b(panel|kitchen|wardrobe|temple|door)/i.test(t) ||
    /\b(budget|value)\b.{0,24}\b(panel|kitchen|wardrobe|range|collection)\b/i.test(t) ||
    /^show more g[- ]?series$/i.test(t)
  ) {
    return 'range'
  }

  if (
    /\b(how much|price|pricing|cost|rate|quote|estimate|budget|₹|rs\.?|inr|per sq|sq\.?\s*ft|sqft)\b/i.test(
      t,
    )
  ) {
    return 'price'
  }

  if (
    /\b(spec|specs|specification|thickness|finish|material|materials|plywood|laminate|hardware|warranty|board|mm\b|what('s| is) (it|this) made|made of)\b/i.test(
      t,
    )
  ) {
    // General brand materials Q — unless they also ask for product specs
    if (
      /\b(what materials|materials do you|board quality|your (hardware|warranty)|certified boards)\b/i.test(
        t,
      ) &&
      !/\b(spec|specs|this (product|design)|thickness|finish of)\b/i.test(t)
    ) {
      return 'materials'
    }
    return 'specs'
  }

  if (
    /\b(tell me (about|more)|explain|what('s| is) (this|the) (design|style|look)|describe|features?|highlights?|how (does|do) (it|this) (look|work)|design (details?|help)|understand (the )?design)\b/i.test(
      t,
    )
  ) {
    return 'design'
  }

  return null
}

function scopeFromText(text: string): BuildScopeId | undefined {
  const t = text.toLowerCase()
  if (/\b(shutter only|only shutter|front only|doors? only)\b/.test(t)) {
    return 'shutter'
  }
  if (
    /\b(with[- ]?carcass|full unit|complete|including carcass|incl\.? carcass)\b/.test(
      t,
    )
  ) {
    return 'with-carcass'
  }
  if (/\bcarcass\b/.test(t) && !/\bshutter\b/.test(t)) {
    return 'with-carcass'
  }
  return undefined
}

/** Resolve product from selection, or fuzzy name match in the user message */
export function resolveChatProduct(
  brief: ConsultBrief,
  text: string,
): Product | undefined {
  if (brief.selectedProductId) {
    const selected = getProductById(brief.selectedProductId)
    if (selected) return selected
  }

  const lower = text.toLowerCase()
  const products = getAllProducts()
  let best: { product: Product; score: number } | null = null

  for (const product of products) {
    const name = product.name.toLowerCase()
    let score = 0
    if (lower.includes(name)) score += 10
    else {
      const tokens = name.split(/[^a-z0-9]+/).filter((w) => w.length > 3)
      const hits = tokens.filter((w) => lower.includes(w)).length
      if (hits >= 2) score += hits * 2
      else if (hits === 1 && tokens.length <= 3) score += 2
    }
    if (brief.categoryId && product.categoryId === brief.categoryId) {
      score += 1
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { product, score }
    }
  }

  return best && best.score >= 3 ? best.product : undefined
}

function buildConfig(
  product: Product,
  brief: ConsultBrief,
  scope: BuildScopeId,
): PriceConfig {
  const base = defaultConfig(product.categoryId, product)
  return {
    ...base,
    width: brief.widthFt ?? base.width,
    height: brief.heightFt ?? base.height,
    depth: brief.depthFt ?? base.depth,
    buildScope: productHasCarcass(product) ? scope : 'shutter',
  }
}

function rateLines(product: Product): string[] {
  const perSq = product.pricingMode === 'per-sqft'
  const unit = perSq ? '/sq ft' : ''
  const lines = [
    `• Shutter / catalog rate: ${formatPrice(product.price)}${unit}`,
  ]
  if (productHasCarcass(product)) {
    lines.push(
      `• Carcass rate: ${formatPrice(product.carcassPrice!)}${unit}`,
      `• With carcass (shutter + carcass): ${formatPrice(
        product.price + product.carcassPrice!,
      )}${unit}`,
    )
  } else if (supportsBuildScope(product.categoryId)) {
    lines.push(
      '• Carcass: not listed separately on this product — ask WhatsApp for carcass scope, or ask me for layout rates in this chat.',
    )
  }
  return lines
}

function estimateBlock(
  product: Product,
  brief: ConsultBrief,
  scope: BuildScopeId,
): string[] {
  if (brief.widthFt == null || brief.heightFt == null) {
    return [
      'Share size in feet (e.g. 8 x 7) and I’ll calculate an estimate for your wall.',
    ]
  }

  const config = buildConfig(product, brief, scope)
  const quote = calculatePrice(product, config)
  const lines = [
    `Estimate for ${quote.config.width} × ${quote.config.height}${
      quote.config.depth ? ` × ${quote.config.depth}` : ''
    } ft:`,
    `• ${describeConfig(product.categoryId, quote.config)}`,
  ]

  if (product.pricingMode === 'per-sqft') {
    lines.push(`• Area: ${quote.sqft.toFixed(1)} sq ft`)
    lines.push(`• Working rate: ${formatPrice(quote.baseRate)}/sq ft`)
  }

  lines.push(`• Estimated total: ${formatPrice(quote.unitPrice)}`)

  if (
    productHasCarcass(product) &&
    scope === 'with-carcass' &&
    product.pricingMode === 'per-sqft'
  ) {
    const shutterOnly = calculatePrice(
      product,
      buildConfig(product, brief, 'shutter'),
    )
    lines.push(
      `• (Shutter-only for same size would be about ${formatPrice(shutterOnly.unitPrice)})`,
    )
  }

  lines.push(
    '',
    'This is a catalog estimate — final quote confirmed on WhatsApp after site measure / finish choice.',
  )
  return lines
}

function msg(
  text: string,
  extras?: Pick<ChatMessage, 'products' | 'suggestions'>,
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    text,
    ...extras,
  }
}

export function answerPriceQuestion(
  brief: ConsultBrief,
  text: string,
): ChatMessage {
  const product = resolveChatProduct(brief, text)
  if (!product) {
    // No SKU yet — pitch the economic / collection range like a salesperson
    const range = answerRangeQuestion(brief, text)
    if (range) return range
    return msg(
      [
        'I can quote from our catalog — pick a product first (or name one), then ask for price.',
        brief.categoryId
          ? `You’re looking at ${brief.room ?? brief.categoryId}. Ask me to “suggest styles”, then tap a product.`
          : 'Tell me kitchen / wardrobe / temple / panels / mouldings / partitions / carcass, or ask me to suggest styles.',
        '',
        'Tip: share size in feet (e.g. 8 x 7) for a size-based estimate.',
        'Or say “economic wall panel range” and I’ll send designs with tentative rates.',
      ].join('\n'),
      {
        suggestions: [
          'Economic wall panel range',
          'Suggest styles',
          'Wardrobe price for 8x7',
          'What is carcass pricing?',
        ],
      },
    )
  }

  const preferred = scopeFromText(text)
  const scope: BuildScopeId =
    preferred ?? (productHasCarcass(product) ? 'with-carcass' : 'shutter')

  return msg(
    [
      `Pricing for ${product.name}:`,
      '',
      ...rateLines(product),
      '',
      ...estimateBlock(product, brief, scope),
    ].join('\n'),
    {
      products: [product],
      suggestions: [
        productHasCarcass(product) ? 'Explain carcass pricing' : 'Material specs',
        brief.widthFt != null ? 'WhatsApp quote' : 'Size 8 x 7',
        'Tell me about this design',
        'Suggest other styles',
      ],
    },
  )
}

export function answerCarcassQuestion(
  brief: ConsultBrief,
  text: string,
): ChatMessage {
  const product = resolveChatProduct(brief, text)

  const general = [
    'Carcass = the cabinet box (sides, shelves, top/bottom). Shutter = the front doors/panels.',
    '',
    `Our carcass construction standard: ${CARCASS_CONSTRUCTION_SHORT}.`,
    CARCASS_CONSTRUCTION_DETAIL,
    '',
    ...CARCASS_SPEC_ROWS.map((r) => `• ${r.label}: ${r.value}`),
    `• Assembly guide (drawing + QR): ${CARCASS_ASSEMBLY_PATH}`,
    '',
    'How we price it on Priyabadal Homes:',
    '• Shutter only — fronts / doors at the catalog shutter rate.',
    '• With carcass — shutter rate + carcass rate (both added), when the product lists a carcass rate.',
    '• Many wardrobes & temple walls are priced per sq ft for each rate.',
    '',
    'For bay layouts (hanging + drawers + shelves), tell me your width and preferred modules — I’ll estimate carcass rates plus typical module add-ons.',
  ]

  if (!product) {
    return msg(
      [
        ...general,
        '',
        'Pick a product and I’ll show its exact shutter vs carcass rates (and a size estimate if you share feet).',
      ].join('\n'),
      {
        suggestions: [
          'Suggest styles',
          'Wardrobe 8x7 with carcass',
          'Open carcass assembly guide',
          'Material specs',
        ],
      },
    )
  }

  const body = [
    ...general,
    '',
    `For ${product.name}:`,
    ...rateLines(product),
    '',
    ...(productHasCarcass(product)
      ? estimateBlock(product, brief, scopeFromText(text) ?? 'with-carcass')
      : [
          'This product doesn’t list a separate carcass rate in the catalog.',
          'Ask me here for a size-based estimate, or WhatsApp us for a full unit quote.',
        ]),
  ]

  return msg(body.join('\n'), {
    products: [product],
    suggestions: [
      'Price estimate',
      'Material specs',
      brief.widthFt != null ? 'WhatsApp quote' : 'Size 8 x 7',
      'Tell me about this design',
    ],
  })
}

export function answerSpecsQuestion(
  brief: ConsultBrief,
  text: string,
): ChatMessage {
  const product = resolveChatProduct(brief, text)
  if (!product) {
    return msg(
      [
        'I can share material specifications from our catalog once a product is selected (or named).',
        '',
        'Our general material promise:',
        ...MATERIAL_POINTS.map((m) => `• ${m.title}: ${m.body}`),
        '',
        'Pick a style and ask “material specs” for product-specific finish, thickness, and details.',
      ].join('\n'),
      {
        suggestions: [
          'Suggest styles',
          'What materials do you use?',
          'Carcass pricing',
        ],
      },
    )
  }

  const presentation = resolveProductPresentation(product)
  const specRows = [
    ...(presentation.specifications ?? []),
    ...(presentation.details ?? []),
  ]
    .filter((row) => row.label && row.value)
    .slice(0, 12)

  const features = (presentation.features ?? product.features ?? []).slice(0, 6)
  const highlights = (presentation.highlights ?? product.highlights ?? []).slice(
    0,
    5,
  )
  const orderNotes = product.orderNotes?.slice(0, 4) ?? []

  const lines = [
    `Specifications — ${product.name}:`,
    '',
    product.description?.trim() ? product.description.trim() : null,
    highlights.length
      ? ['Highlights:', ...highlights.map((h) => `• ${h}`)].join('\n')
      : null,
    features.length
      ? ['Features:', ...features.map((f) => `• ${f}`)].join('\n')
      : null,
    specRows.length
      ? ['Catalog specs:', ...specRows.map((r) => `• ${r.label}: ${r.value}`)].join(
          '\n',
        )
      : null,
    orderNotes.length
      ? ['Order notes:', ...orderNotes.map((n) => `• ${n}`)].join('\n')
      : null,
    product.disclaimer?.trim() ? `Note: ${product.disclaimer.trim()}` : null,
    '',
    ...rateLines(product),
  ].filter(Boolean) as string[]

  return msg(lines.join('\n'), {
    products: [product],
    suggestions: [
      'Price estimate',
      productHasCarcass(product) ? 'Explain carcass pricing' : 'WhatsApp quote',
      'Tell me about this design',
      'Suggest other styles',
    ],
  })
}

export function answerMaterialsQuestion(
  brief: ConsultBrief,
  text: string,
): ChatMessage {
  if (resolveChatProduct(brief, text) || brief.selectedProductId) {
    return answerSpecsQuestion(brief, text)
  }

  return msg(
    [
      'Materials & build quality at Priyabadal Homes:',
      '',
      ...MATERIAL_POINTS.map((m) => `• ${m.title}: ${m.body}`),
      '',
      'For a specific design, pick a product and ask “material specs” — I’ll pull finish, thickness, and catalog details.',
      'For carcass vs shutter rates, ask “carcass pricing”.',
    ].join('\n'),
    {
      suggestions: [
        'Suggest styles',
        'Carcass pricing',
        'Wardrobe material specs',
        'Price for 8x7',
      ],
    },
  )
}

export function answerDesignQuestion(
  brief: ConsultBrief,
  text: string,
): ChatMessage {
  const product = resolveChatProduct(brief, text)
  if (!product) {
    return msg(
      [
        'I can explain any Priyabadal catalog design — shutters, layout idea, finish language, and when to use it.',
        '',
        'Tell me the room (kitchen / wardrobe / temple / panels / mouldings / partitions / carcass) or ask me to suggest styles, then tap a product and say “tell me about this design”.',
      ].join('\n'),
      {
        suggestions: [
          'Suggest styles',
          'Kitchen remodel',
          'Bedroom wardrobe 8x7',
          'Material specs',
        ],
      },
    )
  }

  const presentation = resolveProductPresentation(product)
  const highlights = (presentation.highlights ?? product.highlights ?? []).slice(
    0,
    6,
  )
  const features = (presentation.features ?? product.features ?? []).slice(0, 6)
  const styleLine = product.style?.length
    ? `Style cues: ${product.style.join(', ')}`
    : null
  const roomsLine = product.rooms?.length
    ? `Best for: ${product.rooms.join(', ')}`
    : null

  const lines = [
    `${product.name} — design guide:`,
    '',
    product.description?.trim() ||
      'A Priyabadal Homes made-to-measure design from our catalog.',
    styleLine,
    roomsLine,
    highlights.length
      ? ['', 'Why clients pick it:', ...highlights.map((h) => `• ${h}`)].join(
          '\n',
        )
      : null,
    features.length
      ? ['', 'Design details:', ...features.map((f) => `• ${f}`)].join('\n')
      : null,
    '',
    ...rateLines(product),
    '',
    brief.widthFt != null && brief.heightFt != null
      ? estimateBlock(
          product,
          brief,
          productHasCarcass(product) ? 'with-carcass' : 'shutter',
        ).join('\n')
      : 'Share size in feet for a price estimate, attach a photo to visualise, or ask for material specs / carcass pricing.',
  ].filter(Boolean) as string[]

  return msg(lines.join('\n'), {
    products: [product],
    suggestions: [
      'Price estimate',
      'Material specs',
      productHasCarcass(product) ? 'Explain carcass pricing' : 'Visualise my look',
      'WhatsApp quote',
    ],
  })
}

/**
 * Salesperson pitch: economic / collection ranges with real catalog rates,
 * finishes, thicknesses, tentative size quote, visualise + WhatsApp next steps.
 */
export function answerRangeQuestion(
  brief: ConsultBrief,
  text: string,
): ChatMessage | null {
  const t = text.toLowerCase()
  const wantsPanels =
    /\b(wall )?panels?|feature wall|g[- ]?series|cladding|hdr|poly coating|pu panel\b/i.test(
      t,
    ) ||
    brief.categoryId === 'wall-panels' ||
    /\bpanel\b/i.test(t)

  const wantsKitchen = /\bkitchen\b/i.test(t) || brief.categoryId === 'kitchen'
  const wantsWardrobe =
    /\bwardrobe|almirah|cupboard\b/i.test(t) || brief.categoryId === 'wardrobe'

  // Default economic asks → wall panels (most common “economic range” request)
  if (wantsPanels || (!wantsKitchen && !wantsWardrobe)) {
    return answerEconomicWallPanelRange(brief, text)
  }

  if (wantsWardrobe) return answerCategoryValueRange(brief, 'wardrobe', text)
  if (wantsKitchen) return answerCategoryValueRange(brief, 'kitchen', text)
  return answerEconomicWallPanelRange(brief, text)
}

function answerEconomicWallPanelRange(
  brief: ConsultBrief,
  _text: string,
): ChatMessage {
  const all = getAllProducts().filter((p) => p.categoryId === 'wall-panels')
  const gSeries = all.filter((p) => p.subcategoryId === 'g-series')
  const premium = all.filter((p) => p.subcategoryId !== 'g-series')
  const cards = gSeries.slice(0, 6)
  const sample = gSeries[0] ?? premium[0]

  const w = brief.widthFt
  const h = brief.heightFt
  let estimateLines: string[] = []
  if (sample && w != null && h != null) {
    const quote = calculatePrice(
      sample,
      buildConfig(sample, brief, 'shutter'),
    )
    estimateLines = [
      '',
      `Tentative quote for your ${w} × ${h} ft wall (G-Series poly HDR @ ${formatPrice(sample.price)}/sq ft):`,
      `• Area ≈ ${quote.sqft.toFixed(1)} sq ft`,
      `• Catalog estimate ≈ ${formatPrice(quote.unitPrice)}`,
      '• Final after colour / layout confirm on WhatsApp',
    ]
  } else {
    estimateLines = [
      '',
      'Share wall size in feet (e.g. 10 × 9) and I’ll send a tentative total for the economic G-Series.',
    ]
  }

  const premiumLines =
    premium.length > 0
      ? [
          '',
          'Step-up (if you want thicker boards / richer finishes):',
          ...premium.map((p) => {
            const finishes = (p.finishOptionIds ?? [p.defaultFinishId ?? 'pu'])
              .map((id) => id.replace(/-/g, ' '))
              .join(', ')
            const thick = (p.thicknessOptionIds ?? [p.defaultThicknessId ?? '18'])
              .map((id) => `${id} mm`)
              .join(' / ')
            return `• ${p.name} — ${formatPrice(p.price)}/sq ft · ${thick} · finishes: ${finishes}`
          }),
        ]
      : []

  return msg(
    [
      'Happy to help — here’s the Priyabadal Homes economic wall panel range.',
      '',
      'G-Series (value line we recommend first):',
      '• HDR engineered board with poly / PU coating',
      '• Thickness: 6 mm',
      '• Finish: poly (PU) coating · custom colour (unlimited colour options)',
      `• Rate: ${formatPrice(600)}/sq ft (same for every G design)`,
      '• Sheet: 2440 × 1220 mm (8 × 4 ft) · made-to-measure layouts',
      `• Designs: ${gSeries.length} catalog patterns (G01–G20) — tap a card below; we can also custom-match colour to your room`,
      '',
      'What you get as a client:',
      '• Tentative price from catalog rates (below)',
      '• Room visualisation after you attach a photo + pick a design',
      '• WhatsApp quotation after size / colour confirm',
      ...estimateLines,
      ...premiumLines,
      '',
      'Tap a G-Series design card, tell me your wall size, or say “Visualise my look”.',
    ].join('\n'),
    {
      products: cards.length ? cards : all.slice(0, 6),
      suggestions: [
        brief.widthFt != null ? 'WhatsApp quote' : 'Wall size 10×9',
        'Visualise my look',
        'Show more G-Series',
        'Material specs',
      ],
    },
  )
}

function answerCategoryValueRange(
  brief: ConsultBrief,
  categoryId: 'wardrobe' | 'kitchen',
  _text: string,
): ChatMessage {
  const list = getAllProducts()
    .filter((p) => p.categoryId === categoryId)
    .sort((a, b) => a.price - b.price)
  const cards = list.slice(0, 6)
  const label = categoryId === 'wardrobe' ? 'wardrobe' : 'kitchen'
  if (!cards.length) {
    return msg(`I don’t have ${label} options loaded yet — WhatsApp us for a quote.`, {
      suggestions: ['Economic wall panel range', 'WhatsApp quote'],
    })
  }

  const lines = cards.map((p) => {
    const unit = p.pricingMode === 'per-sqft' ? '/sq ft' : ''
    const thick = p.defaultThicknessId ? `${p.defaultThicknessId} mm` : 'made to measure'
    const finish = (p.defaultFinishId ?? 'catalog finish').replace(/-/g, ' ')
    return `• ${p.name} — from ${formatPrice(p.price)}${unit} · ${thick} · ${finish}`
  })

  let estimate = ''
  const sample = cards[0]!
  if (brief.widthFt != null && brief.heightFt != null) {
    const scope: BuildScopeId = productHasCarcass(sample)
      ? 'with-carcass'
      : 'shutter'
    const quote = calculatePrice(sample, buildConfig(sample, brief, scope))
    estimate = `\n\nTentative for ${brief.widthFt} × ${brief.heightFt} ft on ${sample.name}: ${formatPrice(quote.unitPrice)} (catalog estimate — confirm on WhatsApp).`
  }

  return msg(
    [
      `Here’s a value-focused ${label} range from Priyabadal Homes (lowest catalog rates first):`,
      '',
      ...lines,
      estimate,
      '',
      'Tap a card for exact shutter/carcass rates, ask for a size estimate, visualise, or WhatsApp quote.',
    ]
      .filter(Boolean)
      .join('\n'),
    {
      products: cards,
      suggestions: [
        'Price with carcass',
        brief.widthFt != null ? 'WhatsApp quote' : 'Size 8×7',
        'Visualise my look',
        'Economic wall panel range',
      ],
    },
  )
}

/** Route a catalog sales intent to the right answer (catalog-backed only) */
export function answerCatalogIntent(
  brief: ConsultBrief,
  text: string,
  intent: CatalogIntent,
): ChatMessage | null {
  if (!intent) return null
  switch (intent) {
    case 'price':
      return answerPriceQuestion(brief, text)
    case 'carcass':
      return answerCarcassQuestion(brief, text)
    case 'specs':
      return answerSpecsQuestion(brief, text)
    case 'materials':
      return answerMaterialsQuestion(brief, text)
    case 'design':
      return answerDesignQuestion(brief, text)
    case 'range':
      return answerRangeQuestion(brief, text)
    default:
      return null
  }
}

/** Optional estimate line for WhatsApp handoff */
export function chatEstimateSummary(brief: ConsultBrief): string | null {
  const product = brief.selectedProductId
    ? getProductById(brief.selectedProductId)
    : undefined
  if (!product || brief.widthFt == null || brief.heightFt == null) return null

  const scope: BuildScopeId = productHasCarcass(product)
    ? 'with-carcass'
    : 'shutter'
  const quote = calculatePrice(product, buildConfig(product, brief, scope))
  return `Catalog estimate (${describeConfig(product.categoryId, quote.config)}): ${formatPrice(quote.unitPrice)} — confirm final on WhatsApp`
}
