import { categories, formatPrice, type Product } from '../data/catalog'
import {
  answerCatalogIntent,
  chatEstimateSummary,
  detectCatalogIntent,
} from './chatCatalogAnswers'
import { getAllProducts, getProductById } from './products'
import { productHasCarcass } from './pricing'
import { WHATSAPP_QUOTE_NUMBER } from './whatsapp'
import { VISUALISE_COLOURS, type VisualiseColour } from './visualise'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  products?: Product[]
  /** User-uploaded room photo or architect drawing */
  imageUrl?: string
  imageKind?: 'photo' | 'drawing'
  /** AI visualisation result */
  aiImageUrl?: string
  /** Suggested quick replies */
  suggestions?: string[]
}

export type ConsultBrief = {
  room?: string
  categoryId?: string
  widthFt?: number
  heightFt?: number
  depthFt?: number
  budget?: number | null
  style?: string
  notes?: string
  roomPhotoDataUrl?: string | null
  /** Room photograph vs architect drawing / plan / elevation */
  attachmentKind?: 'photo' | 'drawing'
  selectedProductId?: string | null
  aiImageUrl?: string | null
  /** Latest edit instruction to apply on the current AI photo */
  lastChangeRequest?: string | null
}

/** Strict: only clear edit-the-AI-photo commands (not general chitchat) */
export function isChangeRequest(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  return /\b(change (the|this|it|colour|color|finish|doors?|handles?)|changes?:|update (the|this|it)|edit (the|this|it)|revise|modify|adjust|tweak|redo (the|this|it)|make (it|the|them|this|doors?|colour|color) |make it |lighter|darker|brighter|softer|warmer|cooler|remove (the )?handles?|add more (hanging|drawers|shelves)|no handles|more hanging|more drawers|less drawers|different (colour|color|finish)|on this (photo|image|look|visual)|apply (this )?change)\b/i.test(
    t,
  )
}

const STYLE_WORDS = [
  'minimal',
  'scandinavian',
  'japandi',
  'boho',
  'modern',
  'classic',
  'warm',
  'luxe',
  'natural',
  'organic',
  'soft',
  'tropical',
  'walnut',
  'ivory',
  'greige',
  'charcoal',
  'sage',
]

const ROOM_MAP: { match: RegExp; label: string; categoryId?: string }[] = [
  { match: /\b(kitchen|modular kitchen|cabinets?)\b/i, label: 'kitchen', categoryId: 'kitchen' },
  {
    match: /\b(wardrobe|almirah|cupboard|walk[- ]?in|dressing)\b/i,
    label: 'wardrobe',
    categoryId: 'wardrobe',
  },
  {
    match: /\b(temple|mandir|puja|prayer)\b/i,
    label: 'temple / puja',
    categoryId: 'temple',
  },
  { match: /\b(doors?|main door|flush)\b/i, label: 'doors', categoryId: 'doors' },
  {
    match: /\b(living room|bedroom|dining)\b/i,
    label: 'living / bedroom',
  },
]

function extractBudget(text: string): number | null {
  const lower = text.toLowerCase()
  const lakh = lower.match(/(\d+(?:\.\d+)?)\s*lakh/)
  if (lakh) return Math.round(Number(lakh[1]) * 100000)

  const k = lower.match(/(?:₹|rs\.?\s*|inr\s*)?(\d+)\s*k\b/)
  if (k) return Number(k[1]) * 1000

  const plain = lower.match(
    /(?:under|below|budget(?:\s*of)?|upto|up to|max)\s*(?:₹|rs\.?\s*)?(\d[\d,]*)/i,
  )
  if (plain) return Number(plain[1].replace(/,/g, ''))

  const currency = lower.match(/(?:₹|rs\.?\s*)(\d[\d,]*)/)
  if (currency) return Number(currency[1].replace(/,/g, ''))

  return null
}

