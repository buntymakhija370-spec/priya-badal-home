export type CategoryId =
  | 'wall-panels'
  | 'kitchen'
  | 'wardrobe'
  | 'temple'
  | 'doors'
  | 'sculpted-furniture'

export type Subcategory = {
  id: string
  name: string
}

export type Category = {
  id: CategoryId
  name: string
  description: string
  image: string
  subcategories: Subcategory[]
}

export type Product = {
  id: string
  name: string
  categoryId: CategoryId
  subcategoryId: string
  price: number
  currency: 'INR'
  /** unit = fixed piece price scaled by size; per-sqft = price × face area in sq ft */
  pricingMode?: 'unit' | 'per-sqft'
  defaultFinishId?: string
  defaultThicknessId?: string
  description: string
  style: string[]
  rooms: string[]
  image: string
  images?: string[]
  custom?: boolean
}

export const categories: Category[] = [
  {
    id: 'wall-panels',
    name: 'Wall Panels',
    description: 'Feature walls, fluted panels, and decorative cladding.',
    image:
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1400&q=80',
    subcategories: [
      { id: 'fluted', name: 'Fluted Panels' },
      { id: '3d-panels', name: '3D Panels' },
      { id: 'acoustic', name: 'Acoustic Panels' },
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    description: 'Modular kitchens, cabinets, and counter finishes.',
    image:
      'https://images.unsplash.com/photo-1556912173-46c336c7fd55?auto=format&fit=crop&w=1400&q=80',
    subcategories: [
      { id: 'modular', name: 'Modular Units' },
      { id: 'cabinets', name: 'Cabinets' },
      { id: 'island', name: 'Island & Counters' },
    ],
  },
  {
    id: 'wardrobe',
    name: 'Wardrobe',
    description: 'Sliding, hinged, and walk-in wardrobes made to measure.',
    image:
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1400&q=80',
    subcategories: [
      { id: 'sliding', name: 'Sliding' },
      { id: 'hinged', name: 'Hinged' },
      { id: 'walk-in', name: 'Walk-in' },
    ],
  },
  {
    id: 'temple',
    name: 'Temple',
    description: 'Home mandirs and carved temple units for puja spaces.',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
    subcategories: [
      { id: 'wall-mounted', name: 'Wall Mounted' },
      { id: 'floor', name: 'Floor Standing' },
      { id: 'carved', name: 'Carved' },
    ],
  },
  {
    id: 'doors',
    name: 'Doors',
    description: 'Main doors, room doors, and designer flush shutters.',
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80',
    subcategories: [
      { id: 'main-door', name: 'Main Door' },
      { id: 'room-door', name: 'Room Door' },
      { id: 'flush', name: 'Flush Door' },
    ],
  },
  {
    id: 'sculpted-furniture',
    name: 'Sculpted Furniture',
    description: 'Statement carved pieces — sofas, consoles, and art furniture.',
    image:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1400&q=80',
    subcategories: [
      { id: 'sofa', name: 'Sofa' },
      { id: 'console', name: 'Console' },
      { id: 'centre-table', name: 'Centre Table' },
    ],
  },
]

export const baseProducts: Product[] = [
  {
    id: 'geometric-pu-wardrobe',
    name: 'Geometric PU Wardrobe',
    categoryId: 'wardrobe',
    subcategoryId: 'hinged',
    price: 1050,
    currency: 'INR',
    pricingMode: 'per-sqft',
    defaultFinishId: 'pu',
    defaultThicknessId: '25',
    description:
      'Floor-to-ceiling hinged wardrobe in matte greige PU with engraved geometric doors and gold handles. Soft-close interiors with hanging and shelf storage. Priced at ₹1,050 / sq ft · 25 mm · PU finish.',
    style: ['modern', 'luxe', 'geometric'],
    rooms: ['bedroom', 'wardrobe'],
    image: '/products/wardrobe-geo-closed.jpg',
    images: [
      '/products/wardrobe-geo-closed.jpg',
      '/products/wardrobe-geo-open.jpg',
    ],
  },
  {
    id: 'rose-gold-inset-wardrobe',
    name: 'Rose Gold Inset Wardrobe',
    categoryId: 'wardrobe',
    subcategoryId: 'hinged',
    price: 1500,
    currency: 'INR',
    pricingMode: 'per-sqft',
    defaultFinishId: 'pu',
    defaultThicknessId: '25',
    description:
      'Floor-to-ceiling hinged wardrobe in matte taupe PU with rose-gold metallic inset frames, rounded capsule panels, and soft-close dark wood interiors. Priced at ₹1,500 / sq ft · 25 mm · PU finish.',
    style: ['modern', 'luxe', 'geometric'],
    rooms: ['bedroom', 'wardrobe'],
    image: '/products/wardrobe-rose-closed.png',
    images: [
      '/products/wardrobe-rose-closed.png',
      '/products/wardrobe-rose-ajar.png',
      '/products/wardrobe-rose-open.png',
    ],
  },
  {
    id: 'fluted-oak-panel',
    name: 'Fluted Oak Wall Panel',
    categoryId: 'wall-panels',
    subcategoryId: 'fluted',
    price: 2499,
    currency: 'INR',
    description:
      'Warm oak fluted cladding for TV walls and feature accents — priced per panel base.',
    style: ['modern', 'warm', 'natural'],
    rooms: ['living room', 'bedroom', 'wall panels'],
    image:
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '3d-geometric-panel',
    name: '3D Geometric Panel',
    categoryId: 'wall-panels',
    subcategoryId: '3d-panels',
    price: 1899,
    currency: 'INR',
    description:
      'Sculpted 3D pattern panels that catch light and add depth to plain walls.',
    style: ['modern', 'luxe', 'minimal'],
    rooms: ['living room', 'hallway', 'wall panels'],
    image:
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'acoustic-soft-panel',
    name: 'Soft Acoustic Panel',
    categoryId: 'wall-panels',
    subcategoryId: 'acoustic',
    price: 2199,
    currency: 'INR',
    description:
      'Fabric-faced acoustic panels for quieter bedrooms and media rooms.',
    style: ['soft', 'modern', 'minimal'],
    rooms: ['bedroom', 'living room', 'wall panels'],
    image:
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'modular-l-kitchen',
    name: 'Modular L-Shape Kitchen',
    categoryId: 'kitchen',
    subcategoryId: 'modular',
    price: 189999,
    currency: 'INR',
    description:
      'Complete L-shape modular kitchen shell — customise finish, thickness, and size.',
    style: ['modern', 'warm', 'minimal'],
    rooms: ['kitchen'],
    image:
      'https://images.unsplash.com/photo-1556912173-46c336c7fd55?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'tall-kitchen-cabinet',
    name: 'Tall Kitchen Cabinet',
    categoryId: 'kitchen',
    subcategoryId: 'cabinets',
    price: 34999,
    currency: 'INR',
    description:
      'Floor-to-ceiling storage cabinet for pantry, appliances, and daily essentials.',
    style: ['modern', 'classic', 'warm'],
    rooms: ['kitchen'],
    image:
      'https://images.unsplash.com/photo-1556911220-bff31c8750ea?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'kitchen-island-unit',
    name: 'Kitchen Island Unit',
    categoryId: 'kitchen',
    subcategoryId: 'island',
    price: 67999,
    currency: 'INR',
    description:
      'Centre island with storage and seating overhang — sized to your kitchen plan.',
    style: ['modern', 'luxe', 'warm'],
    rooms: ['kitchen'],
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sliding-wardrobe-set',
    name: 'Sliding Wardrobe',
    categoryId: 'wardrobe',
    subcategoryId: 'sliding',
    price: 74999,
    currency: 'INR',
    description:
      'Space-saving sliding wardrobe with soft-close tracks — customise width and finish.',
    style: ['modern', 'minimal', 'warm'],
    rooms: ['bedroom', 'wardrobe'],
    image:
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'hinged-wardrobe-set',
    name: 'Hinged Wardrobe',
    categoryId: 'wardrobe',
    subcategoryId: 'hinged',
    price: 62999,
    currency: 'INR',
    description:
      'Classic hinged wardrobe with deep shelves and hanging rails.',
    style: ['classic', 'warm', 'natural'],
    rooms: ['bedroom', 'wardrobe'],
    image:
      'https://images.unsplash.com/photo-1631679706909-1844aa4edf4a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'walk-in-wardrobe',
    name: 'Walk-in Wardrobe Bay',
    categoryId: 'wardrobe',
    subcategoryId: 'walk-in',
    price: 129999,
    currency: 'INR',
    description:
      'Open walk-in bay with drawers, shelves, and display niches.',
    style: ['luxe', 'modern', 'warm'],
    rooms: ['bedroom', 'wardrobe'],
    image:
      'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'wall-mandir',
    name: 'Wall Mounted Mandir',
    categoryId: 'temple',
    subcategoryId: 'wall-mounted',
    price: 18999,
    currency: 'INR',
    description:
      'Compact wall mandir with soft lighting niche — ideal for apartments.',
    style: ['classic', 'warm', 'traditional'],
    rooms: ['puja', 'temple', 'living room'],
    image:
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'floor-temple-unit',
    name: 'Floor Standing Temple',
    categoryId: 'temple',
    subcategoryId: 'floor',
    price: 45999,
    currency: 'INR',
    description:
      'Full-height temple unit with storage drawers and carved door options.',
    style: ['classic', 'traditional', 'warm'],
    rooms: ['puja', 'temple'],
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'carved-temple',
    name: 'Carved Teak Temple',
    categoryId: 'temple',
    subcategoryId: 'carved',
    price: 78999,
    currency: 'INR',
    description:
      'Hand-detailed carved temple in teak tones — a sacred centrepiece.',
    style: ['traditional', 'luxe', 'carved'],
    rooms: ['puja', 'temple'],
    image:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'main-entrance-door',
    name: 'Main Entrance Door',
    categoryId: 'doors',
    subcategoryId: 'main-door',
    price: 42999,
    currency: 'INR',
    description:
      'Solid main door with designer face — customise size, thickness, and finish.',
    style: ['classic', 'luxe', 'warm'],
    rooms: ['entrance', 'doors'],
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'interior-room-door',
    name: 'Interior Room Door',
    categoryId: 'doors',
    subcategoryId: 'room-door',
    price: 14999,
    currency: 'INR',
    description:
      'Smooth interior door for bedrooms and studies — made to opening size.',
    style: ['minimal', 'modern', 'warm'],
    rooms: ['bedroom', 'doors'],
    image:
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'flush-designer-door',
    name: 'Designer Flush Door',
    categoryId: 'doors',
    subcategoryId: 'flush',
    price: 11999,
    currency: 'INR',
    description:
      'Flush shutter with premium laminate options for a clean, modern look.',
    style: ['minimal', 'modern', 'gloss'],
    rooms: ['doors', 'hallway'],
    image:
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cd00?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sculpted-sofa',
    name: 'Sculpted Lounge Sofa',
    categoryId: 'sculpted-furniture',
    subcategoryId: 'sofa',
    price: 89999,
    currency: 'INR',
    description:
      'Statement sculpted sofa with carved detailing — customise finish and size.',
    style: ['luxe', 'carved', 'warm'],
    rooms: ['living room', 'sculpted furniture'],
    image:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sculpted-console',
    name: 'Sculpted Console',
    categoryId: 'sculpted-furniture',
    subcategoryId: 'console',
    price: 38999,
    currency: 'INR',
    description:
      'Carved console for entry or living — art piece and practical surface.',
    style: ['carved', 'classic', 'luxe'],
    rooms: ['living room', 'hallway', 'sculpted furniture'],
    image:
      'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sculpted-centre-table',
    name: 'Sculpted Centre Table',
    categoryId: 'sculpted-furniture',
    subcategoryId: 'centre-table',
    price: 27999,
    currency: 'INR',
    description:
      'Centre table with sculpted base — a bold anchor for the living room.',
    style: ['modern', 'carved', 'luxe'],
    rooms: ['living room', 'sculpted furniture'],
    image:
      'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?auto=format&fit=crop&w=1200&q=80',
  },
]

export function formatPrice(price: number, currency: 'INR' = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)
}

export function getCategory(id: string) {
  return categories.find((c) => c.id === id)
}

export function getSubcategory(categoryId: string, subcategoryId: string) {
  return getCategory(categoryId)?.subcategories.find((s) => s.id === subcategoryId)
}
