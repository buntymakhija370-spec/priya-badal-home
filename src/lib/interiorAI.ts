import { categories, formatPrice, type Product } from '../data/catalog'
import { getAllProducts, getProductById } from './products'
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
  {
    match: /\b(wall panels?|feature wall|fluted|cladding)\b/i,
    label: 'wall panels',
    categoryId: 'wall-panels',
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

  const lower = text.toLowerCase()
  if (
    text.length > 12 &&
    !/^(hi|hello|hey|namaste|yes|ok|okay|thanks|visuali[sz]e|show|upload)\b/.test(lower)
  ) {
    const sizeOnly = extractSize(text)
    const looksLikeSizeOnly =
      sizeOnly.widthFt != null &&
      text.replace(/[\d.\sx×byftfeet'whd:=,-]/gi, '').trim().length < 8
    if (!looksLikeSizeOnly && !budget && !room && !style) {
      next.notes = [next.notes, text.trim()].filter(Boolean).join(' · ').slice(0, 400)
    } else if (text.length > 20 && (room || style || size.widthFt != null)) {
      // Keep free-form preference snippets
      const preference = text.trim()
      if (preference.length < 180) {
        next.notes = [next.notes, preference].filter(Boolean).join(' · ').slice(0, 400)
      }
    }
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
      'Hi — I’m Priya Badal AI, your interior design chat.',
      '',
      'I consult like an interior architect: room photos, size in feet, and architect drawings (plans, elevations, sketches). Then I suggest finishes from our Priyabadal product list and visualise them for you.',
      '',
      'You can:',
      '• Chat about kitchen, wardrobe, temple, or wall panels',
      '• Share size (e.g. 8 × 7 ft)',
      '• Attach a room photo or architect drawing',
      '• Pick a catalog product → Visualise',
      '',
      'What are we designing today?',
    ].join('\n'),
    suggestions: [
      'Kitchen remodel',
      'Bedroom wardrobe 8x7',
      'Temple wall modern',
      'I have an architect drawing',
      'Attach room photo',
    ],
  }
}

export type ConsultTurnResult = {
  brief: ConsultBrief
  reply: ChatMessage
  /** True when client should run Fal visualise next */
  shouldVisualise?: boolean
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
        text: 'Tell me the room, size in feet, and what you want changed — or upload a photo.',
        suggestions: ['Kitchen 10x8', 'Wardrobe 8x7', 'Temple wall'],
      },
    }
  }

  if (/^(hi|hello|hey|namaste)\b/.test(lower)) {
    return { brief, reply: createWelcomeMessage() }
  }

  let next = mergeBriefFromText(brief, text)

  if (
    /\b(architect drawing|floor plan|elevation|i have (?:an? )?drawing|cad|blueprint)\b/i.test(
      lower,
    )
  ) {
    next = { ...next, attachmentKind: next.attachmentKind ?? 'drawing' }
    return {
      brief: next,
      reply: {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: [
          'I can read interior architect drawings — floor plans, elevations, sections, and dimensioned sketches.',
          '',
          'Attach your drawing with the paperclip, tell me the room and size in feet if not marked, then pick a Priyabadal product. I’ll visualise our catalog style onto that drawing.',
          '',
          briefSummary(next),
        ].join('\n'),
        products: suggestProducts(next, text, 3),
        suggestions: ['Attach drawing', 'Kitchen remodel', 'Bedroom wardrobe 8x7'],
      },
    }
  }

  const wantsVisualise =
    /\b(visuali[sz]e|render|show (?:me )?(?:the )?look|ai (?:look|photo|image)|generate)\b/i.test(
      text,
    ) || lower === 'upload photo & visualise'

  const wantsSuggest =
    /\b(suggest|recommend|show (?:me )?options|ideas?|what (?:do you|can you) suggest)\b/i.test(
      text,
    ) ||
    Boolean(next.categoryId && (!brief.categoryId || brief.categoryId !== next.categoryId))

  const wantsSummary = /\b(summary|what do you have|my details|brief)\b/i.test(text)

  if (wantsSummary) {
    return {
      brief: next,
      reply: {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: `Here’s what I have so far:\n${briefSummary(next)}\n\nUpload a photo and pick a product to visualise, or ask me to suggest styles.`,
        suggestions: next.selectedProductId
          ? ['Visualise my look', 'Suggest other styles', 'WhatsApp quote']
          : ['Suggest products', 'I have a room photo'],
      },
    }
  }

  if (wantsVisualise) {
    const missing = missingForVisualise(next)
    if (missing.length) {
      return {
        brief: next,
        reply: {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: `I can create an AI visualisation in this chat. Still need: ${missing.join(' and ')}.\n\n${briefSummary(next)}`,
          products: next.selectedProductId
            ? undefined
            : suggestProducts(next, text, 3),
          suggestions: missing.includes('upload a room / wall photo')
            ? ['I will upload a photo']
            : ['Suggest products'],
        },
      }
    }
    return {
      brief: next,
      shouldVisualise: true,
      reply: {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Perfect — generating your AI visualisation with the selected Priyabadal product and your size…',
      },
    }
  }

  // Default: update brief + suggest when we know the room / enough intent
  const products =
    wantsSuggest || next.categoryId || next.style || next.budget != null
      ? suggestProducts(next, text, 3)
      : []

  if (products.length === 0 && !next.categoryId) {
    return {
      brief: next,
      reply: {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: [
          'Got it. To build the right furniture plan, tell me the space:',
          '• Kitchen',
          '• Wardrobe / bedroom',
          '• Temple / puja',
          '• Wall panels',
          '',
          'Include size if you know it — e.g. “Wardrobe 8 x 7 ft, modern, under ₹80,000”.',
        ].join('\n'),
        suggestions: [
          'Kitchen remodel',
          'Bedroom wardrobe 8x7',
          'Temple wall modern',
          'Wall panels living room',
        ],
      },
    }
  }

  const sizeLine =
    next.widthFt != null && next.heightFt != null
      ? `Size noted: ${next.widthFt} × ${next.heightFt}${
          next.depthFt != null ? ` × ${next.depthFt}` : ''
        } ft.`
      : 'Share size in feet when ready (e.g. 8 x 7).'

  const photoLine = next.roomPhotoDataUrl
    ? 'Room photo is attached — pick a product below, then say “Visualise my look”.'
    : 'Upload a room/wall photo anytime, then we can visualise our product in your space.'

  const lines = [
    `For your ${next.room ?? 'space'}${next.style ? ` (${next.style})` : ''}, here are Priyabadal styles I’d recommend:`,
    '',
    ...products.map(
      (p, i) =>
        `${i + 1}. ${p.name} — from ${formatPrice(p.price)}${
          p.pricingMode === 'per-sqft' ? '/sq ft' : ''
        }`,
    ),
    '',
    sizeLine,
    photoLine,
    'Tap a product to select it for visualisation, or tell me what to change.',
  ]

  return {
    brief: next,
    reply: {
      id: crypto.randomUUID(),
      role: 'assistant',
      text: lines.join('\n'),
      products,
      suggestions: next.roomPhotoDataUrl
        ? ['Visualise my look', 'Suggest other styles', 'WhatsApp quote']
        : ['I will upload a photo', 'Visualise my look', 'Suggest other styles'],
    },
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
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    text: [
      `Selected from our product list: ${product.name}.`,
      briefSummary({ ...brief, selectedProductId: product.id }),
      '',
      missing.length
        ? `To visualise here, please ${missing.join(' and ')}.`
        : 'Ready — tap Visualise and I’ll render this catalog style into your photo or drawing.',
    ].join('\n'),
    products: [product],
    suggestions: needAttach
      ? ['Attach room photo', 'I have an architect drawing', 'Visualise my look']
      : ['Visualise my look', 'WhatsApp quote', 'Suggest other styles'],
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

  const lines = [
    'Hi Priyabadal Homes — Design Chat consultation:',
    '',
    brief.room ? `Space: ${brief.room}` : null,
    `Product: ${product.name}`,
    brief.widthFt != null && brief.heightFt != null
      ? `Size: ${brief.widthFt} × ${brief.heightFt}${
          brief.depthFt != null ? ` × ${brief.depthFt}` : ''
        } ft`
      : null,
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