/** Parse sizes like 8x7, 8 x 7 x 2, 8ft by 7ft, width 8 height 7 */
export function extractSize(text: string): {
  widthFt?: number
  heightFt?: number
  depthFt?: number
} {
  const lower = text.toLowerCase().replace(/,/g, '')

  const named = lower.match(
    /(?:w(?:idth)?\s*[:=]?\s*)(\d+(?:\.\d+)?)\s*(?:ft|feet|')?\s*(?:[,&]|\s+)\s*(?:h(?:eight)?\s*[:=]?\s*)(\d+(?:\.\d+)?)\s*(?:ft|feet|')?(?:\s*(?:[,&]|\s+)\s*(?:d(?:epth)?\s*[:=]?\s*)(\d+(?:\.\d+)?))?/i,
  )
  if (named) {
    return {
      widthFt: Number(named[1]),
      heightFt: Number(named[2]),
      depthFt: named[3] ? Number(named[3]) : undefined,
    }
  }

  const compact = lower.match(
    /(\d+(?:\.\d+)?)\s*(?:ft|feet|')?\s*[x×by]\s*(\d+(?:\.\d+)?)\s*(?:ft|feet|')?(?:\s*[x×by]\s*(\d+(?:\.\d+)?))?/i,
  )
  if (compact) {
    return {
      widthFt: Number(compact[1]),
      heightFt: Number(compact[2]),
      depthFt: compact[3] ? Number(compact[3]) : undefined,
    }
  }

  return {}
}

function extractRoom(text: string) {
  for (const row of ROOM_MAP) {
    if (row.match.test(text)) {
      return { label: row.label, categoryId: row.categoryId }
    }
  }
  return null
}

function extractStyle(text: string): string | undefined {
  const lower = text.toLowerCase()
  return STYLE_WORDS.find((style) => lower.includes(style))
}

function scoreProduct(product: Product, brief: ConsultBrief, text: string) {
  const lower = text.toLowerCase()
  let score = 0

  if (brief.categoryId && product.categoryId === brief.categoryId) score += 8

  for (const room of product.rooms) {
    if (lower.includes(room) || brief.room?.includes(room)) score += 3
  }

  for (const style of product.style) {
    if (lower.includes(style) || brief.style === style) score += 3
  }

  const category = categories.find((c) => c.id === product.categoryId)
  if (category && (lower.includes(category.name.toLowerCase()) || brief.room?.includes(category.name.toLowerCase().split(' ')[0]!))) {
    score += 2
  }

  if (brief.budget != null) {
    if (product.price <= brief.budget) score += 3
    else score -= 4
  }

  if (lower.includes(product.name.toLowerCase().split(' ')[0]!)) score += 2

  return score
}

