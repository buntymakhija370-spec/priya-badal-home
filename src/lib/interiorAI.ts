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

/** Clear edit-the-AI-photo commands (not general chitchat) */
export function isChangeRequest(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  return /\b(change(s|d)?|update(d)?|edit(ed)?|revise(d)?|revision|modify|adjust|tweak|redo|correct(ion)?|fix (this|it|the look)|make (it|the|them|this|doors?|colour|color|handles?|shutters?) |make it |lighter|darker|brighter|softer|warmer|cooler|whiter|cream(ier)?|remove (the )?handles?|add (more )?(hanging|drawers|shelves|handles?)|no handles|more hanging|more drawers|less drawers|different (colour|color|finish|handle)|on this (photo|image|look|visual)|apply (this )?change|instead of|rather than|too (dark|light|bright|small|big|heavy)|a bit more|a bit less|slightly|ajar|half[- ]?open|partly open|partially open|(slightly |soft )?open (the )?(shutter|shutters|door|doors)|show (the )?inside|peek inside|same (look|image|photo|visual)? ?(?:but|with|without)|keep (this|the same)|continue (with |on )?(this|the )?(look|image|visual)|try again|do (it )?again|one more (time|edit)|another (edit|tweak|change)|also |now (make|change|add|remove|open|close))\b/i.test(
    t,
  )
}

/** Short “keep going on this same AI look” phrasing (not a brand-new job) */
export function isContinueSameLookRequest(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (!t) return false
  return /^(again|same again|same look|continue|keep going|next change|update this|edit this|apply|apply change|do again|try again|one more|one more time|please update|please change)$/i.test(
    t,
  )
}

