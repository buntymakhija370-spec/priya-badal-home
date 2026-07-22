export type CategoryId =
  | 'living-room'
  | 'bedroom'
  | 'kitchen-dining'
  | 'decor'
  | 'lighting'

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
  description: string
  style: string[]
  rooms: string[]
  image: string
  images?: string[]
  custom?: boolean
}

export const categories: Category[] = [
  {
    id: 'living-room',
    name: 'Living Room',
    description: 'Sofas, tables, and rugs that set the tone of the home.',
    image:
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=80',
    subcategories: [
      { id: 'sofas', name: 'Sofas' },
      { id: 'tables', name: 'Tables' },
      { id: 'rugs', name: 'Rugs' },
    ],
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    description: 'Calm beds, soft textiles, and quiet storage.',
    image:
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1400&q=80',
    subcategories: [
      { id: 'beds', name: 'Beds' },
      { id: 'storage', name: 'Storage' },
      { id: 'textiles', name: 'Textiles' },
    ],
  },
  {
    id: 'kitchen-dining',
    name: 'Kitchen & Dining',
    description: 'Tables and pieces made for gathering.',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
    subcategories: [
      { id: 'dining-sets', name: 'Dining Sets' },
      { id: 'sideboards', name: 'Sideboards' },
      { id: 'tableware', name: 'Tableware' },
    ],
  },
  {
    id: 'decor',
    name: 'Decor',
    description: 'Art, ceramics, and accents that finish a room.',
    image:
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1400&q=80',
    subcategories: [
      { id: 'wall-art', name: 'Wall Art' },
      { id: 'vases', name: 'Vases & Plants' },
      { id: 'accents', name: 'Accents' },
    ],
  },
  {
    id: 'lighting',
    name: 'Lighting',
    description: 'Warm light for evenings and soft mornings.',
    image:
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1400&q=80',
    subcategories: [
      { id: 'floor-lamps', name: 'Floor Lamps' },
      { id: 'pendants', name: 'Pendants' },
      { id: 'table-lamps', name: 'Table Lamps' },
    ],
  },
]

