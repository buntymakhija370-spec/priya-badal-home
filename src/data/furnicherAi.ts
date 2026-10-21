/** FurnicherAI — separate bulk furniture brand for hotels / hostels / commercial */

export type FurnicherCategoryId =
  | 'room-packages'
  | 'beds'
  | 'bedside'
  | 'wardrobes'
  | 'tv-units'
  | 'sofa'
  | 'consoles'
  | 'kitchens'

export type FurnicherProduct = {
  id: string
  name: string
  categoryId: FurnicherCategoryId
  tagline: string
  description: string
  unitPrice: number
  moq: number
  image: string
  specs: { label: string; value: string }[]
  includes?: string[]
  /** Tags used by chat matching */
  tags?: string[]
}

export type BulkTier = {
  minQty: number
  label: string
  discount: number
}

export const FURNICHER_BRAND = 'FurnicherAI'
export const FURNICHER_TAGLINE = 'Bulk furniture for hotels, hostels & commercial projects'
export const FURNICHER_PARENT = 'A bulk venture powered by Priyabadal Homes'

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
  { id: 'room-packages', name: 'Room packages', blurb: '1BHK / hotel / hostel sets' },
  { id: 'beds', name: 'Beds', blurb: 'Bulk bed frames' },
  { id: 'bedside', name: 'Bedside', blurb: 'Bedside units' },
  { id: 'wardrobes', name: 'Wardrobes', blurb: 'Slider · openable · compact' },
  { id: 'tv-units', name: 'TV units', blurb: '32″ / 42″ ready units' },
  { id: 'sofa', name: 'Sofa sets', blurb: '3-seater · 5-seater' },
  { id: 'consoles', name: 'Consoles', blurb: 'Sideboards & consoles' },
  { id: 'kitchens', name: 'Kitchens', blurb: 'Small / big kitchen packages' },
]