/** Explicit request to regenerate from the original room photo (not edit current AI) */
export function isFreshVisualiseRequest(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (!t) return false
  return /\b(start over|from scratch|new visual|fresh visual|from (my |the )?(room )?photo again|regenerate from (room )?photo|ignore (the )?previous|discard (the )?(ai|previous) (look|image|photo)|visuali[sz]e again from (the )?(room )?photo)\b/i.test(
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
  {
    match: /\b(wall panels?|feature wall|fluted|cladding|cane panel)\b/i,
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

export function suggestProducts(brief: ConsultBrief, text = '', limit = 6): Product[] {
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
      'Hi — I’m your Priyabadal Homes salesperson in chat. One conversation for everything:',
      '',
      '• Economic ranges — e.g. wall panels with poly / HDR finishes & tentative prices',
      '• Pricing — shutter & carcass rates from our catalog (INR)',
      '• Finishes & thickness — what’s available on each product',
      '• Carcass help — BWP boxes, laminate, edge banding, assembly',
      '• Room visualisation — attach a photo and say “visualise”',
      '• WhatsApp quotation — after we lock size, design, and rates',
      '',
      'Tell me what you need — like “give me economic wall panel range”.',
    ].join('\n'),
    suggestions: [
      'Economic wall panel range',
      'Price wardrobe 8×7 with carcass',
      'Visualise my look',
      'Suggest kitchen styles',
    ],
  }
}

/** Open carcass / live-size carcass elevation (not room photo with shutters) */
export function isCarcassVisualiseRequest(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (!t) return false
  // visualise / visualize / visualisation / visualization (+ common endings)
  const viz = String.raw`visuali[sz](?:e|es|ed|ing|ation|ations)`
  if (new RegExp(`^${viz}\\s+carcass$`, 'i').test(t)) return true
  if (
    /\b(open[- ]?carcass|live[- ]?size carcass|carcass (elevation|interior|inside|structure|box|assembly guide))\b/i.test(
      t,
    )
  ) {
    return true
  }
  if (
    new RegExp(String.raw`\bcarcass\b.{0,28}\b${viz}\b`, 'i').test(t) ||
    new RegExp(String.raw`\b${viz}\b.{0,28}\bcarcass\b`, 'i').test(t)
  ) {
    return true
  }
  if (
    /\b(show|make|generate|render|create)(?:\s+\w+){0,4}\s+carcass\b/i.test(t) &&
    new RegExp(String.raw`\b(${viz}|image|photo|look|render|elevation|open)\b`, 'i').test(t)
  ) {
    return true
  }
  return false
}

function missingForCarcassVisualise(brief: ConsultBrief): string[] {
  const missing: string[] = []
  if (!brief.selectedProductId) {
    missing.push('pick a wardrobe, kitchen, or carcass style from our list')
  }
  if (brief.widthFt == null || brief.heightFt == null) {
    missing.push('size in feet (e.g. 8×6)')
  }
  return missing
}

export type ConsultTurnResult = {
  brief: ConsultBrief
  reply: ChatMessage
  /** True when client should run Fal visualise next */
  shouldVisualise?: boolean
  /** Live-size open carcass elevation (no room photo required) */
  shouldCarcassVisualise?: boolean
  /** Edit the existing AI photo instead of starting from the room photo only */
  refine?: boolean
  /** Catalog price/carcass/materials answer — Chat should prefer this for rates */
  catalogLocal?: boolean
  /** Intent label when catalogLocal */
  catalogIntent?: string
  /** Preferred visualisation mode for runVisualise */
  visualiseMode?: 'replace' | 'install' | 'redesign'
}

/** Detect replace / install / redesign wording for chat visualise */
export function detectVisualiseMode(
  text: string,
): 'replace' | 'install' | 'redesign' {
  const t = text.toLowerCase()
  if (/\b(redesign|presentable|client[- ]ready|full look|makeover|restyle)\b/.test(t)) {
    return 'redesign'
  }
  if (/\b(install|place|put|add (?:the |our )?product|into (?:my )?room)\b/.test(t)) {
    return 'install'
  }
  if (/\b(replace|swap|change (?:the )?(?:existing|old)|instead of)\b/.test(t)) {
    return 'replace'
  }
  return 'replace'
}

function productSuggestionMessage(
  brief: ConsultBrief,
  text: string,
  intro: string,
): ChatMessage {
  const products = suggestProducts(brief, text, 6)
  const sizeLine =
    brief.widthFt != null && brief.heightFt != null
      ? `Size on file: ${brief.widthFt} × ${brief.heightFt}${
          brief.depthFt != null ? ` × ${brief.depthFt}` : ''
        } ft.`
      : null
  const photoLine = brief.roomPhotoDataUrl
    ? brief.attachmentKind === 'drawing'
      ? 'Architect drawing is attached.'
      : 'Room photo is attached.'
    : null

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    text: [
      intro,
      '',
      'Swipe the style cards below and tap one to continue — price, carcass, materials, or visualise next.',
      sizeLine,
      photoLine,
    ]
      .filter(Boolean)
      .join('\n'),
    products,
    suggestions: brief.aiImageUrl
      ? ['Suggest other styles', 'Price estimate', 'WhatsApp quote']
      : brief.roomPhotoDataUrl
        ? ['Suggest other styles', 'Visualise my look', 'Price estimate']
        : ['Suggest other styles', 'Attach room photo', 'Price estimate'],
  }
}