export function suggestProducts(brief: ConsultBrief, text = '', limit = 3): Product[] {
  const products = getAllProducts()
  const scored = products
    .map((product) => ({ product, score: scoreProduct(product, brief, text) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.product.price - b.product.price)
    .slice(0, limit)
    .map((row) => row.product)

  if (scored.length) return scored

  return products
    .filter((p) =>
      brief.categoryId ? p.categoryId === brief.categoryId : true,
    )
    .filter((p) => (brief.budget == null ? true : p.price <= brief.budget))
    .sort((a, b) => a.price - b.price)
    .slice(0, limit)
}

export function colourFromBrief(brief: ConsultBrief): VisualiseColour {
  const style = brief.style?.toLowerCase() ?? ''
  const found = VISUALISE_COLOURS.find(
    (c) => style.includes(c.id) || style.includes(c.label.toLowerCase().split(' ')[0]!),
  )
  if (found) return found
  if (style.includes('walnut') || style.includes('warm') || style.includes('wood')) {
    return VISUALISE_COLOURS.find((c) => c.id === 'walnut')!
  }
  if (style.includes('dark') || style.includes('charcoal') || style.includes('modern')) {
    return VISUALISE_COLOURS.find((c) => c.id === 'charcoal')!
  }
  return VISUALISE_COLOURS[0]!
}

export function mergeBriefFromText(brief: ConsultBrief, text: string): ConsultBrief {
  const next = { ...brief }
  const room = extractRoom(text)
  if (room) {
    next.room = room.label
    if (room.categoryId) next.categoryId = room.categoryId
  }
  const size = extractSize(text)
  if (size.widthFt != null) next.widthFt = size.widthFt
  if (size.heightFt != null) next.heightFt = size.heightFt
  if (size.depthFt != null) next.depthFt = size.depthFt
  const budget = extractBudget(text)
  if (budget != null) next.budget = budget
  const style = extractStyle(text)
  if (style) next.style = style

  // Only store clear preference / change language in notes — not every chat line
  if (isChangeRequest(text) || /\b(i want|we want|prefer|please|need more|need less|don'?t want)\b/i.test(text)) {
    next.notes = [next.notes, text.trim()].filter(Boolean).join(' · ').slice(0, 400)
  }

  return next
}

function briefSummary(brief: ConsultBrief): string {
  const bits: string[] = []
  if (brief.room) bits.push(`Space: ${brief.room}`)
  if (brief.widthFt != null && brief.heightFt != null) {
    bits.push(
      `Size: ${brief.widthFt} × ${brief.heightFt}${
        brief.depthFt != null ? ` × ${brief.depthFt}` : ''
      } ft`,
    )
  }
  if (brief.style) bits.push(`Style: ${brief.style}`)
  if (brief.budget != null) bits.push(`Budget: ${formatPrice(brief.budget)}`)
  if (brief.roomPhotoDataUrl) {
    bits.push(
      brief.attachmentKind === 'drawing'
        ? 'Architect drawing: attached'
        : 'Room photo: attached',
    )
  }
  if (brief.selectedProductId) {
    const p = getProductById(brief.selectedProductId)
    if (p) bits.push(`Selected: ${p.name}`)
  }
  if (brief.aiImageUrl) bits.push('AI visualisation: ready — send change commands anytime')
  if (brief.lastChangeRequest) bits.push(`Latest change: ${brief.lastChangeRequest}`)
  return bits.length ? bits.join('\n') : 'No details yet — tell me the room and size.'
}

function missingForVisualise(brief: ConsultBrief): string[] {
  const missing: string[] = []
  if (!brief.selectedProductId) missing.push('pick a product from our list')
  if (!brief.roomPhotoDataUrl) {
    missing.push('upload a room photo or architect drawing')
  }
  return missing
}

export function looksLikeDrawingIntent(text: string, fileName = ''): boolean {
  const hay = `${text} ${fileName}`.toLowerCase()
  return /\b(drawing|drawings|floor\s*plan|elevation|section|cad|autocad|layout|architect|blueprint|2d\s*plan|plan\s*pdf|dimension)\b/i.test(
    hay,
  )
}

export function createWelcomeMessage(): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    text: [
      'Hi — I’m Priya Badal AI.',
      '',
      'Ask me anything about our catalog — any wardrobe, kitchen, temple, panel, price, carcass, material, finish, or which design fits your home.',
      '',
      'I speak naturally and answer from Priyabadal Homes product data (INR). Share size in feet for estimates, or attach a room photo to visualise.',
      '',
      'What would you like to know?',
    ].join('\n'),
    suggestions: [
      'Which wardrobe suits a small bedroom?',
      'Carcass vs shutter price for 8x7',
      'Compare temple wall designs',
      'What materials do you use?',
      'Suggest kitchen styles',
    ],
  }
}

export type ConsultTurnResult = {
  brief: ConsultBrief
  reply: ChatMessage
  /** True when client should run Fal visualise next */
  shouldVisualise?: boolean
  /** Edit the existing AI photo instead of starting from the room photo only */
  refine?: boolean
}

function productSuggestionMessage(
  brief: ConsultBrief,
  text: string,
  intro: string,
): ChatMessage {
  const products = suggestProducts(brief, text, 3)
  const sizeLine =
    brief.widthFt != null && brief.heightFt != null
      ? `Size on file: ${brief.widthFt} × ${brief.heightFt}${
          brief.depthFt != null ? ` × ${brief.depthFt}` : ''
        } ft.`
      : 'Share size in feet anytime (e.g. 8 x 7).'
  const photoLine = brief.roomPhotoDataUrl
    ? brief.attachmentKind === 'drawing'
      ? 'Architect drawing is attached.'
      : 'Room photo is attached.'
    : 'You can attach a room photo or architect drawing when ready.'

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    text: [
      intro,
      '',
      ...products.map((p, i) => {
        const carcass =
          productHasCarcass(p) && p.carcassPrice != null
            ? ` · carcass ${formatPrice(p.carcassPrice)}${
                p.pricingMode === 'per-sqft' ? '/sq ft' : ''
              }`
            : ''
        return `${i + 1}. ${p.name} — shutter from ${formatPrice(p.price)}${
          p.pricingMode === 'per-sqft' ? '/sq ft' : ''
        }${carcass}`
      }),
      '',
      sizeLine,
      photoLine,
      'Tap Use this, then ask price / carcass / material specs, or visualise.',
    ].join('\n'),
    products,
    suggestions: brief.aiImageUrl
      ? ['Price estimate', 'Material specs', 'WhatsApp quote']
      : brief.roomPhotoDataUrl
        ? ['Visualise my look', 'Price estimate', 'Material specs']
        : ['Price estimate', 'What is carcass pricing?', 'Attach room photo'],
  }
}