export const FURNICHER_PRODUCTS: FurnicherProduct[] = [
  {
    id: 'fa-pkg-1bhk',
    name: 'Hotel / Stay 1BHK Full Package',
    categoryId: 'room-packages',
    tagline: 'Living + bedroom + kitchen shell set',
    description:
      'Full 1BHK bulk package. Configure sofa, TV size, wardrobe type, and kitchen size in chat — then lock your BOQ.',
    unitPrice: 185000,
    moq: 6,
    image: '/products/categories/commercials-1bhk.jpg',
    includes: ['Bed', 'Bedside', 'Wardrobe', 'Sofa', 'TV unit', 'Kitchen package'],
    tags: ['1bhk', 'full package', 'hotel', 'apartment'],
    specs: [
      { label: 'Best for', value: 'Hotel 1BHK · serviced apartments' },
      { label: 'MOQ', value: '6 packages' },
    ],
  },
  {
    id: 'fa-pkg-hotel-standard',
    name: 'Hotel Standard Room Set',
    categoryId: 'room-packages',
    tagline: 'Bed + bedside + wardrobe + TV',
    description: 'Matched set for standard hotel keys.',
    unitPrice: 85000,
    moq: 10,
    image: '/products/categories/wardrobe.jpg',
    includes: ['Queen bed', '2 bedside', 'Wardrobe', 'TV unit'],
    tags: ['hotel', 'standard room'],
    specs: [{ label: 'MOQ', value: '10 room sets' }],
  },
  {
    id: 'fa-pkg-hostel',
    name: 'Hostel Room Set',
    categoryId: 'room-packages',
    tagline: 'Bed + study + locker wardrobe',
    description: 'Durable hostel / PG package.',
    unitPrice: 42000,
    moq: 20,
    image: '/products/categories/commercials.jpg',
    includes: ['Single bed', 'Study', 'Locker wardrobe'],
    tags: ['hostel', 'pg'],
    specs: [{ label: 'MOQ', value: '20 room sets' }],
  },
  {
    id: 'fa-sofa-3',
    name: '3-Seater Sofa',
    categoryId: 'sofa',
    tagline: 'Living / suite 3-seater',
    description: 'Bulk 3-seater for 1BHK living and suites.',
    unitPrice: 28000,
    moq: 6,
    image: '/products/categories/sculpted-furniture.jpg',
    tags: ['sofa', '3 seater', '3-seater'],
    specs: [{ label: 'Seating', value: '3-seater' }],
  },
  {
    id: 'fa-sofa-5',
    name: '5-Seater Sofa Set',
    categoryId: 'sofa',
    tagline: '3+2 living set',
    description: '5-seater set (3+2) for larger 1BHK / lobby feel.',
    unitPrice: 48000,
    moq: 4,
    image: '/products/categories/sculpted-furniture.jpg',
    tags: ['sofa', '5 seater', '5-seater'],
    specs: [{ label: 'Seating', value: '5-seater (3+2)' }],
  },
  {
    id: 'fa-tv-32',
    name: 'TV Unit · 32″ ready',
    categoryId: 'tv-units',
    tagline: 'Compact TV console for 32″',
    description: 'Cable-managed unit sized for 32-inch TV.',
    unitPrice: 12000,
    moq: 10,
    image: '/products/categories/wall-panels.jpg',
    tags: ['tv', '32', '32 inch', '32″'],
    specs: [{ label: 'TV size', value: '32″' }],
  },
  {
    id: 'fa-tv-42',
    name: 'TV Unit · 42″ ready',
    categoryId: 'tv-units',
    tagline: 'Wider console for 42″',
    description: 'Wider TV unit for 42-inch screens.',
    unitPrice: 16000,
    moq: 10,
    image: '/products/categories/wall-panels.jpg',
    tags: ['tv', '42', '42 inch', '42″'],
    specs: [{ label: 'TV size', value: '42″' }],
  },
  {
    id: 'fa-wr-slider',
    name: 'Sliding Wardrobe',
    categoryId: 'wardrobes',
    tagline: 'Slider shutters · space saving',
    description: 'Sliding wardrobe for tight hotel / 1BHK bedrooms.',
    unitPrice: 32000,
    moq: 8,
    image: '/products/wardrobe/wardrobe-12/01.jpg',
    tags: ['wardrobe', 'slider', 'sliding'],
    specs: [{ label: 'Type', value: 'Sliding' }],
  },
  {
    id: 'fa-wr-openable',
    name: 'Openable (Hinged) Wardrobe',
    categoryId: 'wardrobes',
    tagline: 'Hinged shutters',
    description: 'Classic openable wardrobe for guest rooms.',
    unitPrice: 28000,
    moq: 10,
    image: '/products/wardrobe/wardrobe-7/01.jpg',
    tags: ['wardrobe', 'openable', 'hinged'],
    specs: [{ label: 'Type', value: 'Openable / hinged' }],
  },
  {
    id: 'fa-wr-compact',
    name: 'Compact Wardrobe',
    categoryId: 'wardrobes',
    tagline: 'Small footprint locker style',
    description: 'Compact wardrobe / locker for hostels and small rooms.',
    unitPrice: 18000,
    moq: 15,
    image: '/products/wardrobe/wardrobe-4/01.jpg',
    tags: ['wardrobe', 'compact', 'locker'],
    specs: [{ label: 'Type', value: 'Compact' }],
  },
  {
    id: 'fa-kit-small',
    name: 'Small Kitchen Package',
    categoryId: 'kitchens',
    tagline: 'Compact 1BHK kitchen run',
    description: 'Small kitchen carcass + shutter package for 1BHK.',
    unitPrice: 65000,
    moq: 6,
    image: '/products/categories/kitchen.jpg',
    tags: ['kitchen', 'small kitchen'],
    specs: [{ label: 'Size', value: 'Small / compact 1BHK' }],
  },
  {
    id: 'fa-kit-big',
    name: 'Big Kitchen Package',
    categoryId: 'kitchens',
    tagline: 'Larger kitchen run',
    description: 'Bigger kitchen package for larger 1BHK / suites.',
    unitPrice: 110000,
    moq: 4,
    image: '/products/categories/kitchen.jpg',
    tags: ['kitchen', 'big kitchen', 'large kitchen'],
    specs: [{ label: 'Size', value: 'Big / extended' }],
  },
  {
    id: 'fa-bed-queen',
    name: 'Bulk Queen Bed',
    categoryId: 'beds',
    tagline: 'Hotel queen + headboard',
    description: 'Repeatable queen bed for guest / 1BHK bedrooms.',
    unitPrice: 22000,
    moq: 10,
    image: '/products/categories/live-edge-furniture.jpg',
    tags: ['bed', 'queen'],
    specs: [{ label: 'Size', value: 'Queen' }],
  },
  {
    id: 'fa-bedside-pair',
    name: 'Bedside Unit (pair)',
    categoryId: 'bedside',
    tagline: 'Matched pair',
    description: 'Bedside pair for hotel / 1BHK bedrooms.',
    unitPrice: 9000,
    moq: 10,
    image: '/products/categories/handles.jpg',
    tags: ['bedside'],
    specs: [{ label: 'Unit', value: 'Pair' }],
  },
  {
    id: 'fa-console-corridor',
    name: 'Corridor Console',
    categoryId: 'consoles',
    tagline: 'Passage console',
    description: 'Slim console for corridors and entries.',
    unitPrice: 18000,
    moq: 6,
    image: '/products/categories/doors.jpg',
    tags: ['console'],
    specs: [{ label: 'Type', value: 'Console' }],
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

export function buildBoq(selections: Record<string, number>) {
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

/* ——— Chat flow (everything stays in chat) ——— */

export type ChatRole = 'ai' | 'user'

export type ChatChoice = {
  id: string
  label: string
  /** Sent as user message when tapped */
  value: string
}

export type ChatMessage = {
  id: string
  role: ChatRole
  text: string
  /** Inline marketplace product cards */
  productIds?: string[]
  /** Quick-reply chips */
  choices?: ChatChoice[]
  /** Show mini BOQ under this bubble */
  showBoq?: boolean
}

/** Guided configuration collected in chat */
export type ProjectBrief = {
  projectType?: 'hotel' | 'hostel' | 'commercial'
  roomFormat?: '1bhk' | 'standard-room' | 'hostel-bed' | 'custom'
  roomCount?: number
  city?: string
  sofa?: '3-seater' | '5-seater' | 'none'
  tv?: '32' | '42' | 'none'
  wardrobe?: 'slider' | 'openable' | 'compact' | 'none'
  kitchen?: 'small' | 'big' | 'none'
  needs: string[]
  notes?: string
  hasPlan?: boolean
  /** Internal dialogue step */
  step?:
    | 'start'
    | 'type'
    | 'format'
    | 'count'
    | 'sofa'
    | 'tv'
    | 'wardrobe'
    | 'kitchen'
    | 'picks'
    | 'boq'
}

export function initialAiMessages(): ChatMessage[] {
  return [
    {
      id: 'm0',
      role: 'ai',
      text:
        'Welcome to **FurnicherAI**. Stay in this chat — I’ll help you pick every piece, show products here, and build your BOQ. Priyabadal Homes is the final verdict for production.\n\nWhat are you furnishing?',
      choices: [
        { id: 'c-hotel-1bhk', label: 'Hotel 1BHK full package', value: 'Hotel 1BHK full package' },
        { id: 'c-hotel-std', label: 'Hotel standard rooms', value: 'Hotel standard rooms' },
        { id: 'c-hostel', label: 'Hostel / PG', value: 'Hostel rooms bulk' },
        { id: 'c-commercial', label: 'Commercial bulk', value: 'Commercial bulk furniture' },
      ],
    },
  ]
}

function productIdsForBrief(brief: ProjectBrief): string[] {
  const ids: string[] = []
  if (brief.roomFormat === '1bhk') ids.push('fa-pkg-1bhk')
  if (brief.roomFormat === 'standard-room') ids.push('fa-pkg-hotel-standard')
  if (brief.roomFormat === 'hostel-bed') ids.push('fa-pkg-hostel')

  if (brief.sofa === '3-seater') ids.push('fa-sofa-3')
  if (brief.sofa === '5-seater') ids.push('fa-sofa-5')
  if (brief.tv === '32') ids.push('fa-tv-32')
  if (brief.tv === '42') ids.push('fa-tv-42')
  if (brief.wardrobe === 'slider') ids.push('fa-wr-slider')
  if (brief.wardrobe === 'openable') ids.push('fa-wr-openable')
  if (brief.wardrobe === 'compact') ids.push('fa-wr-compact')
  if (brief.kitchen === 'small') ids.push('fa-kit-small')
  if (brief.kitchen === 'big') ids.push('fa-kit-big')

  // Always offer bed + bedside for room projects once format known
  if (brief.roomFormat && brief.step !== 'start') {
    if (!ids.includes('fa-bed-queen') && brief.roomFormat !== 'hostel-bed') {
      ids.push('fa-bed-queen', 'fa-bedside-pair')
    }
  }
  return [...new Set(ids)]
}

function detectFromText(t: string, brief: ProjectBrief): ProjectBrief {
  const next: ProjectBrief = { ...brief, needs: [...brief.needs] }

  if (/\b1\s*bhk\b|\bone bhk\b/.test(t)) {
    next.roomFormat = '1bhk'
    next.projectType = next.projectType || 'hotel'
    if (!next.needs.includes('room-packages')) next.needs.push('room-packages')
  }
  if (/\bhostel|pg\b/.test(t)) {
    next.projectType = 'hostel'
    next.roomFormat = next.roomFormat || 'hostel-bed'
  } else if (/\bcommercial|office|staff\b/.test(t)) {
    next.projectType = 'commercial'
  } else if (/\bhotel|resort|serviced|stay\b/.test(t)) {
    next.projectType = 'hotel'
  }

  if (/\bstandard room|guest room\b/.test(t) && !next.roomFormat) {
    next.roomFormat = 'standard-room'
  }
  if (/\bfull package|complete package|entire package\b/.test(t) && !next.roomFormat) {
    next.roomFormat = '1bhk'
  }

  const roomMatch = t.match(/(\d{1,4})\s*(rooms?|keys?|units?|packages?|flats?|1bhk)?/)
  if (roomMatch) {
    const n = Number(roomMatch[1])
    if (n >= 1 && n <= 5000) next.roomCount = n
  }

  if (/\b5\s*-?\s*seater|five seater\b/.test(t)) next.sofa = '5-seater'
  else if (/\b3\s*-?\s*seater|three seater\b/.test(t)) next.sofa = '3-seater'
  else if (/\bno sofa|without sofa\b/.test(t)) next.sofa = 'none'

  if (/\b42\b|\b42\s*("|inch|″)/.test(t)) next.tv = '42'
  else if (/\b32\b|\b32\s*("|inch|″)/.test(t)) next.tv = '32'
  else if (/\bno tv|without tv\b/.test(t)) next.tv = 'none'

  if (/\bslid(e|ing|er)\b/.test(t)) next.wardrobe = 'slider'
  else if (/\bopenable|hinged\b/.test(t)) next.wardrobe = 'openable'
  else if (/\bcompact|locker\b/.test(t)) next.wardrobe = 'compact'
  else if (/\bno wardrobe\b/.test(t)) next.wardrobe = 'none'

  if (/\bbig kitchen|large kitchen\b/.test(t)) next.kitchen = 'big'
  else if (/\bsmall kitchen|compact kitchen\b/.test(t)) next.kitchen = 'small'
  else if (/\bno kitchen|without kitchen\b/.test(t)) next.kitchen = 'none'

  if (/\b(floor\s*plan|2d|3d|drawing|layout|pdf)\b/.test(t)) next.hasPlan = true

  return next
}

export type AiTurn = {
  reply: string
  brief: ProjectBrief
  productIds?: string[]
  choices?: ChatChoice[]
  showBoq?: boolean
  /** Suggested default qty when user adds from chat (usually roomCount) */
  defaultQty?: number
}

export function furnicherAiReply(userText: string, brief: ProjectBrief): AiTurn {
  const t = userText.trim().toLowerCase()
  let next = detectFromText(t, brief)
  const qtyDefault = next.roomCount || 10

  if (/\bcontinue|show next|next option\b/.test(t)) {
    // Re-enter step machine with current brief
  }

  // Explicit BOQ request
  if (/\b(boq|quotation|quote|final|whatsapp|done|finish|grab)\b/.test(t)) {
    next.step = 'boq'
    return {
      brief: next,
      showBoq: true,
      reply:
        'Here is your **live BOQ draft** from this chat. Review lines below, adjust quantities on the product cards above if needed, then send to **WhatsApp** for Priyabadal Homes final confirmation.',
      productIds: productIdsForBrief(next),
      defaultQty: qtyDefault,
      choices: [
        { id: 'more', label: 'Change sofa / TV / wardrobe', value: 'I want to change sofa TV wardrobe options' },
        { id: 'wa', label: 'Ready for WhatsApp', value: 'I am ready for WhatsApp BOQ' },
      ],
    }
  }

  if (/\bchange (sofa|tv|wardrobe|kitchen)|options again\b/.test(t)) {
    next = {
      ...next,
      sofa: undefined,
      tv: undefined,
      wardrobe: undefined,
      kitchen: undefined,
      step: 'sofa',
    }
  }

  // Step machine
  if (!next.projectType || !next.roomFormat) {
    next.step = 'format'
    return {
      brief: next,
      reply:
        'Let’s lock the package type first. Are you doing a **Hotel 1BHK full package**, **standard hotel rooms**, or **hostel beds**?',
      choices: [
        { id: '1bhk', label: 'Hotel 1BHK full package', value: 'Hotel 1BHK full package' },
        { id: 'std', label: 'Hotel standard rooms', value: 'Hotel standard rooms 40 keys' },
        { id: 'hostel', label: 'Hostel / PG', value: 'Hostel 40 rooms' },
      ],
      productIds: ['fa-pkg-1bhk', 'fa-pkg-hotel-standard', 'fa-pkg-hostel'],
      defaultQty: qtyDefault,
    }
  }

  if (!next.roomCount) {
    next.step = 'count'
    const label =
      next.roomFormat === '1bhk'
        ? '1BHK units'
        : next.roomFormat === 'hostel-bed'
          ? 'hostel rooms'
          : 'hotel rooms'
    return {
      brief: next,
      reply: `Great — **${next.projectType}** · **${next.roomFormat}**. How many ${label} do you need? (Example: 24)`,
      choices: [
        { id: 'q10', label: '10', value: '10 units' },
        { id: 'q20', label: '20', value: '20 units' },
        { id: 'q40', label: '40', value: '40 units' },
        { id: 'q60', label: '60', value: '60 units' },
      ],
    }
  }

  // 1BHK / full package configuration path
  const needsConfig =
    next.roomFormat === '1bhk' ||
    /\bfull package\b/.test(t) ||
    next.needs.includes('room-packages')

  if (needsConfig && !next.sofa) {
    next.step = 'sofa'
    return {
      brief: next,
      reply: `For your **${next.roomCount} × ${next.roomFormat}** project — which sofa do you want in the living area?`,
      choices: [
        { id: 's3', label: '3-seater sofa', value: '3-seater sofa' },
        { id: 's5', label: '5-seater sofa', value: '5-seater sofa' },
        { id: 'sn', label: 'No sofa', value: 'no sofa' },
      ],
      productIds: ['fa-sofa-3', 'fa-sofa-5'],
      defaultQty: next.roomCount,
    }
  }

  if (needsConfig && !next.tv) {
    next.step = 'tv'
    return {
      brief: next,
      reply: 'Which TV size should the TV unit be made for?',
      choices: [
        { id: 't32', label: '32″ TV unit', value: '32 inch TV unit' },
        { id: 't42', label: '42″ TV unit', value: '42 inch TV unit' },
        { id: 'tn', label: 'No TV unit', value: 'no tv' },
      ],
      productIds: ['fa-tv-32', 'fa-tv-42'],
      defaultQty: next.roomCount,
    }
  }

  if (needsConfig && !next.wardrobe) {
    next.step = 'wardrobe'
    return {
      brief: next,
      reply: 'Which wardrobe type for the bedroom?',
      choices: [
        { id: 'ws', label: 'Sliding wardrobe', value: 'sliding wardrobe' },
        { id: 'wo', label: 'Openable wardrobe', value: 'openable wardrobe' },
        { id: 'wc', label: 'Compact wardrobe', value: 'compact wardrobe' },
      ],
      productIds: ['fa-wr-slider', 'fa-wr-openable', 'fa-wr-compact'],
      defaultQty: next.roomCount,
    }
  }

  if (needsConfig && !next.kitchen) {
    next.step = 'kitchen'
    return {
      brief: next,
      reply: 'Kitchen size for each 1BHK?',
      choices: [
        { id: 'ks', label: 'Small kitchen', value: 'small kitchen' },
        { id: 'kb', label: 'Big kitchen', value: 'big kitchen' },
        { id: 'kn', label: 'No kitchen', value: 'no kitchen' },
      ],
      productIds: ['fa-kit-small', 'fa-kit-big'],
      defaultQty: next.roomCount,
    }
  }

  // Config complete → show curated picks + ask to add / BOQ
  next.step = 'picks'
  const picks = productIdsForBrief(next)
  const summary = [
    `Type: **${next.projectType}**`,
    `Format: **${next.roomFormat}** × **${next.roomCount}**`,
    next.sofa ? `Sofa: **${next.sofa}**` : null,
    next.tv ? `TV: **${next.tv}″ unit**` : null,
    next.wardrobe ? `Wardrobe: **${next.wardrobe}**` : null,
    next.kitchen ? `Kitchen: **${next.kitchen}**` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return {
    brief: next,
    defaultQty: next.roomCount,
    productIds: picks,
    showBoq: false,
    reply: `Your FurnicherAI brief (Priyabadal Homes bulk desk):\n\n${summary}\n\nBelow are the marketplace products that match. Tap **Add × ${next.roomCount}** on each card you want — stay in chat. When ready, tap **Build BOQ**.`,
    choices: [
      { id: 'add-all', label: `Add matched set × ${next.roomCount}`, value: 'ADD_MATCHED_SET' },
      { id: 'boq', label: 'Build BOQ now', value: 'Build BOQ now' },
      { id: 'change', label: 'Change options', value: 'I want to change sofa TV wardrobe options' },
    ],
  }
}

/** Map brief choices to product ids for "add matched set" */
export function matchedProductIds(brief: ProjectBrief): string[] {
  const ids: string[] = []
  // For 1BHK we add components (not the mega package double-count) unless user only wants package
  if (brief.roomFormat === '1bhk') {
    ids.push('fa-bed-queen', 'fa-bedside-pair')
    if (brief.sofa === '3-seater') ids.push('fa-sofa-3')
    if (brief.sofa === '5-seater') ids.push('fa-sofa-5')
    if (brief.tv === '32') ids.push('fa-tv-32')
    if (brief.tv === '42') ids.push('fa-tv-42')
    if (brief.wardrobe === 'slider') ids.push('fa-wr-slider')
    if (brief.wardrobe === 'openable') ids.push('fa-wr-openable')
    if (brief.wardrobe === 'compact') ids.push('fa-wr-compact')
    if (brief.kitchen === 'small') ids.push('fa-kit-small')
    if (brief.kitchen === 'big') ids.push('fa-kit-big')
  } else if (brief.roomFormat === 'standard-room') {
    ids.push('fa-pkg-hotel-standard')
  } else if (brief.roomFormat === 'hostel-bed') {
    ids.push('fa-pkg-hostel')
  }
  return ids
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
    'Hi Priyabadal Homes — FurnicherAI bulk enquiry',
    '',
    `Project: ${brief.projectType || '—'} · ${brief.roomFormat || '—'} · ${brief.roomCount ?? '—'} units`,
    brief.sofa ? `Sofa: ${brief.sofa}` : null,
    brief.tv ? `TV unit: ${brief.tv}″` : null,
    brief.wardrobe ? `Wardrobe: ${brief.wardrobe}` : null,
    brief.kitchen ? `Kitchen: ${brief.kitchen}` : null,
    brief.city ? `City: ${brief.city}` : null,
    planName ? `Floor plan: ${planName}` : null,
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
    '— Sent from FurnicherAI chat (Priyabadal Homes)',
  ]
    .filter(Boolean)
    .join('\n')
}
