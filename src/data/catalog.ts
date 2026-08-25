export type CategoryId =
  | 'wall-panels'
  | 'kitchen'
  | 'wardrobe'
  | 'temple'
  | 'doors'
  | 'handles'
  | 'sculpted-furniture'
  | 'live-edge-furniture'
  | 'silaibunai'

export type Subcategory = {
  id: string
  name: string
  description?: string
}

export type Category = {
  id: CategoryId
  name: string
  description: string
  image: string
  /** Home-page loop clip (~10s). Falls back to image if missing. */
  video?: string
  /** Short marketing caption for category landing */
  caption?: string
  /** Shown as a bulk / commercial callout on the shop page */
  conceptNote?: string
  /** Default minimum order for this category (e.g. bulk commercials) */
  minOrderQuantity?: number
  /**
   * When false, products in this category are fixed pieces —
   * no Customise & Price calculator. Defaults to true.
   */
  customizable?: boolean
  subcategories: Subcategory[]
}

/** Pepperfry-style label/value row for Product Details & Specifications */
export type SpecRow = {
  label: string
  value: string
}

export type Product = {
  id: string
  name: string
  categoryId: CategoryId
  subcategoryId: string
  /** Base / shutter-only price (INR). For per-sqft products this is ₹ / sq ft. */
  price: number
  /**
   * Optional carcass / with-carcass rate (INR).
   * For per-sqft products: ₹ / sq ft for the carcass option.
   * When set, Customise & Price uses this instead of the default multiplier.
   */
  carcassPrice?: number
  currency: 'INR'
  /** unit = fixed piece price scaled by size; per-sqft = price × face area in sq ft */
  pricingMode?: 'unit' | 'per-sqft'
  defaultFinishId?: string
  defaultThicknessId?: string
  /** Selectable finishes in Customise & Price (defaults to [defaultFinishId]) */
  finishOptionIds?: string[]
  /** Selectable thicknesses in Customise & Price (defaults to [defaultThicknessId]) */
  thicknessOptionIds?: string[]
  /** CNC-Carve HD Board ₹ / sq ft (overrides global default when set) */
  cncCarveHdRate?: number
  /** Thickness id used for CNC-Carve HD Board quotes (e.g. '16') */
  cncThicknessId?: string
  /** Set false to hide CNC-Carve HD Board for this product */
  cncAvailable?: boolean
  /** Optional sculpted handle pair add-on (INR for the pair) */
  handlePairPrice?: number
  /**
   * When handlePairPrice is set, whether the handle checkbox starts checked.
   * Default true. Set false for handle-less products with optional handles.
   */
  handlePairDefault?: boolean
  /** Order-planning notes shown in calculator + WhatsApp quote */
  orderNotes?: string[]
  description: string
  style: string[]
  rooms: string[]
  image: string
  images?: string[]
  /** Optional captions aligned with `images` (shown under each photograph) */
  imageCaptions?: string[]
  /** Optional product videos (mp4/webm) shown in the gallery */
  videos?: string[]
  custom?: boolean
  /** Shown above the title, like Pepperfry brand line */
  brand?: string
  collection?: string
  sku?: string
  /** Short pills / badges on card & PDP (e.g. finish tags) */
  tags?: string[]
  /** Short bullets near the price */
  highlights?: string[]
  /** Product Details table rows */
  details?: SpecRow[]
  /** Specifications table rows */
  specifications?: SpecRow[]
  features?: string[]
  disclaimer?: string
  /** Bulk / commercial minimum units (overrides category default) */
  minOrderQuantity?: number
}