/** Normal chitchat reply — listens and continues the consultation without forcing a new visual */
function conversationalReply(
  before: ConsultBrief,
  after: ConsultBrief,
  userText: string,
): ChatMessage {
  const heard: string[] = []
  if (after.room && after.room !== before.room) heard.push(`space → ${after.room}`)
  if (
    after.widthFt != null &&
    after.heightFt != null &&
    (after.widthFt !== before.widthFt ||
      after.heightFt !== before.heightFt ||
      after.depthFt !== before.depthFt)
  ) {
    heard.push(
      `size → ${after.widthFt} × ${after.heightFt}${
        after.depthFt != null ? ` × ${after.depthFt}` : ''
      } ft`,
    )
  }
  if (after.style && after.style !== before.style) heard.push(`style → ${after.style}`)
  if (after.budget != null && after.budget !== before.budget) {
    heard.push(`budget → ${formatPrice(after.budget)}`)
  }

  const quote = userText.trim().length > 140 ? `${userText.trim().slice(0, 140)}…` : userText.trim()
  const lines = [`I heard you: “${quote}”.`]

  if (heard.length) {
    lines.push('', 'Updated in your brief:', ...heard.map((h) => `• ${h}`))
  } else {
    lines.push('', 'I’m keeping that in our conversation.')
  }

  if (after.aiImageUrl) {
    lines.push(
      '',
      'Your AI visualisation is already here. Ask about price, carcass, or material specs — or give a clear photo change (e.g. “make it lighter”).',
    )
  } else if (after.selectedProductId && after.roomPhotoDataUrl) {
    lines.push(
      '',
      'You have a product + photo/drawing. Ask for a price estimate, material specs, or say “Visualise my look”.',
    )
  } else if (after.selectedProductId) {
    lines.push(
      '',
      'Product selected. Ask price / carcass / specs, share size in feet, or attach a photo to visualise.',
    )
  } else if (after.categoryId) {
    lines.push(
      '',
      'Ask me to suggest styles, share size for pricing, or ask “what is carcass pricing?” / “material specs”.',
    )
  } else {
    lines.push(
      '',
      'What space are we planning — kitchen, wardrobe, temple, or doors? I can also explain prices and materials.',
    )
  }

  const selected = after.selectedProductId
    ? getProductById(after.selectedProductId)
    : undefined

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    text: lines.join('\n'),
    products: selected ? [selected] : undefined,
    suggestions: after.aiImageUrl
      ? [
          'Price estimate',
          'Material specs',
          'Make it lighter',
          'WhatsApp quote',
        ]
      : after.selectedProductId
        ? ['Price estimate', 'Explain carcass pricing', 'Material specs', 'Visualise my look']
        : after.categoryId
          ? ['Suggest styles', 'Price estimate', 'What is carcass pricing?', 'Attach room photo']
          : ['Bedroom wardrobe 8x7', 'What is carcass pricing?', 'Material specs'],
  }
}

