/** Boxbhandaar — standalone festive & lifestyle boxes catalogue */

export const BOXBHANDAAR_BRAND = 'Boxbhandaar'
export const BOXBHANDAAR_TAGLINE = 'Boxes with a point of view.'
export const BOXBHANDAAR_WA_NUMBER = '918109949649'
export const BOXBHANDAAR_WA_DISPLAY = '+91 81099 49649'

export type BoxCategoryId =
  | 'gift-crates'
  | 'gift-boxes'
  | 'trays'
  | 'carriers'
  | 'organizers'
  | 'planters'
  | 'workspace'

export type BoxCategory = {
  id: BoxCategoryId
  name: string
  short: string
  description: string
  image: string
}

export type BoxProduct = {
  id: string
  name: string
  categoryId: BoxCategoryId
  short: string
  description: string
  size: string
  finish: string
  price: number
  image: string
}

export const BOXBHANDAAR_CATEGORIES: BoxCategory[] = [
  {
    id: 'gift-crates',
    name: 'Gift Crates',
    short: 'Handled crates ready to fill.',
    description:
      'Slatted wooden crates with fabric or jute handles — styled for festive and lifestyle gifting.',
    image: '/boxbhandaar/categories/gift-crates.jpg',
  },
  {
    id: 'gift-boxes',
    name: 'Gift Boxes',
    short: 'Lidded & compartment boxes.',
    description:
      'Acrylic-lid hampers, mithai trays, and sliding dry-fruit boxes for curated fills.',
    image: '/boxbhandaar/categories/gift-boxes.jpg',
  },
  {
    id: 'trays',
    name: 'Trays',
    short: 'Thalis and nesting trays.',
    description:
      'Segmented festive thalis and nesting tray sets for table and ritual moments.',
    image: '/boxbhandaar/categories/trays.jpg',
  },
  {
    id: 'carriers',
    name: 'Carriers',
    short: 'Tall totes and bottle carriers.',
    description:
      'Wine carriers and tall handled boxes made to move gifts with presence.',
    image: '/boxbhandaar/categories/carriers.jpg',
  },
  {
    id: 'organizers',
    name: 'Organizers',
    short: 'Entryway and home storage.',
    description:
      'Mail & key racks, tall bins, and stackable utility crates for daily order.',
    image: '/boxbhandaar/categories/organizers.jpg',
  },
  {
    id: 'planters',
    name: 'Planters',
    short: 'Tabletop green boxes.',
    description: 'Narrow slatted planters sized for succulents and small pots.',
    image: '/boxbhandaar/categories/planters.jpg',
  },
  {
    id: 'workspace',
    name: 'Workspace',
    short: 'Desk and study pieces.',
    description:
      'File organizers, magazine racks, and charging docks for a calm desk.',
    image: '/boxbhandaar/categories/workspace.jpg',
  },
]

