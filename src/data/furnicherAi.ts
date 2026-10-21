/** FurnicherAI — separate bulk furniture brand for hotels / hostels / commercial */

export type FurnicherCategoryId =
  | 'room-packages'
  | 'beds'
  | 'bedside'
  | 'wardrobes'
  | 'tv-units'
  | 'sofa'
  | 'consoles'

export type FurnicherProduct = {
  id: string
  name: string
  categoryId: FurnicherCategoryId
  tagline: string
  description: string
  /** Indicative unit MRP before bulk discount (INR) */
  unitPrice: number
  /** Minimum order quantity (pieces or room-sets) */
  moq: number
  image: string
  specs: { label: string; value: string }[]
  /** Pieces included when this is a room package */
  includes?: string[]
}

export type BulkTier = {
  minQty: number
  label: string
  /** Discount fraction, e.g. 0.12 = 12% off */
  discount: number
}

export const FURNICHER_BRAND = 'FurnicherAI'
export const FURNICHER_TAGLINE = 'Bulk furniture for hotels, hostels & commercial projects'
export const FURNICHER_PARENT = 'A bulk venture powered by Priyabadal Homes'

/** Bulk discount tiers by total selected pieces (or room-sets for packages) */
export const BULK_TIERS: BulkTier[] = [
  { minQty: 1, label: 'Starter', discount: 0 },
  { minQty: 10, label: 'Project 10+', discount: 0.08 },
  { minQty: 25, label: 'Project 25+', discount: 0.12 },
  { minQty: 50, label: 'Project 50+', discount: 0.18 },
]

export const FURNICHER_CATEGORIES: {
  id: FurnicherCategoryId
  name: string
  blurb: string
}[] = [
  { id: 'room-packages', name: 'Room packages', blurb: 'Complete hotel / hostel room sets' },
  { id: 'beds', name: 'Beds', blurb: 'Bulk bed frames & headboards' },
  { id: 'bedside', name: 'Bedside', blurb: 'Matching bedside units' },
  { id: 'wardrobes', name: 'Wardrobes', blurb: 'Guest-room wardrobe façades' },
  { id: 'tv-units', name: 'TV units', blurb: 'Wall & console TV units' },
  { id: 'sofa', name: 'Sofa sets', blurb: 'Lobby & suite seating' },
  { id: 'consoles', name: 'Consoles', blurb: 'Sideboards & consoles' },
]