export function processConsultTurn(
  brief: ConsultBrief,
  userText: string,
): ConsultTurnResult {
  const text = userText.trim()
  const lower = text.toLowerCase()

  if (!text) {
    return {
      brief,
      reply: {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'I’m listening — tell me the room, size in feet, what you want, or attach a photo/drawing.',
        suggestions: ['Kitchen 10x8', 'Wardrobe 8x7', 'Temple wall'],
      },
    }
  }

  if (/^(hi|hello|hey|namaste)\b/.test(lower)) {
    return { brief, reply: createWelcomeMessage() }
  }

  if (/^(ok|okay|thanks|thank you|cool|great|nice|yes|hmm|👍)\.?$/i.test(text)) {
    return {
      brief,
      reply: {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: brief.aiImageUrl
          ? 'Happy to continue. Tell me what you think of the look, ask for a specific change on that photo, or we can talk size / price / WhatsApp quote.'
          : 'I’m here. Share the room, size, a photo/drawing, or ask me to suggest products.',
        suggestions: brief.aiImageUrl
          ? ['Make it lighter', 'Suggest other styles', 'WhatsApp quote']
          : ['Suggest styles', 'Attach room photo', 'Kitchen remodel'],
      },
    }
  }

  const before = brief
  let next = mergeBriefFromText(brief, text)
  const roomJustSet =
    Boolean(next.categoryId) &&
    (!before.categoryId || before.categoryId !== next.categoryId)

  const wantsVisualise =
    /\b(visuali[sz]e|render|show (?:me )?(?:the )?look|generate (?:again|look|image|visual))\b/i.test(
      text,
    ) || /^visualise my look$/i.test(lower)

  const wantsSuggest =
    /\b(suggest|recommend|show (?:me )?options|ideas?|other styles|another style|what (?:do you|can you) suggest|product list|styles)\b/i.test(
      text,
    ) || /^suggest styles$/i.test(lower)

  const wantsSummary =
    /\b(summary|what do you have|my details|brief|what do you recommend next)\b/i.test(
      text,
    ) || /^my details$/i.test(lower)

  const wantsDrawingHelp =
    /\b(architect drawing|floor plan|elevation|i have (?:an? )?drawing|cad|blueprint)\b/i.test(
      lower,
    )

  // 1) Explicit photo edit only — never treat normal chat as refine
  const canRefine =
    Boolean(brief.aiImageUrl) &&
    Boolean(brief.selectedProductId) &&
    Boolean(brief.roomPhotoDataUrl)

  if (canRefine && isChangeRequest(text) && !wantsSuggest && !wantsSummary) {
    const changeText = text.trim()
    next = {
      ...next,
      lastChangeRequest: changeText,
      notes: [brief.notes, `Change request: ${changeText}`]
        .filter(Boolean)
        .join(' · ')
        .slice(0, 500),
    }
    return {
      brief: next,
      shouldVisualise: true,
      refine: true,
      reply: {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: `Understood — revising your current AI photo for: “${changeText}”.`,
        suggestions: [
          'Make it lighter',
          'Make it darker',
          'Add more hanging',
          'Remove handles',
          'WhatsApp quote',
        ],
      },
    }
  }

  // 2) Drawing help
  if (wantsDrawingHelp) {
    next = { ...next, attachmentKind: next.attachmentKind ?? 'drawing' }
    return {
      brief: next,
      reply: {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: [
          'Yes — send architect drawings (floor plan, elevation, section, or sketch).',
          'Use the Drawing button, tell me room + size if not marked, pick a Priyabadal product, then ask to visualise.',
          '',
          briefSummary(next),
        ].join('\n'),
        suggestions: ['Attach drawing', 'Suggest styles', 'Kitchen remodel'],
      },
    }
  }

  // 3) Summary
  if (wantsSummary) {
    const estimate = chatEstimateSummary(next)
    return {
      brief: next,
      reply: {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: [
          'Here’s what I’m holding from our chat:',
          briefSummary(next),
          estimate ? `\n${estimate}` : null,
          '',
          'Ask about price, carcass, materials, design details — or visualise.',
        ]
          .filter((line) => line != null)
          .join('\n'),
        suggestions: next.aiImageUrl
          ? ['Price estimate', 'Material specs', 'WhatsApp quote']
          : next.selectedProductId
            ? ['Price estimate', 'Explain carcass pricing', 'Visualise my look']
            : ['Suggest styles', 'What is carcass pricing?', 'Attach room photo'],
      },
    }
  }

  // 3b) Catalog sales Q&A — price, carcass, specs, materials, design
  const catalogIntent = detectCatalogIntent(text)
  if (catalogIntent && !wantsVisualise && !wantsSuggest) {
    const reply = answerCatalogIntent(next, text, catalogIntent)
    if (reply) {
      return { brief: next, reply }
    }
  }

  // 4) Visualise on demand only
  if (wantsVisualise) {
    const missing = missingForVisualise(next)
    if (missing.length) {
      return {
        brief: next,
        reply: {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: `I can visualise — still need: ${missing.join(' and ')}.\n\n${briefSummary(next)}`,
          products: next.selectedProductId
            ? undefined
            : suggestProducts(next, text, 3),
          suggestions: missing.some((m) => m.includes('upload'))
            ? ['Attach room photo', 'I have an architect drawing']
            : ['Suggest styles'],
        },
      }
    }
    const refineAgain = Boolean(
      next.aiImageUrl && next.lastChangeRequest?.trim() && isChangeRequest(text),
    )
    return {
      brief: next,
      shouldVisualise: true,
      refine: refineAgain,
      reply: {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: refineAgain
          ? `Revising your current visualisation with: “${next.lastChangeRequest}”…`
          : next.aiImageUrl
            ? 'Generating a fresh visualisation from your photo/drawing and selected product…'
            : 'Generating your AI visualisation with the selected Priyabadal product…',
      },
    }
  }

  // 5) Product suggestions only when asked, or when room is newly chosen
  if (wantsSuggest || roomJustSet) {
    return {
      brief: next,
      reply: productSuggestionMessage(
        next,
        text,
        roomJustSet
          ? `Got it — ${next.room}. Here are Priyabadal styles from our list that fit:`
          : `Here are Priyabadal styles I’d suggest for your ${next.room ?? 'space'}:`,
      ),
    }
  }

  // 6) Default = listen & chitchat (no forced visual, no spam product dump)
  return {
    brief: next,
    reply: conversationalReply(before, next, text),
  }
}