/** 18 products curated from Drive photographs */
export const BOXBHANDAAR_PRODUCTS: BoxProduct[] = [
  {
    id: 'handled-festive-tray',
    name: 'Handled Festive Tray',
    categoryId: 'gift-crates',
    short: '12×10 crate with woven handles.',
    description:
      'Rectangular slatted gift tray with cream woven handles and brass studs. Styled for festive fills — available look in sage and lavender.',
    size: '12" × 10" × 3.5"',
    finish: 'Sage / lavender wood',
    price: 1299,
    image: '/boxbhandaar/products/handled-festive-tray.jpg',
  },
  {
    id: 'coffee-gift-crate',
    name: 'Coffee Gift Crate',
    categoryId: 'gift-crates',
    short: 'Sage crate, denim handles.',
    description:
      'Compact slatted crate with blue denim strap handles and brass rivets — sized for a coffee mug set and jars.',
    size: '10" × 8" × 4"',
    finish: 'Sage green · denim handles',
    price: 999,
    image: '/boxbhandaar/products/coffee-gift-crate.jpg',
  },
  {
    id: 'lavender-square-crate',
    name: 'Lavender Square Crate',
    categoryId: 'gift-crates',
    short: 'Soft lavender, jute handles.',
    description:
      'Square slatted crate in matte lavender with thick jute handles — for fragrance, candle, and home fills.',
    size: '10" × 10" × 3"',
    finish: 'Lavender wood · jute handles',
    price: 1199,
    image: '/boxbhandaar/products/lavender-square-crate.jpg',
  },
  {
    id: 'flatpack-maroon-hamper',
    name: 'Flat-Pack Maroon Hamper',
    categoryId: 'gift-crates',
    short: 'Ships flat. Ribbon lock.',
    description:
      'Interlocking maroon slat box that ships flat — assemble with slotted corners and festive herringbone ribbon through metal grommets.',
    size: '12" × 12" × 5"',
    finish: 'Maroon wood · fabric ribbon',
    price: 1499,
    image: '/boxbhandaar/products/flatpack-maroon-hamper.jpg',
  },
  {
    id: 'acrylic-lid-box',
    name: 'Acrylic Lid Gift Box',
    categoryId: 'gift-boxes',
    short: 'Clear lid, sage frame.',
    description:
      'Slatted sage gift box with a flush clear acrylic lid — show the fill without opening.',
    size: '12" × 9" × 4"',
    finish: 'Sage green · acrylic lid',
    price: 1399,
    image: '/boxbhandaar/products/acrylic-lid-box.jpg',
  },
  {
    id: 'mithai-compartment-box',
    name: 'Mithai Compartment Box',
    categoryId: 'gift-boxes',
    short: 'Four equal sweet cells.',
    description:
      'Low square box with four compartments for mithai and dry fruit — clean feet, matte sage finish.',
    size: '10" × 10" × 2.5"',
    finish: 'Sage green',
    price: 899,
    image: '/boxbhandaar/products/mithai-compartment-box.jpg',
  },
  {
    id: 'sliding-dryfruit-box',
    name: 'Sliding Dry Fruit Box',
    categoryId: 'gift-boxes',
    short: 'Slide lid, four nut cells.',
    description:
      'Rectangular sage box with a sliding lid and four compartments — made for nuts and dry fruit gifting.',
    size: '10" × 6" × 3"',
    finish: 'Sage green · sliding lid',
    price: 999,
    image: '/boxbhandaar/products/sliding-dryfruit-box.jpg',
  },
  {
    id: 'segmented-thali-tray',
    name: 'Segmented Thali Tray',
    categoryId: 'trays',
    short: '12" festive thali, gold rim.',
    description:
      'Shallow segmented thali tray with gold-toned edges — round and octagonal looks in sage, peach, gold, and cream.',
    size: '12" diameter · 1.5" deep',
    finish: 'Sage / peach / gold / cream',
    price: 1099,
    image: '/boxbhandaar/products/segmented-thali-tray.jpg',
  },
  {
    id: 'nesting-tray-set',
    name: 'Nesting Tray Set',
    categoryId: 'trays',
    short: 'Three sage trays that nest.',
    description:
      'Set of three nesting slatted trays in sage — large, medium, and small — for table styling and compact storage.',
    size: '14×10 · 12×8 · 10×6',
    finish: 'Sage green set of 3',
    price: 1899,
    image: '/boxbhandaar/products/nesting-tray-set.jpg',
  },
  {
    id: 'wine-bottle-carrier',
    name: 'Wine Bottle Carrier',
    categoryId: 'carriers',
    short: 'Two-bottle maroon tote.',
    description:
      'Divided maroon wood carrier for two bottles, with a woven cream-and-red strap handle and brass studs.',
    size: '14" × 7" × 5"',
    finish: 'Maroon · woven handle',
    price: 1599,
    image: '/boxbhandaar/products/wine-bottle-carrier.jpg',
  },
  {
    id: 'tall-patchwork-carrier',
    name: 'Tall Patchwork Carrier',
    categoryId: 'carriers',
    short: 'Vertical crate, festive strap.',
    description:
      'Tall sage slatted carrier with a colourful patchwork fabric handle — made for upright festive fills.',
    size: 'Tall vertical crate',
    finish: 'Sage · patchwork handle',
    price: 1199,
    image: '/boxbhandaar/products/tall-patchwork-carrier.jpg',
  },
  {
    id: 'mail-key-organizer',
    name: 'Mail & Key Organizer',
    categoryId: 'organizers',
    short: 'Wall rack with five hooks.',
    description:
      'Wall-mounted olive mail pocket with five antique brass hooks for keys and entryway accessories.',
    size: '12" × 5" × 4"',
    finish: 'Olive · brass hooks',
    price: 1299,
    image: '/boxbhandaar/products/mail-key-organizer.jpg',
  },
  {
    id: 'tall-storage-bin',
    name: 'Tall Storage Bin',
    categoryId: 'organizers',
    short: '20" bin for mats & umbrellas.',
    description:
      'Tall square slatted bin with cream woven handles — holds yoga mats, umbrellas, and tall home gear.',
    size: '8" × 8" × 20"',
    finish: 'Sage · cream handles',
    price: 1499,
    image: '/boxbhandaar/products/tall-storage-bin.jpg',
  },
  {
    id: 'stackable-utility-crates',
    name: 'Stackable Utility Crates',
    categoryId: 'organizers',
    short: 'Cutout-handle stacking crates.',
    description:
      'Natural-finish slatted crates with oval cutout handles — stack clean for storage and gifting bases.',
    size: 'Stackable set',
    finish: 'Natural wood tone',
    price: 1699,
    image: '/boxbhandaar/products/stackable-utility-crates.jpg',
  },
  {
    id: 'succulent-planter',
    name: 'Succulent Planter',
    categoryId: 'planters',
    short: 'Narrow tabletop planter.',
    description:
      'Long narrow sage planter on small feet — sized for three small pots or a short herb line.',
    size: '10" × 4" × 3"',
    finish: 'Sage green',
    price: 699,
    image: '/boxbhandaar/products/succulent-planter.jpg',
  },
  {
    id: 'desk-file-organizer',
    name: 'Desk File Organizer',
    categoryId: 'workspace',
    short: 'Tiered papers & folders.',
    description:
      'Angled desk organizer with front letter slots and a wide rear file pocket — light wood finish.',
    size: 'Desktop file rack',
    finish: 'Natural MDF / wood',
    price: 999,
    image: '/boxbhandaar/products/desk-file-organizer.jpg',
  },
  {
    id: 'magazine-book-rack',
    name: 'Magazine & Book Rack',
    categoryId: 'workspace',
    short: 'A-frame rack from waste HDHMR.',
    description:
      'Portable A-frame magazine and book rack in sage — made from waste HDHMR strips with simple joinery.',
    size: '14" × 8" × 12"',
    finish: 'Sage · waste HDHMR',
    price: 1299,
    image: '/boxbhandaar/products/magazine-book-rack.jpg',
  },
  {
    id: 'device-charging-dock',
    name: 'Device Charging Dock',
    categoryId: 'workspace',
    short: 'Phone + tablet stand.',
    description:
      'Wedge charging dock for phone and tablet with a front cable groove — compact desk piece.',
    size: 'Dual-device dock',
    finish: 'Natural board',
    price: 799,
    image: '/boxbhandaar/products/device-charging-dock.jpg',
  },
]