/** Drop numbered product dumps when the UI already shows image cards */
export function cleanChatProductText(text: string, hasProducts: boolean): string {
  if (!hasProducts || !text.trim()) return text
  return text
    .replace(/^PRODUCTS:\s*.+$/gim, '')
    .replace(/^SUGGESTIONS:\s*.+$/gim, '')
    .replace(/^\s*[-*•]?\s*\d+[.)]\s+.+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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
      'What space are we planning — kitchen, wardrobe, temple, wall panels, or doors? I can also explain prices and materials.',
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

  const wantsCarcassVisualise = isCarcassVisualiseRequest(text)

  const wantsVisualise =
    !wantsCarcassVisualise &&
    (/\b(visuali[sz]e|render|show (?:me )?(?:the )?look|generate (?:again|look|image|visual))\b/i.test(
      text,
    ) ||
      /^visualise my look$/i.test(lower))

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
    ) && !wantsCarcassVisualise

  // 0) Open carcass / live-size carcass visualisation (no room photo)
  if (wantsCarcassVisualise) {
    const missing = missingForCarcassVisualise(next)
    if (missing.length) {
      return {
        brief: next,
        reply: {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: [
            'Yes — I can generate an open carcass visualisation (live-size interior elevation, no shutters).',
            `Still need: ${missing.join(' and ')}.`,
            '',
            briefSummary(next),
          ].join('\n'),
          products: next.selectedProductId
            ? undefined
            : suggestProducts(
                {
                  ...next,
                  categoryId:
                    next.categoryId === 'kitchen' || next.categoryId === 'wardrobe'
                      ? next.categoryId
                      : next.categoryId ?? 'wardrobe',
                },
                text,
                6,
              ),
          suggestions: missing.some((m) => m.includes('size'))
            ? ['Wardrobe 8×6', 'Kitchen 10×8', 'Suggest styles']
            : ['Suggest wardrobe styles', 'Suggest kitchen styles', 'Price with carcass'],
        },
      }
    }

    return {
      brief: next,
      shouldCarcassVisualise: true,
      reply: {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: `Generating your open carcass visualisation at ${next.widthFt} × ${next.heightFt}${
          next.depthFt != null ? ` × ${next.depthFt}` : ''
        } ft — interior elevation only (no shutters)…`,
      },
    }
  }

  // 1) Edit the CURRENT AI photo — do not regenerate from the room photo
  const canRefine =
    Boolean(brief.aiImageUrl) &&
    Boolean(brief.selectedProductId) &&
    Boolean(brief.roomPhotoDataUrl)
  const wantsFresh = isFreshVisualiseRequest(text)
  const continueSameLook = isContinueSameLookRequest(text)

  if (
    canRefine &&
    !wantsFresh &&
    !wantsSuggest &&
    !wantsSummary &&
    !wantsCarcassVisualise &&
    (isChangeRequest(text) || continueSameLook)
  ) {
    const changeText = continueSameLook
      ? brief.lastChangeRequest?.trim() ||
        'Keep this same visualisation — polish lighting and realism only; do not change the product or room.'
      : text.trim()
    next = {
      ...next,
      lastChangeRequest: changeText,
    }
    return {
      brief: next,
      shouldVisualise: true,
      refine: true,
      reply: {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: continueSameLook
          ? 'Continuing on your current AI look — editing this same image (not starting a new job)…'
          : `Understood — editing your current AI look for: “${changeText}”.`,
        suggestions: [
          'Slightly open shutters',
          'Make it lighter',
          'Make it darker',
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

  // 3b) Catalog sales Q&A — price, carcass, specs, materials, design, ranges
  const catalogIntent = detectCatalogIntent(text)
  if (catalogIntent && !wantsVisualise && !wantsSuggest && !wantsCarcassVisualise) {
    const reply = answerCatalogIntent(next, text, catalogIntent)
    if (reply) {
      const briefOut =
        catalogIntent === 'range' &&
        (/\bwall panels?\b/i.test(text) ||
          /\bg[- ]?series\b/i.test(text) ||
          /\bpanel\b/i.test(text) ||
          (!/\b(kitchen|wardrobe|temple|door)\b/i.test(text) &&
            next.categoryId !== 'kitchen' &&
            next.categoryId !== 'wardrobe'))
          ? {
              ...next,
              categoryId: next.categoryId ?? ('wall-panels' as const),
              room: next.room ?? 'wall panels',
            }
          : next
      return {
        brief: briefOut,
        reply,
        catalogLocal: true,
        catalogIntent,
      }
    }
  }

  // 4) Visualise on demand
  if (wantsVisualise) {
    const missing = missingForVisualise(next)
    const mode = detectVisualiseMode(text)
    if (missing.length) {
      return {
        brief: next,
        visualiseMode: mode,
        reply: {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: `I can visualise in chat — still need: ${missing.join(' and ')}.\n\n${briefSummary(next)}`,
          products: next.selectedProductId
            ? undefined
            : suggestProducts(next, text, 6),
          suggestions: missing.some((m) => m.includes('upload'))
            ? ['Attach room photo', 'I have an architect drawing']
            : ['Suggest styles', 'Price with carcass'],
        },
      }
    }

    // Prefer editing the current AI image unless the user asks to start over.
    // Saying “Visualise my look” again after a render must CONTINUE the same look,
    // not kick off a brand-new job from the room photo.
    const refineAgain = Boolean(next.aiImageUrl) && !wantsFresh

    if (refineAgain && (isChangeRequest(text) || continueSameLook)) {
      next = {
        ...next,
        lastChangeRequest: continueSameLook
          ? next.lastChangeRequest?.trim() ||
            'Keep this same visualisation — polish lighting and realism only; do not change the product or room.'
          : text.trim(),
      }
    }
    if (refineAgain && !next.lastChangeRequest?.trim()) {
      next = {
        ...next,
        lastChangeRequest:
          'Keep this same visualisation — polish lighting and realism only; do not change the product or room.',
      }
    }

    return {
      brief: next,
      shouldVisualise: true,
      refine: refineAgain,
      visualiseMode: mode,
      reply: {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: refineAgain
          ? `Continuing your current AI look${
              next.lastChangeRequest
                ? ` — “${next.lastChangeRequest}”`
                : ''
            }…`
          : wantsFresh && next.aiImageUrl
            ? `Starting a fresh ${mode} visualisation from your original photo/drawing…`
            : `Generating your ${mode} AI visualisation with the selected Priyabadal product…`,
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
    : suggestProducts(brief, brief.room ?? '', 6)
  const isDrawing = brief.attachmentKind === 'drawing'
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    text: brief.selectedProductId
      ? `${isDrawing ? 'Drawing' : 'Photo'} received. Your selected style is ready.\n\n${briefSummary(brief)}\n\nSay “Visualise my look” when you want the photoreal room render.`
      : [
          isDrawing
            ? 'Architect drawing received — I’ll follow the layout and openings.'
            : 'Room photo received — thanks.',
          brief.room ? `Planning for ${brief.room}.` : null,
          'Pick a style card below, then we can price, check carcass, or visualise.',
        ]
          .filter(Boolean)
          .join(' '),
    products,
    suggestions: brief.selectedProductId
      ? ['Visualise my look', 'Suggest other styles']
      : ['Suggest wardrobe styles', 'Suggest kitchen styles', 'Bedroom wardrobe 8x7'],
  }
}

export function messageForProductSelected(product: Product, brief: ConsultBrief): ChatMessage {
  const missing = missingForVisualise({ ...brief, selectedProductId: product.id })
  const needAttach = missing.some((m) => m.includes('upload'))
  const withProduct = { ...brief, selectedProductId: product.id }
  const estimate = chatEstimateSummary(withProduct)
  const blurb = product.description?.trim()
    ? product.description.trim().slice(0, 160) +
      (product.description.trim().length > 160 ? '…' : '')
    : null

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    text: [
      `Nice choice — ${product.name} is selected for this chat.`,
      blurb,
      '',
      [
        `Shutter ${formatPrice(product.price)}${
          product.pricingMode === 'per-sqft' ? '/sq ft' : ''
        }`,
        productHasCarcass(product) && product.carcassPrice != null
          ? `carcass ${formatPrice(product.carcassPrice)}${
              product.pricingMode === 'per-sqft' ? '/sq ft' : ''
            }`
          : null,
      ]
        .filter(Boolean)
        .join(' · '),
      estimate,
      '',
      'What next? Tap a chip below — or ask anything about this style.',
      needAttach
        ? 'Attach a room photo when you want a room visualisation.'
        : 'Ready to visualise in your photo anytime.',
    ]
      .filter((line) => line != null && line !== '')
      .join('\n'),
    products: [product],
    suggestions: [
      needAttach ? 'Attach room photo' : 'Visualise my look',
      'Price estimate',
      productHasCarcass(product) ? 'Visualise carcass' : 'Material specs',
      'Suggest other styles',
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
    'Hi Priyabadal Homes — chat consultation:',
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