export function messageForPhotoAttached(brief: ConsultBrief): ChatMessage {
  const products = brief.selectedProductId
    ? undefined
    : suggestProducts(brief, brief.room ?? '', 3)
  const isDrawing = brief.attachmentKind === 'drawing'
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    text: brief.selectedProductId
      ? `${isDrawing ? 'Drawing' : 'Photo'} received. I have your selected Priyabadal style ready.\n\n${briefSummary(brief)}\n\nSay “Visualise my look” — I’ll build a photoreal look from our product list${isDrawing ? ' following your architect drawing' : ' in your room'}.`
      : `${isDrawing ? 'Architect drawing received — I’ll read the layout, wall runs, and openings.' : 'Room photo received — thanks.'} ${
          brief.room ? `Planning for ${brief.room}. ` : ''
        }Pick a product from our list below (or tell me room/size), then we’ll visualise.`,
    products,
    suggestions: brief.selectedProductId
      ? ['Visualise my look', 'Suggest other styles']
      : ['Kitchen remodel', 'Bedroom wardrobe 8x7', 'Temple wall modern'],
  }
}

export function messageForProductSelected(product: Product, brief: ConsultBrief): ChatMessage {
  const missing = missingForVisualise({ ...brief, selectedProductId: product.id })
  const needAttach = missing.some((m) => m.includes('upload'))
  const withProduct = { ...brief, selectedProductId: product.id }
  const estimate = chatEstimateSummary(withProduct)
  const carcassHint = productHasCarcass(product)
    ? `Carcass listed at ${formatPrice(product.carcassPrice!)}${
        product.pricingMode === 'per-sqft' ? '/sq ft' : ''
      } (plus shutter).`
    : null

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    text: [
      `Selected: ${product.name}.`,
      product.description?.trim()
        ? product.description.trim().slice(0, 220) +
          (product.description.trim().length > 220 ? '…' : '')
        : null,
      '',
      ...[
        `Shutter / catalog: ${formatPrice(product.price)}${
          product.pricingMode === 'per-sqft' ? '/sq ft' : ''
        }`,
        carcassHint,
        estimate,
      ].filter(Boolean),
      '',
      briefSummary(withProduct),
      '',
      'Ask me: price estimate · carcass pricing · material specs · tell me about this design',
      missing.length
        ? `To visualise: ${missing.join(' and ')}.`
        : 'Ready to visualise anytime.',
    ]
      .filter((line) => line != null)
      .join('\n'),
    products: [product],
    suggestions: [
      'Price estimate',
      productHasCarcass(product) ? 'Explain carcass pricing' : 'Material specs',
      'Tell me about this design',
      needAttach ? 'Attach room photo' : 'Visualise my look',
    ],
  }
}