export const FURNICHER_PRODUCTS: FurnicherProduct[] = [
  {
    id: 'fa-pkg-hotel-standard',
    name: 'Hotel Standard Room Set',
    categoryId: 'room-packages',
    tagline: 'Bed + 2 bedside + wardrobe + TV unit',
    description:
      'Matched bulk set for standard hotel rooms. One selection × room count = full floor BOQ.',
    unitPrice: 85000,
    moq: 10,
    image: '/products/categories/wardrobe.jpg',
    includes: ['Queen bed', '2 bedside units', 'Wardrobe', 'TV unit'],
    specs: [
      { label: 'Best for', value: 'Hotels · 3★ / 4★ standard rooms' },
      { label: 'MOQ', value: '10 room sets' },
      { label: 'Lead time', value: 'Confirm on WhatsApp' },
    ],
  },
  {
    id: 'fa-pkg-hostel',
    name: 'Hostel Room Set',
    categoryId: 'room-packages',
    tagline: 'Bed + study + wardrobe locker',
    description: 'Durable hostel / PG package for high-turnover rooms.',
    unitPrice: 42000,
    moq: 20,
    image: '/products/categories/commercials.jpg',
    includes: ['Single bed', 'Study unit', 'Wardrobe locker'],
    specs: [
      { label: 'Best for', value: 'Hostels · PG · staff housing' },
      { label: 'MOQ', value: '20 room sets' },
      { label: 'Lead time', value: 'Confirm on WhatsApp' },
    ],
  },
  {
    id: 'fa-pkg-suite',
    name: 'Suite Lounge Package',
    categoryId: 'room-packages',
    tagline: 'Bed set + sofa + console + TV unit',
    description: 'Premium suite package for deluxe and suite floors.',
    unitPrice: 145000,
    moq: 6,
    image: '/products/categories/sculpted-furniture.jpg',
    includes: ['King bed', '2 bedside', 'Wardrobe', 'Sofa set', 'Console', 'TV unit'],
    specs: [
      { label: 'Best for', value: 'Suites · deluxe floors' },
      { label: 'MOQ', value: '6 room sets' },
      { label: 'Lead time', value: 'Confirm on WhatsApp' },
    ],
  },
  {
    id: 'fa-bed-queen',
    name: 'Bulk Queen Bed',
    categoryId: 'beds',
    tagline: 'Hotel queen frame + headboard',
    description: 'Repeatable queen bed for guest rooms — finish options confirmed on order.',
    unitPrice: 22000,
    moq: 10,
    image: '/products/categories/live-edge-furniture.jpg',
    specs: [
      { label: 'Size', value: 'Queen · hotel standard' },
      { label: 'MOQ', value: '10 pcs' },
    ],
  },
  {
    id: 'fa-bed-single',
    name: 'Bulk Single / Hostel Bed',
    categoryId: 'beds',
    tagline: 'Strong single bed for hostels',
    description: 'Heavy-use single bed for hostel and staff rooms.',
    unitPrice: 12500,
    moq: 20,
    image: '/products/categories/commercials-1bhk.jpg',
    specs: [
      { label: 'Size', value: 'Single' },
      { label: 'MOQ', value: '20 pcs' },
    ],
  },
  {
    id: 'fa-bedside-pair',
    name: 'Bedside Unit (pair)',
    categoryId: 'bedside',
    tagline: 'Matched pair per room',
    description: 'Soft-close bedside pair — priced per pair for room planning.',
    unitPrice: 9000,
    moq: 10,
    image: '/products/categories/handles.jpg',
    specs: [
      { label: 'Unit', value: 'Pair (2 pcs)' },
      { label: 'MOQ', value: '10 pairs' },
    ],
  },
  {
    id: 'fa-wardrobe-guest',
    name: 'Guest Room Wardrobe',
    categoryId: 'wardrobes',
    tagline: 'Compact hotel wardrobe façade',
    description: 'Bulk wardrobe for guest rooms — hinged shutters, made in matching finish runs.',
    unitPrice: 28000,
    moq: 10,
    image: '/products/wardrobe/wardrobe-12/01.jpg',
    specs: [
      { label: 'Type', value: 'Hinged guest wardrobe' },
      { label: 'MOQ', value: '10 pcs' },
    ],
  },
  {
    id: 'fa-wardrobe-locker',
    name: 'Hostel Wardrobe Locker',
    categoryId: 'wardrobes',
    tagline: 'Locker-style storage',
    description: 'Compact locker wardrobe for hostel beds.',
    unitPrice: 16000,
    moq: 20,
    image: '/products/wardrobe/wardrobe-7/01.jpg',
    specs: [
      { label: 'Type', value: 'Locker wardrobe' },
      { label: 'MOQ', value: '20 pcs' },
    ],
  },
  {
    id: 'fa-tv-wall',
    name: 'Hotel TV Unit',
    categoryId: 'tv-units',
    tagline: 'Wall / console TV unit',
    description: 'Cable-managed TV unit for standard rooms.',
    unitPrice: 14000,
    moq: 10,
    image: '/products/categories/wall-panels.jpg',
    specs: [
      { label: 'Type', value: 'TV unit' },
      { label: 'MOQ', value: '10 pcs' },
    ],
  },
  {
    id: 'fa-sofa-lobby',
    name: 'Lobby Sofa Set',
    categoryId: 'sofa',
    tagline: '3-seater + lounge pair',
    description: 'Bulk lobby / waiting seating set.',
    unitPrice: 48000,
    moq: 4,
    image: '/products/categories/sculpted-furniture.jpg',
    specs: [
      { label: 'Set', value: '3-seater + 2 lounge' },
      { label: 'MOQ', value: '4 sets' },
    ],
  },
  {
    id: 'fa-console-corridor',
    name: 'Corridor Console',
    categoryId: 'consoles',
    tagline: 'Passage & lift lobby console',
    description: 'Slim console for corridors and lift lobbies.',
    unitPrice: 18000,
    moq: 6,
    image: '/products/categories/doors.jpg',
    specs: [
      { label: 'Type', value: 'Console / sideboard' },
      { label: 'MOQ', value: '6 pcs' },
    ],
  },
]

export function getFurnicherProduct(id: string) {
  return FURNICHER_PRODUCTS.find((p) => p.id === id)
}

export function tierForQty(totalQty: number): BulkTier {
  let current = BULK_TIERS[0]!
  for (const tier of BULK_TIERS) {
    if (totalQty >= tier.minQty) current = tier
  }
  return current
}