export const categories: Category[] = [
  {
    id: 'wall-panels',
    name: 'Wall Panels',
    description:
      'Feature walls — economic G-Series 6 mm HDR board with poly / PU coating (₹600/sq ft, custom colour), plus geometric cane, arched fluted, and diamond cane cladding made to measure.',
    caption: 'Economic G-Series · poly HDR · custom colour',
    image: '/products/categories/wall-panels.jpg',
    video: '/products/categories/wall-panels.mp4',
    subcategories: [
      { id: 'g-series', name: 'G-Series Economic (6 mm poly HDR)' },
      { id: 'geometric-cane', name: 'Geometric Cane' },
      { id: 'arch-fluted', name: 'Arch & Fluted' },
      { id: 'diamond-cane', name: 'Diamond Cane' },
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    description: 'Modular kitchens, cabinets, and counter finishes.',
    image: '/products/categories/kitchen.jpg',
    video: '/products/categories/kitchen.mp4',
    subcategories: [
      { id: 'modular', name: 'Modular Units' },
      { id: 'cabinets', name: 'Cabinets' },
      { id: 'island', name: 'Island & Counters' },
    ],
  },
  {
    id: 'wardrobe',
    name: 'Wardrobe',
    description:
      'Hinged, bifold, and open walk-in wardrobes — made to measure for your bedroom.',
    image: '/products/categories/wardrobe.jpg',
    video: '/products/categories/wardrobe.mp4',
    subcategories: [
      { id: 'hinged', name: 'Hinged' },
      { id: 'bifold', name: 'Bifold' },
      { id: 'walk-in', name: 'Walk-in / Open' },
    ],
  },
  {
    id: 'temple',
    name: 'Temple',
    description:
      'Designer home mandirs, temple walls, and prayer niches — made to measure.',
    image: '/products/categories/temple.jpg',
    video: '/products/categories/temple.mp4',
    subcategories: [
      { id: 'temple-wall', name: 'Temple Wall' },
      { id: 'wall-mounted', name: 'Wall Mounted' },
      { id: 'floor', name: 'Floor Standing' },
      { id: 'carved', name: 'Carved' },
    ],
  },
  {
    id: 'doors',
    name: 'Doors',
    description: 'Main doors, room doors, and designer flush shutters.',
    image: '/products/categories/doors.jpg',
    video: '/products/categories/doors.mp4',
    subcategories: [
      { id: 'main-door', name: 'Main Door' },
      { id: 'room-door', name: 'Room Door' },
      { id: 'flush', name: 'Flush Door' },
    ],
  },
  {
    id: 'handles',
    name: 'Handles',
    description:
      'Designer shutter and door handles — sculpted, pull, and pair sets for wardrobes, temples, and doors.',
    image: '/products/categories/handles.jpg',
    customizable: false,
    subcategories: [
      { id: 'sculpted', name: 'Sculpted' },
      { id: 'pull', name: 'Pull Handles' },
      { id: 'knob', name: 'Knobs' },
      { id: 'pair-sets', name: 'Pair Sets' },
    ],
  },
  {
    id: 'sculpted-furniture',
    name: 'Sculpted Furniture',
    description:
      'Statement art furniture and sculptures — dining tables, consoles, pedestals, lamps, and outdoor pieces. Confirm finish and size on WhatsApp.',
    caption: 'Art furniture · Made to order',
    image: '/products/categories/sculpted-furniture.jpg',
    video: '/products/categories/sculpted-furniture.mp4',
    customizable: false,
    subcategories: [
      { id: 'dining-table', name: 'Dining Table' },
      { id: 'console', name: 'Console' },
      { id: 'coffee-table', name: 'Coffee Table' },
      { id: 'pedestal', name: 'Pedestal & Vessel' },
      { id: 'sculpture', name: 'Sculpture' },
      { id: 'lighting', name: 'Lighting' },
    ],
  },
  {
    id: 'live-edge-furniture',
    name: 'Live Edge Furniture',
    description:
      'Indonesian imported solid teak live-edge furniture — each piece is natural and one-of-a-kind.',
    caption: 'Indonesian teak · Natural · Unique piece',
    conceptNote:
      'Live Edge Furniture is imported Indonesian solid teak. Every piece is a natural product — grain, shape, and size are unique, so the same piece is not repeatable. For exact size and availability, ask and confirm on WhatsApp before you order.',
    image: '/products/categories/live-edge-furniture.jpg',
    video: '/products/categories/live-edge-furniture.mp4',
    customizable: false,
    subcategories: [
      { id: 'seaters', name: 'Seaters' },
      { id: 'consoles', name: 'Consoles' },
      { id: 'centre-tables', name: 'Centre Tables' },
      { id: 'ball-stools', name: 'Ball Stools' },
      { id: 'basins', name: 'Basins' },
    ],
  },
  {
    id: 'silaibunai',
    name: 'Silai Bunai',
    description:
      'Custom silai bunai — upholstery, cushion stitch work, and soft furnishing finishes.',
    image: '/products/categories/silaibunai.jpg',
    video: '/products/categories/silaibunai.mp4',
    subcategories: [
      { id: 'sofa-upholstery', name: 'Sofa Upholstery' },
      { id: 'cushions', name: 'Cushions & Covers' },
      { id: 'custom-stitch', name: 'Custom Stitch' },
    ],
  },
]

export const baseProducts: Product[] = [
]

/** Effective minimum order quantity for a product (commercials default to 10). */
export function getMinOrderQuantity(product: Product): number {
  if (product.minOrderQuantity && product.minOrderQuantity > 1) {
    return product.minOrderQuantity
  }
  const category = getCategory(product.categoryId)
  return category?.minOrderQuantity && category.minOrderQuantity > 1
    ? category.minOrderQuantity
    : 1
}

/** Live Edge and similar fixed pieces — no Customise & Price */
export function isProductCustomizable(product: Pick<Product, 'categoryId'>): boolean {
  const category = getCategory(product.categoryId)
  return category?.customizable !== false
}

export { formatPrice } from '../lib/currency'

export function getCategory(id: string) {
  return categories.find((c) => c.id === id)
}

export function getSubcategory(categoryId: string, subcategoryId: string) {
  return getCategory(categoryId)?.subcategories.find((s) => s.id === subcategoryId)
}