export function buildChatWhatsAppUrl(brief: ConsultBrief): string | null {
  const product = brief.selectedProductId
    ? getProductById(brief.selectedProductId)
    : undefined
  if (!product) return null

  const productUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/product/${product.id}`
      : `/product/${product.id}`

  const estimate = chatEstimateSummary(brief)
  const lines = [
    'Hi Priyabadal Homes — Priya Badal AI consultation:',
    '',
    brief.room ? `Space: ${brief.room}` : null,
    `Product: ${product.name}`,
    brief.widthFt != null && brief.heightFt != null
      ? `Size: ${brief.widthFt} × ${brief.heightFt}${
          brief.depthFt != null ? ` × ${brief.depthFt}` : ''
        } ft`
      : null,
    `Shutter rate: ${formatPrice(product.price)}${
      product.pricingMode === 'per-sqft' ? '/sq ft' : ''
    }`,
    productHasCarcass(product)
      ? `Carcass rate: ${formatPrice(product.carcassPrice!)}${
          product.pricingMode === 'per-sqft' ? '/sq ft' : ''
        }`
      : null,
    estimate,
    brief.style ? `Style: ${brief.style}` : null,
    brief.budget != null ? `Budget: ${formatPrice(brief.budget, 'INR')}` : null,
    brief.attachmentKind === 'drawing' ? 'Reference: architect drawing attached in chat' : null,
    brief.aiImageUrl ? `AI visualisation (open this link): ${brief.aiImageUrl}` : null,
    brief.notes?.trim() ? `Changes / instructions: ${brief.notes.trim()}` : null,
    '',
    `Product photo & details: ${productUrl}`,
    '',
    'Please confirm final quote. Thank you.',
  ].filter(Boolean) as string[]

  return `https://wa.me/${WHATSAPP_QUOTE_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`
}

/** @deprecated kept for any leftover imports */
export function answerInteriorQuery(userText: string): ChatMessage {
  const result = processConsultTurn({}, userText)
  return result.reply
}
