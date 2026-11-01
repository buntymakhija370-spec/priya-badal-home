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
  /** Optional category film from Drive product videos */
  video?: string
  videoPoster?: string
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
  /** Optional product film from Drive */
  video?: string
  videoPoster?: string
}

export const BOXBHANDAAR_CATEGORIES: BoxCategory[] = [
  {
    id: 'gift-crates',
    name: 'Gift Crates',
    short: 'Handled crates ready to fill.',
    description:
      'Slatted wooden crates with fabric or jute handles — styled for festive and lifestyle gifting.',
    image: '/boxbhandaar/categories/gift-crates.jpg',
    video: '/boxbhandaar/product-videos/pastel-cutout-crates.mp4',
    videoPoster: '/boxbhandaar/product-videos/pastel-cutout-crates.jpg',
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
    short: 'Nesting trays and gift trays.',
    description:
      'Nesting tray sets and handled trays for table and coffee fills.',
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
      'Mail & key racks, tall bins, and bedside catch-alls for daily order.',
    image: '/boxbhandaar/categories/organizers.jpg',
  },
  {
    id: 'planters',
    name: 'Planters',
    short: 'Tabletop green boxes.',
    description:
      'Narrow slatted planters sized for succulents and small pots.',
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

/** Hero product — Drive festive video (pastel cutout crates) */
export const BOXBHANDAAR_HERO_PRODUCT_ID = 'pastel-cutout-crates'

/** One product per Drive photograph — images normalized to 4:5 JPEG */
export const BOXBHANDAAR_PRODUCTS: BoxProduct[] = [
  {
    id: 'stripe-patchwork-carrier',
    name: "Stripe Patchwork Carrier",
    categoryId: 'carriers',
    short: "Terracotta stripe tote, patchwork handle.",
    description:
      "Tall slatted carrier in terracotta, charcoal, and beige stripes with a stitched patchwork fabric handle \u2014 styled for upright lifestyle fills.",
    size: "Tall vertical carrier",
    finish: "Terracotta \u00b7 charcoal \u00b7 beige",
    price: 1299,
    image: '/boxbhandaar/products/stripe-patchwork-carrier.jpg',
  },
  {
    id: 'sand-patchwork-carrier',
    name: "Sand Patchwork Carrier",
    categoryId: 'carriers',
    short: "Warm sand finish, patchwork strap.",
    description:
      "Tall sand-tone slatted carrier with a colourful patchwork fabric handle \u2014 clean studio look for gifting and storage.",
    size: "Tall vertical carrier",
    finish: "Sand wood \u00b7 patchwork handle",
    price: 1299,
    image: '/boxbhandaar/products/sand-patchwork-carrier.jpg',
  },
  {
    id: 'sage-leaf-carrier',
    name: "Sage Leaf Carrier",
    categoryId: 'carriers',
    short: "Sage slats, leaf-print handle.",
    description:
      "Tall sage slatted carrier with a light fabric handle printed with green leaf motifs \u2014 upright festive fills.",
    size: "Tall vertical carrier",
    finish: "Sage \u00b7 leaf-print handle",
    price: 1299,
    image: '/boxbhandaar/products/sage-leaf-carrier.jpg',
  },
  {
    id: 'sage-leather-handle-crate',
    name: "Sage Leather-Handle Crate",
    categoryId: 'gift-crates',
    short: "Square sage crate, dark leather handle.",
    description:
      "Compact square sage crate with a thick dark leather-look handle and brass rivets \u2014 sized for coffee and jar fills.",
    size: "10\" \u00d7 8\" \u00d7 4\"",
    finish: "Sage \u00b7 dark leather handle",
    price: 999,
    image: '/boxbhandaar/products/sage-leather-handle-crate.jpg',
  },
  {
    id: 'sage-botanical-carrier',
    name: "Sage Botanical Carrier",
    categoryId: 'carriers',
    short: "Sage tote with botanical strap.",
    description:
      "Tall sage carrier with a cream botanical-print fabric strap \u2014 upright gift presentation.",
    size: "Tall vertical carrier",
    finish: "Sage \u00b7 botanical strap",
    price: 1299,
    image: '/boxbhandaar/products/sage-botanical-carrier.jpg',
  },
  {
    id: 'espresso-festive-carrier',
    name: "Espresso Festive Carrier",
    categoryId: 'carriers',
    short: "Dark wood tote, vivid strap.",
    description:
      "Tall espresso-brown slatted carrier with a bright multi-colour fabric handle \u2014 snack and bottle ready.",
    size: "Tall vertical carrier",
    finish: "Espresso wood \u00b7 festive strap",
    price: 1399,
    image: '/boxbhandaar/products/espresso-festive-carrier.jpg',
  },
  {
    id: 'dual-handle-sage-crate',
    name: "Dual-Handle Sage Crate",
    categoryId: 'gift-crates',
    short: "Wide sage crate, twin cream handles.",
    description:
      "Wide low sage crate with two long cream fabric handles \u2014 made for larger gift box fills.",
    size: "Wide handled crate",
    finish: "Sage \u00b7 cream handles",
    price: 1199,
    image: '/boxbhandaar/products/dual-handle-sage-crate.jpg',
  },
  {
    id: 'acrylic-lid-box',
    name: "Acrylic Lid Gift Box",
    categoryId: 'gift-boxes',
    short: "Clear lid, sage frame \u00b7 12\u00d79\u00d74.",
    description:
      "Slatted sage gift box with a flush clear acrylic lid \u2014 show the fill without opening. Detail shots cover lid, feet, and slatted sides.",
    size: "12\" \u00d7 9\" \u00d7 4\"",
    finish: "Sage green \u00b7 acrylic lid",
    price: 1399,
    image: '/boxbhandaar/products/acrylic-lid-box.jpg',
  },
  {
    id: 'sliding-dryfruit-box',
    name: "Sliding Dry Fruit Box",
    categoryId: 'gift-boxes',
    short: "Slide lid, four nut cells.",
    description:
      "Rectangular sage box with a sliding lid and four compartments \u2014 made for nuts and dry fruit gifting.",
    size: "11\" \u00d7 7.5\" \u00d7 3\"",
    finish: "Sage green \u00b7 sliding lid",
    price: 999,
    image: '/boxbhandaar/products/sliding-dryfruit-box.jpg',
  },
  {
    id: 'pastel-cutout-crates',
    name: "Pastel Cutout Crates",
    categoryId: 'gift-crates',
    short: "Sage & lavender \u00b7 cream handles.",
    description:
      "Slatted cutout-handle crates in soft sage and lavender with cream woven handles \u2014 our hero gift crate, filmed for festive fills.",
    size: "12\" \u00d7 10\" \u00d7 3.5\"",
    finish: "Sage / lavender \u00b7 cream handles",
    price: 1499,
    image: '/boxbhandaar/products/pastel-cutout-crates.jpg',
    video: '/boxbhandaar/product-videos/pastel-cutout-crates.mp4',
    videoPoster: '/boxbhandaar/product-videos/pastel-cutout-crates.jpg',
  },
  {
    id: 'festive-mithai-tray',
    name: "Festive Mithai Tray",
    categoryId: 'gift-boxes',
    short: "Four cells \u00b7 gold ribbon ready.",
    description:
      "Square sage compartment tray for mithai and dry fruit \u2014 ribbon-friendly edges and clean compartment walls.",
    size: "9\" \u00d7 9\" \u00d7 3\"",
    finish: "Sage green",
    price: 899,
    image: '/boxbhandaar/products/festive-mithai-tray.jpg',
  },
  {
    id: 'nesting-tray-set',
    name: "Nesting Tray Set",
    categoryId: 'trays',
    short: "Three sage trays that nest.",
    description:
      "Set of three nesting slatted trays in sage \u2014 large, medium, and small \u2014 for table styling and compact storage.",
    size: "14\u00d710 \u00b7 12\u00d78 \u00b7 10\u00d76",
    finish: "Sage green set of 3",
    price: 1899,
    image: '/boxbhandaar/products/nesting-tray-set.jpg',
  },
  {
    id: 'wine-bottle-carrier',
    name: "Wine Bottle Carrier",
    categoryId: 'carriers',
    short: "Two-bottle maroon tote.",
    description:
      "Divided maroon wood carrier for bottles, with a woven festive strap handle and brass studs.",
    size: "11\" \u00d7 8.5\" \u00d7 3.5\" (carrier body)",
    finish: "Maroon \u00b7 woven handle",
    price: 1599,
    image: '/boxbhandaar/products/wine-bottle-carrier.jpg',
  },
  {
    id: 'lavender-square-crate',
    name: "Lavender Square Crate",
    categoryId: 'gift-crates',
    short: "Soft lavender, fabric handle.",
    description:
      "Square lavender crate with a patterned fabric handle \u2014 for spa, fragrance, and home fills.",
    size: "10\" \u00d7 10\" \u00d7 4\"",
    finish: "Lavender \u00b7 fabric handle",
    price: 1199,
    image: '/boxbhandaar/products/lavender-square-crate.jpg',
  },
  {
    id: 'flatpack-maroon-hamper',
    name: "Flat-Pack Maroon Hamper",
    categoryId: 'gift-crates',
    short: "Ships flat. Ribbon lock.",
    description:
      "Interlocking maroon slat box that ships flat \u2014 assemble with slotted corners and festive ribbon through grommets.",
    size: "Assembles to gift hamper",
    finish: "Maroon wood \u00b7 fabric ribbon",
    price: 1499,
    image: '/boxbhandaar/products/flatpack-maroon-hamper.jpg',
  },
  {
    id: 'sage-mithai-lid-box',
    name: "Sage Mithai Lid Box",
    categoryId: 'gift-crates',
    short: "Gold-lined lid box for sweets.",
    description:
      "Sage slatted lid box with gold lining and clasp \u2014 styled with mithai, marigolds, and diyas.",
    size: "Lidded festive box",
    finish: "Sage \u00b7 gold lining",
    price: 1299,
    image: '/boxbhandaar/products/sage-mithai-lid-box.jpg',
  },
  {
    id: 'sky-chill-crate',
    name: "Sky Chill Crate",
    categoryId: 'gift-crates',
    short: "Pale blue crate for bottles.",
    description:
      "Soft sky-blue slatted crate styled as a chill bucket for bottled drinks \u2014 festive table piece.",
    size: "Medium open crate",
    finish: "Sky blue",
    price: 1099,
    image: '/boxbhandaar/products/sky-chill-crate.jpg',
  },
  {
    id: 'blush-dryfruit-crate',
    name: "Blush Dry Fruit Crate",
    categoryId: 'gift-crates',
    short: "Pale pink crate for dry fruit.",
    description:
      "Blush-pink slatted crate filled with dry-fruit packs \u2014 soft festive colourway.",
    size: "Medium open crate",
    finish: "Blush pink",
    price: 1099,
    image: '/boxbhandaar/products/blush-dryfruit-crate.jpg',
  },
  {
    id: 'sage-puja-lid-box',
    name: "Sage Puja Lid Box",
    categoryId: 'gift-crates',
    short: "Lid box for thali & ritual fills.",
    description:
      "Sage lid box styled with a silver puja thali, flowers, and incense \u2014 ritual and festive gifting.",
    size: "Lidded festive box",
    finish: "Sage \u00b7 gold lining",
    price: 1299,
    image: '/boxbhandaar/products/sage-puja-lid-box.jpg',
  },
  {
    id: 'mini-blush-hamper',
    name: "Mini Blush Hamper",
    categoryId: 'gift-crates',
    short: "Small pink crate, ribbon tie.",
    description:
      "Compact blush crate with cream ribbon \u2014 for candles, mini jars, and petite fills.",
    size: "Mini open crate",
    finish: "Blush pink \u00b7 cream ribbon",
    price: 799,
    image: '/boxbhandaar/products/mini-blush-hamper.jpg',
  },
  {
    id: 'sage-lid-box-studio',
    name: "Sage Lid Box Studio",
    categoryId: 'gift-crates',
    short: "Eight looks, one lid box.",
    description:
      "Studio collage of the sage lid box across fills and angles \u2014 the versatile festive lid piece.",
    size: "Lidded festive box",
    finish: "Sage \u00b7 gold lining",
    price: 1299,
    image: '/boxbhandaar/products/sage-lid-box-studio.jpg',
  },
  {
    id: 'pastel-stripe-carrier',
    name: "Pastel Stripe Carrier",
    categoryId: 'carriers',
    short: "Pink-blue-green stripe tote.",
    description:
      "Tall pastel-striped slatted carrier with a top handle \u2014 snack-ready upright hamper.",
    size: "Tall vertical carrier",
    finish: "Pastel multi-stripe",
    price: 1299,
    image: '/boxbhandaar/products/pastel-stripe-carrier.jpg',
  },
  {
    id: 'terracotta-weave-crate',
    name: "Terracotta Weave Crate",
    categoryId: 'gift-crates',
    short: "Terracotta with woven side detail.",
    description:
      "Terracotta wooden crate with basket-weave side panels \u2014 warm earthy gift base.",
    size: "Medium open crate",
    finish: "Terracotta \u00b7 weave detail",
    price: 1199,
    image: '/boxbhandaar/products/terracotta-weave-crate.jpg',
  },
  {
    id: 'mithai-compartment-box',
    name: "Mithai Compartment Box",
    categoryId: 'gift-boxes',
    short: "Four equal sweet cells \u00b7 10\u00d710.",
    description:
      "Low square sage box with four compartments for mithai and dry fruit \u2014 clean feet, matte finish.",
    size: "10\" \u00d7 10\" \u00d7 2.5\"",
    finish: "Sage green",
    price: 899,
    image: '/boxbhandaar/products/mithai-compartment-box.jpg',
  },
  {
    id: 'bedside-catch-all-tray',
    name: "Bedside Catch-All Tray",
    categoryId: 'organizers',
    short: "Butter yellow \u00b7 recycled MDF.",
    description:
      "Shallow bedside tray in butter yellow (sage accent option) \u2014 glasses, keys, and nightly essentials. Made from recycled MDF strips.",
    size: "10\" \u00d7 7\" \u00d7 2\"",
    finish: "Butter yellow / sage accent",
    price: 799,
    image: '/boxbhandaar/products/bedside-catch-all-tray.jpg',
  },
  {
    id: 'coffee-gift-crate',
    name: "Coffee Gift Crate",
    categoryId: 'trays',
    short: "Sage tray, denim handles \u00b7 10\u00d78.",
    description:
      "Compact sage tray with dark blue fabric handles \u2014 sized for a coffee mug set and jars.",
    size: "10\" \u00d7 8\" \u00d7 3\"",
    finish: "Sage \u00b7 denim handles",
    price: 999,
    image: '/boxbhandaar/products/coffee-gift-crate.jpg',
  },
  {
    id: 'mini-blush-angles',
    name: "Mini Blush Crate Set View",
    categoryId: 'gift-crates',
    short: "Six angles of the mini blush.",
    description:
      "Six-angle studio view of the mini blush crate \u2014 front, back, sides, top, and three-quarter.",
    size: "Mini open crate",
    finish: "Blush pink",
    price: 799,
    image: '/boxbhandaar/products/mini-blush-angles.jpg',
  },
  {
    id: 'tall-patchwork-carrier',
    name: "Tall Patchwork Carrier",
    categoryId: 'carriers',
    short: "Sage tote, festive strap.",
    description:
      "Tall sage slatted carrier with a colourful patchwork fabric handle \u2014 upright festive fills with marigolds.",
    size: "Tall vertical crate",
    finish: "Sage \u00b7 patchwork handle",
    price: 1199,
    image: '/boxbhandaar/products/tall-patchwork-carrier.jpg',
  },
  {
    id: 'terracotta-stripe-carrier',
    name: "Terracotta Stripe Carrier",
    categoryId: 'carriers',
    short: "Terracotta-beige stripe tote.",
    description:
      "Tall terracotta and beige striped carrier with a patterned fabric handle.",
    size: "Tall vertical carrier",
    finish: "Terracotta \u00b7 beige stripe",
    price: 1299,
    image: '/boxbhandaar/products/terracotta-stripe-carrier.jpg',
  },
  {
    id: 'sage-loop-handle-crate',
    name: "Sage Loop-Handle Crate",
    categoryId: 'carriers',
    short: "Low sage crate, leather loop.",
    description:
      "Low square sage crate with a curved light leather handle \u2014 festive table styling with diyas.",
    size: "Low square carrier",
    finish: "Sage \u00b7 leather loop",
    price: 1099,
    image: '/boxbhandaar/products/sage-loop-handle-crate.jpg',
  },
  {
    id: 'sage-blush-stripe-carrier',
    name: "Sage Blush Stripe Carrier",
    categoryId: 'carriers',
    short: "Sage and blush vertical tote.",
    description:
      "Tall carrier with sage and muted blush slats \u2014 wrapped gift presentation.",
    size: "Tall vertical carrier",
    finish: "Sage \u00b7 blush stripe",
    price: 1299,
    image: '/boxbhandaar/products/sage-blush-stripe-carrier.jpg',
  },
  {
    id: 'natural-workshop-carrier',
    name: "Natural Workshop Carrier",
    categoryId: 'carriers',
    short: "Raw wood, white strap.",
    description:
      "Natural unfinished slatted carrier with a simple white strap handle \u2014 workshop and raw-wood look.",
    size: "Square slatted carrier",
    finish: "Natural wood \u00b7 white strap",
    price: 999,
    image: '/boxbhandaar/products/natural-workshop-carrier.jpg',
  },
  {
    id: 'tall-storage-bin',
    name: "Tall Storage Bin",
    categoryId: 'organizers',
    short: "20\" bin for mats & umbrellas.",
    description:
      "Tall square sage slatted bin with cream woven handles \u2014 holds yoga mats, umbrellas, and tall home gear.",
    size: "8\" \u00d7 8\" \u00d7 20\"",
    finish: "Sage \u00b7 cream handles",
    price: 1499,
    image: '/boxbhandaar/products/tall-storage-bin.jpg',
  },
  {
    id: 'mail-key-organizer',
    name: "Mail & Key Organizer",
    categoryId: 'organizers',
    short: "Wall rack with brass hooks.",
    description:
      "Wall-mounted sage mail pocket with antique brass hooks for keys and entryway accessories.",
    size: "Wall mail & key rack",
    finish: "Sage \u00b7 brass hooks",
    price: 1299,
    image: '/boxbhandaar/products/mail-key-organizer.jpg',
  },
  {
    id: 'workshop-caddy',
    name: "Workshop Caddy",
    categoryId: 'organizers',
    short: "Handled caddy for tools & bits.",
    description:
      "Classic handled wooden caddy with internal compartments \u2014 hardware, stationery, or craft fills.",
    size: "Handled utility caddy",
    finish: "Natural MDF / wood",
    price: 999,
    image: '/boxbhandaar/products/workshop-caddy.jpg',
  },
  {
    id: 'desk-card-pen-tray',
    name: "Desk Card & Pen Tray",
    categoryId: 'workspace',
    short: "Low desk tray for cards & pens.",
    description:
      "Low-profile natural wood desktop tray with sections for business cards and pens.",
    size: "Desktop tray",
    finish: "Natural board",
    price: 699,
    image: '/boxbhandaar/products/desk-card-pen-tray.jpg',
  },
  {
    id: 'device-charging-dock',
    name: "Device Charging Dock",
    categoryId: 'workspace',
    short: "Phone + tablet stand.",
    description:
      "Wedge charging dock for phone and tablet with cable management \u2014 compact desk piece.",
    size: "Dual-device dock",
    finish: "Natural board",
    price: 799,
    image: '/boxbhandaar/products/device-charging-dock.jpg',
  },
  {
    id: 'desk-file-organizer',
    name: "Desk File Organizer",
    categoryId: 'workspace',
    short: "Tiered papers & folders.",
    description:
      "Angled sage desk organizer with letter slots and side handles \u2014 calm desk storage.",
    size: "Desktop file rack",
    finish: "Sage green",
    price: 999,
    image: '/boxbhandaar/products/desk-file-organizer.jpg',
  },
  {
    id: 'magazine-book-rack',
    name: "Magazine & Book Rack",
    categoryId: 'workspace',
    short: "Handled A-frame rack \u00b7 14\u00d78\u00d712.",
    description:
      "Portable sage magazine and book rack with top handle and slatted sides.",
    size: "14\" \u00d7 8\" \u00d7 12\"",
    finish: "Sage green",
    price: 1299,
    image: '/boxbhandaar/products/magazine-book-rack.jpg',
  },
  {
    id: 'slate-book-organizer',
    name: "Slate Book Organizer",
    categoryId: 'workspace',
    short: "Muted grey-green book rack.",
    description:
      "Desktop book and magazine organizer in muted grey-green \u2014 soft workspace colourway.",
    size: "Desktop book rack",
    finish: "Slate sage",
    price: 999,
    image: '/boxbhandaar/products/slate-book-organizer.jpg',
  },
  {
    id: 'succulent-planter',
    name: "Succulent Planter",
    categoryId: 'planters',
    short: "Narrow tabletop planter \u00b7 10\u00d74\u00d73.",
    description:
      "Long narrow sage planter on small feet \u2014 sized for three small pots or a short herb line.",
    size: "10\" \u00d7 4\" \u00d7 3\"",
    finish: "Sage green",
    price: 699,
    image: '/boxbhandaar/products/succulent-planter.jpg',
  },
]

export type BoxFilm = {
  id: string
  title: string
  caption: string
  src: string
  poster: string
  productId?: string
}

export const BOXBHANDAAR_FILMS: BoxFilm[] = [
  {
    id: 'pastel-crates',
    title: 'Pastel crates',
    caption: 'Festive cutout crates in sage & lavender.',
    src: '/boxbhandaar/product-videos/pastel-cutout-crates.mp4',
    poster: '/boxbhandaar/product-videos/pastel-cutout-crates.jpg',
    productId: 'pastel-cutout-crates',
  },
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

/** All Drive product videos currently wired into the catalogue */
export function getProductVideos() {
  return BOXBHANDAAR_PRODUCTS.filter((p) => p.video).map((p) => ({
    productId: p.id,
    name: p.name,
    src: p.video!,
    poster: p.videoPoster ?? p.image,
  }))
}

export function getBoxCategory(id: string) {
  return BOXBHANDAAR_CATEGORIES.find((c) => c.id === id)
}

export function getBoxProduct(id: string) {
  return BOXBHANDAAR_PRODUCTS.find((p) => p.id === id)
}

export function getHeroProduct() {
  return getBoxProduct(BOXBHANDAAR_HERO_PRODUCT_ID) ?? BOXBHANDAAR_PRODUCTS[0]
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