export const BOXBHANDAAR_FILMS = [
  {
    id: 'wrap',
    title: 'The wrap',
    caption: 'Paper, fold, pause.',
    src: '/boxbhandaar/videos/film-wrap.mp4',
    poster: '/boxbhandaar/videos/film-wrap.jpg',
  },
  {
    id: 'fold',
    title: 'The fold',
    caption: 'Edges that hold.',
    src: '/boxbhandaar/videos/film-fold.mp4',
    poster: '/boxbhandaar/videos/film-fold.jpg',
  },
  {
    id: 'detail',
    title: 'The detail',
    caption: 'Ribbon, close.',
    src: '/boxbhandaar/videos/film-detail.mp4',
    poster: '/boxbhandaar/videos/film-detail.jpg',
  },
]

export function getBoxCategory(id: string) {
  return BOXBHANDAAR_CATEGORIES.find((c) => c.id === id)
}

export function getBoxProduct(id: string) {
  return BOXBHANDAAR_PRODUCTS.find((p) => p.id === id)
}

export function getProductsByCategory(categoryId: string) {
  return BOXBHANDAAR_PRODUCTS.filter((p) => p.categoryId === categoryId)
}

export function formatBoxPrice(inr: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(inr)
}

export function boxWhatsAppUrl(product?: BoxProduct) {
  const lines = product
    ? [
        `Hi Boxbhandaar — I want to order:`,
        '',
        `Product: ${product.name}`,
        `Category: ${getBoxCategory(product.categoryId)?.name ?? product.categoryId}`,
        `Size: ${product.size}`,
        `Price: ${formatBoxPrice(product.price)}`,
        '',
        'Please confirm availability and delivery.',
      ]
    : [
        'Hi Boxbhandaar — I would like to know more about your boxes.',
        '',
        'Please share the current collection.',
      ]
  return `https://wa.me/${BOXBHANDAAR_WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`
}