export const baseProducts: Product[] = [
  {
    id: 'linen-lounge-sofa',
    name: 'Linen Lounge Sofa',
    categoryId: 'living-room',
    subcategoryId: 'sofas',
    price: 64999,
    currency: 'INR',
    description:
      'A deep, soft sofa in natural linen — ideal for calm living rooms and slow evenings.',
    style: ['minimal', 'scandinavian', 'warm'],
    rooms: ['living room', 'lounge'],
    image:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'oak-coffee-table',
    name: 'Oak Coffee Table',
    categoryId: 'living-room',
    subcategoryId: 'tables',
    price: 18999,
    currency: 'INR',
    description:
      'Solid oak with rounded edges. Pairs well with linen sofas and soft rugs.',
    style: ['natural', 'scandinavian', 'warm'],
    rooms: ['living room'],
    image:
      'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'woven-jute-rug',
    name: 'Woven Jute Rug',
    categoryId: 'living-room',
    subcategoryId: 'rugs',
    price: 8999,
    currency: 'INR',
    description:
      'Textured jute rug that grounds a room without overpowering furniture.',
    style: ['natural', 'boho', 'warm'],
    rooms: ['living room', 'bedroom'],
    image:
      'https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'softwood-platform-bed',
    name: 'Softwood Platform Bed',
    categoryId: 'bedroom',
    subcategoryId: 'beds',
    price: 42999,
    currency: 'INR',
    description:
      'Low platform bed in warm timber — clean lines for restful bedrooms.',
    style: ['minimal', 'japandi', 'warm'],
    rooms: ['bedroom'],
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'cane-wardrobe',
    name: 'Cane Panel Wardrobe',
    categoryId: 'bedroom',
    subcategoryId: 'storage',
    price: 51999,
    currency: 'INR',
    description:
      'Breathable cane fronts with ample storage — light, airy, and practical.',
    style: ['natural', 'tropical', 'warm'],
    rooms: ['bedroom'],
    image:
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'cotton-duvet-set',
    name: 'Stonewashed Cotton Duvet',
    categoryId: 'bedroom',
    subcategoryId: 'textiles',
    price: 4999,
    currency: 'INR',
    description:
      'Soft stonewashed cotton in muted sage — instant calm for any bedroom.',
    style: ['minimal', 'soft', 'warm'],
    rooms: ['bedroom'],
    image:
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'teak-dining-set',
    name: 'Teak Dining Set for Six',
    categoryId: 'kitchen-dining',
    subcategoryId: 'dining-sets',
    price: 78999,
    currency: 'INR',
    description:
      'Warm teak table with six chairs — made for long dinners and weekend breakfasts.',
    style: ['classic', 'warm', 'natural'],
    rooms: ['dining', 'kitchen'],
    image:
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'walnut-sideboard',
    name: 'Walnut Sideboard',
    categoryId: 'kitchen-dining',
    subcategoryId: 'sideboards',
    price: 34999,
    currency: 'INR',
    description:
      'Low walnut sideboard for china, glassware, and display pieces.',
    style: ['modern', 'warm', 'classic'],
    rooms: ['dining', 'living room'],
    image:
      'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'stoneware-set',
    name: 'Matte Stoneware Set',
    categoryId: 'kitchen-dining',
    subcategoryId: 'tableware',
    price: 3499,
    currency: 'INR',
    description:
      'Twelve-piece matte stoneware in soft clay tones for everyday tables.',
    style: ['minimal', 'warm', 'natural'],
    rooms: ['kitchen', 'dining'],
    image:
      'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'abstract-canvas',
    name: 'Soft Abstract Canvas',
    categoryId: 'decor',
    subcategoryId: 'wall-art',
    price: 6999,
    currency: 'INR',
    description:
      'Large abstract print in moss and mist tones — a quiet focal point.',
    style: ['modern', 'soft', 'minimal'],
    rooms: ['living room', 'bedroom', 'hallway'],
    image:
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'ceramic-floor-vase',
    name: 'Ceramic Floor Vase',
    categoryId: 'decor',
    subcategoryId: 'vases',
    price: 2799,
    currency: 'INR',
    description:
      'Tall handmade ceramic vase for dried stems or a single branch.',
    style: ['organic', 'warm', 'boho'],
    rooms: ['living room', 'hallway', 'bedroom'],
    image:
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'brass-tray',
    name: 'Hand-Hammered Brass Tray',
    categoryId: 'decor',
    subcategoryId: 'accents',
    price: 1899,
    currency: 'INR',
    description:
      'Warm brass tray for coffee tables, shelves, or entry consoles.',
    style: ['classic', 'warm', 'luxe'],
    rooms: ['living room', 'dining'],
    image:
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'arc-floor-lamp',
    name: 'Arc Floor Lamp',
    categoryId: 'lighting',
    subcategoryId: 'floor-lamps',
    price: 12999,
    currency: 'INR',
    description:
      'Sweeping arc lamp that pools warm light over sofas and reading chairs.',
    style: ['modern', 'luxe', 'minimal'],
    rooms: ['living room', 'bedroom'],
    image:
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'linen-pendant',
    name: 'Linen Dome Pendant',
    categoryId: 'lighting',
    subcategoryId: 'pendants',
    price: 8499,
    currency: 'INR',
    description:
      'Soft linen shade for dining tables and kitchen islands — gentle, even glow.',
    style: ['scandinavian', 'soft', 'warm'],
    rooms: ['dining', 'kitchen'],
    image:
      'https://images.unsplash.com/photo-1524484485811-4b898ac064cf?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'ceramic-table-lamp',
    name: 'Ceramic Table Lamp',
    categoryId: 'lighting',
    subcategoryId: 'table-lamps',
    price: 4599,
    currency: 'INR',
    description:
      'Glazed ceramic base with warm linen shade — perfect bedside companion.',
    style: ['warm', 'classic', 'soft'],
    rooms: ['bedroom', 'living room'],
    image:
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&q=80',
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