export function unitAfterDiscount(unitPrice: number, discount: number) {
  return Math.round(unitPrice * (1 - discount))
}

export type BoqLine = {
  product: FurnicherProduct
  qty: number
  unitList: number
  unitNet: number
  lineTotal: number
}

export function buildBoq(
  selections: Record<string, number>,
): { lines: BoqLine[]; totalQty: number; tier: BulkTier; grandTotal: number; listTotal: number } {
  const lines: BoqLine[] = []
  let totalQty = 0
  for (const [id, qty] of Object.entries(selections)) {
    if (!qty || qty <= 0) continue
    const product = getFurnicherProduct(id)
    if (!product) continue
    totalQty += qty
    lines.push({
      product,
      qty,
      unitList: product.unitPrice,
      unitNet: product.unitPrice,
      lineTotal: product.unitPrice * qty,
    })
  }
  const tier = tierForQty(totalQty)
  let listTotal = 0
  let grandTotal = 0
  for (const line of lines) {
    line.unitNet = unitAfterDiscount(line.unitList, tier.discount)
    line.lineTotal = line.unitNet * line.qty
    listTotal += line.unitList * line.qty
    grandTotal += line.lineTotal
  }
  return { lines, totalQty, tier, grandTotal, listTotal }
}

export function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

/** Guided AI desk — fixed scripted turns (Priyabadal Homes verdict) */
export type ChatRole = 'ai' | 'user'

export type ChatMessage = {
  id: string
  role: ChatRole
  text: string
}

export type ProjectBrief = {
  projectType?: 'hotel' | 'hostel' | 'commercial'
  roomCount?: number
  city?: string
  needs: string[]
  notes?: string
  hasPlan?: boolean
}

const NEED_OPTIONS = [
  'beds',
  'bedside',
  'wardrobes',
  'tv-units',
  'sofa',
  'consoles',
  'room-packages',
] as const

export { NEED_OPTIONS }

export function initialAiMessages(): ChatMessage[] {
  return [
    {
      id: 'm0',
      role: 'ai',
      text:
        'Welcome to FurnicherAI — bulk furniture intelligence for hotels, hostels, and commercial projects. I speak for Priyabadal Homes on bulk packages.\n\nWhat are you building?',
    },
  ]
}

/** Rule-based replies so every answer stays on-brand and predecided */
export function furnicherAiReply(
  userText: string,
  brief: ProjectBrief,
): { reply: string; brief: ProjectBrief; suggestMarketplace?: boolean } {
  const t = userText.trim().toLowerCase()
  const next = { ...brief, needs: [...brief.needs] }

  if (!next.projectType) {
    if (/\bhostel|pg\b/.test(t)) next.projectType = 'hostel'
    else if (/\bcommercial|office|staff\b/.test(t)) next.projectType = 'commercial'
    else if (/\bhotel|resort|guest\b/.test(t)) next.projectType = 'hotel'
    else if (/\bhotel|hostel|commercial\b/.test(t) === false && t.length < 40) {
      return {
        brief: next,
        reply:
          'Tell me the project type: **Hotel**, **Hostel / PG**, or **Commercial**. Then we build your bulk BOQ.',
      }
    }
  }

  const roomMatch = t.match(/(\d{1,4})\s*(rooms?|keys?|units?)?/)
  if (roomMatch && !next.roomCount) {
    const n = Number(roomMatch[1])
    if (n >= 1 && n <= 5000) next.roomCount = n
  }

  if (/\b(bed\s*side|bedside)\b/.test(t) && !next.needs.includes('bedside')) {
    next.needs.push('bedside')
  }
  if (/\bbeds?\b/.test(t) && !next.needs.includes('beds')) next.needs.push('beds')
  if (/\bwardrobe/.test(t) && !next.needs.includes('wardrobes')) next.needs.push('wardrobes')
  if (/\btv\b/.test(t) && !next.needs.includes('tv-units')) next.needs.push('tv-units')
  if (/\bsofa|lounge\b/.test(t) && !next.needs.includes('sofa')) next.needs.push('sofa')
  if (/\bconsole|sideboard\b/.test(t) && !next.needs.includes('consoles')) {
    next.needs.push('consoles')
  }
  if (/\bpackage|full room|complete set\b/.test(t) && !next.needs.includes('room-packages')) {
    next.needs.push('room-packages')
  }

  if (/\b(floor\s*plan|2d|3d|drawing|layout|pdf)\b/.test(t)) {
    next.hasPlan = true
  }

  const cityMatch = t.match(/\b(?:in|at|for)\s+([a-zA-Z][a-zA-Z\s]{2,20})\b/)
  if (cityMatch && !next.city) {
    next.city = cityMatch[1]!.trim()
  }

  // Scripted conversation path
  if (!next.projectType) {
    return {
      brief: next,
      reply:
        'Got it. First — is this a **Hotel**, **Hostel / PG**, or **Commercial** project? (FurnicherAI bulk programmes are built for these three.)',
    }
  }

  if (!next.roomCount) {
    const label =
      next.projectType === 'hotel'
        ? 'hotel rooms / keys'
        : next.projectType === 'hostel'
          ? 'hostel beds / rooms'
          : 'commercial units'
    return {
      brief: next,
      reply: `Perfect — **${next.projectType}** project. How many ${label} are you furnishing? (Example: 40 rooms)`,
    }
  }

  if (next.needs.length === 0) {
    return {
      brief: next,
      reply: `You have **${next.roomCount}** units on the board. What should we include?\n\nSay any of: room package, bed, bedside, wardrobe, TV unit, sofa, console — or “full hotel room set”.`,
    }
  }

  if (/\b(price|quote|boq|budget|cost|rate)\b/.test(t) || /\bdone|next|market|select\b/.test(t)) {
    return {
      brief: next,
      suggestMarketplace: true,
      reply: `Here is your FurnicherAI brief (Priyabadal Homes bulk desk):\n\n• Type: **${next.projectType}**\n• Quantity: **${next.roomCount}**\n• Needs: **${next.needs.join(', ')}**${next.city ? `\n• City: **${next.city}**` : ''}${next.hasPlan ? '\n• Floor plan: noted — upload it in the Plan panel' : ''}\n\nOpen the **Marketplace**, select products, then open **BOQ** for a full quotation. Any doubt — ask me here. Final commercial close is with Priyabadal Homes on WhatsApp.`,
    }
  }

  if (/\b(install|delivery|timeline|how long)\b/.test(t)) {
    return {
      brief: next,
      reply:
        'Lead time and install calendar are confirmed after BOQ selection and city. FurnicherAI drafts the package; Priyabadal Homes locks production + dispatch on WhatsApp. Typical bulk runs are planned after token confirmation.',
    }
  }

  if (/\b(discount|bulk|moq)\b/.test(t)) {
    return {
      brief: next,
      reply:
        'Bulk tiers: 10+ → 8% · 25+ → 12% · 50+ → 18% off list (by total pieces / room-sets in your BOQ). MOQ is shown on each marketplace card. Select items to see live savings.',
    }
  }

  return {
    brief: next,
    suggestMarketplace: true,
    reply: `Logged: **${next.projectType}**, **${next.roomCount}** units, needs **${next.needs.join(', ')}**.\n\nNext — go to **Marketplace** and pick the exact beds / bedside / wardrobes / packages you want. Then check **BOQ** for the full quotation. I stay with you for doubts; Priyabadal Homes is the final verdict for production.`,
  }
}

export function boqWhatsAppText(opts: {
  brief: ProjectBrief
  lines: BoqLine[]
  tier: BulkTier
  grandTotal: number
  listTotal: number
  planName?: string
}) {
  const { brief, lines, tier, grandTotal, listTotal, planName } = opts
  const save = listTotal - grandTotal
  const rows = lines.map(
    (l) =>
      `• ${l.product.name} × ${l.qty} — ${formatInr(l.unitNet)} each = ${formatInr(l.lineTotal)}`,
  )
  return [
    `Hi Priyabadal Homes — FurnicherAI bulk enquiry`,
    '',
    `Project: ${brief.projectType || '—'} · ${brief.roomCount ?? '—'} rooms/units`,
    brief.city ? `City: ${brief.city}` : null,
    brief.needs.length ? `Needs: ${brief.needs.join(', ')}` : null,
    planName ? `Floor plan uploaded: ${planName}` : null,
    '',
    'BOQ draft:',
    ...rows,
    '',
    `Bulk tier: ${tier.label} (${Math.round(tier.discount * 100)}% off)`,
    `List total: ${formatInr(listTotal)}`,
    `Draft total: ${formatInr(grandTotal)}`,
    save > 0 ? `Estimated bulk saving: ${formatInr(save)}` : null,
    '',
    'Please confirm final rates, finishes, timeline & install.',
    '— Sent from FurnicherAI (Priyabadal Homes)',
  ]
    .filter(Boolean)
    .join('\n')
}
