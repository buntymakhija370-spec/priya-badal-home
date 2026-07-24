export type CategoryId =
  | 'wall-panels'
  | 'kitchen'
  | 'wardrobe'
  | 'temple'
  | 'doors'
  | 'sculpted-furniture'
  | 'silaibunai'
  | 'commercials'

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
  /** Optional product videos (mp4/webm) shown in the gallery */
  videos?: string[]
  custom?: boolean
  /** Shown above the title, like Pepperfry brand line */
  brand?: string
  collection?: string
  sku?: string
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
    description: 'Feature walls, fluted panels, and decorative cladding.',
    image: '/products/categories/wall-panels.jpg',
    video: '/products/categories/wall-panels.mp4',
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
    description: 'Sliding, hinged, and walk-in wardrobes made to measure.',
    image: '/products/categories/wardrobe.jpg',
    video: '/products/categories/wardrobe.mp4',
    subcategories: [
      { id: 'sliding', name: 'Sliding' },
      { id: 'hinged', name: 'Hinged' },
      { id: 'walk-in', name: 'Walk-in' },
    ],
  },
  {
    id: 'temple',
    name: 'Temple',
    description: 'Designer home mandirs and prayer niches — made to measure.',
    image: '/products/categories/temple.jpg',
    video: '/products/categories/temple.mp4',
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
    image: '/products/categories/doors.jpg',
    video: '/products/categories/doors.mp4',
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
    image: '/products/categories/sculpted-furniture.jpg',
    video: '/products/categories/sculpted-furniture.mp4',
    subcategories: [
      { id: 'sofa', name: 'Sofa' },
      { id: 'console', name: 'Console' },
      { id: 'centre-table', name: 'Centre Table' },
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
  {
    id: 'commercials',
    name: 'Commercials',
    description:
      'Bulk apartment packages at our lowest rates — 1BHK, 2BHK & 3BHK sets for projects and builders.',
    caption: 'Lowest cost · Bulk only · Minimum 10 copies',
    conceptNote:
      'Commercials are project packs we produce in bulk at the lowest cost. We take orders only for a minimum of 10 copies of the same package — that volume lets us keep prices sharp for builders, hostels, and housing projects.',
    minOrderQuantity: 10,
    image: '/products/categories/commercials.jpg',
    video: '/products/categories/commercials.mp4',
    subcategories: [
      {
        id: '1bhk',
        name: '1BHK',
        description:
          'Compact 1BHK commercial pack — kitchen + wardrobe basics for bulk housing. Min. 10 sets.',
      },
      {
        id: '2bhk',
        name: '2BHK',
        description:
          '2BHK commercial pack — kitchen, bedroom storage, and doors for project scale. Min. 10 sets.',
      },
      {
        id: '3bhk',
        name: '3BHK',
        description:
          '3BHK commercial pack — fuller apartment set for builders at bulk rates. Min. 10 sets.',
      },
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
    brand: 'Priyabadal Homes',
    collection: 'Geometric PU',
    sku: 'PBH-GEO-PU-WR',
    description:
      'Floor-to-ceiling hinged wardrobe in matte greige PU with engraved geometric doors and gold handles. Soft-close interiors with hanging and shelf storage. Priced at ₹1,050 / sq ft · 25 mm · PU finish.',
    style: ['modern', 'luxe', 'geometric'],
    rooms: ['bedroom'],
    image: '/products/wardrobe-geo-closed.jpg',
    images: [
      '/products/wardrobe-geo-closed.jpg',
      '/products/wardrobe-geo-open.jpg',
    ],
    highlights: [
      '₹1,050 / sq ft',
      '25 mm PU shutters',
      'Hinged doors with geometric engraving',
      'Soft-close hardware',
      'Made to your wall size',
    ],
    details: [
      { label: 'Brand', value: 'Priyabadal Homes' },
      { label: 'Assembly', value: 'Carpenter Assembly (on-site)' },
      { label: 'Collection', value: 'Geometric PU' },
      { label: 'Dimensions', value: 'Made to measure — custom width × height' },
      {
        label: 'Dimensions (reference)',
        value: 'Typical floor-to-ceiling bay; share opening size in ft',
      },
      {
        label: 'Primary Material',
        value: '25 mm engineered board with matte PU finish',
      },
      { label: 'Secondary Material', value: 'Internal carcass with hanging & shelves' },
      { label: 'Product Rating', value: 'Made-to-order quality' },
      { label: 'Room Type', value: 'Bedroom' },
      { label: 'Warranty', value: "12 Months' warranty on manufacturing defects" },
      { label: 'Weight', value: 'Depends on final size' },
      { label: 'Sku', value: 'PBH-GEO-PU-WR' },
    ],
    specifications: [
      { label: 'Colour / Finish', value: 'Matte greige PU' },
      { label: 'Board Thickness', value: '25 mm' },
      { label: 'Door Type', value: 'Hinged' },
      { label: 'Number of Doors', value: 'Custom (based on width)' },
      { label: 'Storage Type', value: 'Hanging rails + adjustable shelves' },
      { label: 'Handles', value: 'Gold-tone metal handles' },
      { label: 'Hardware', value: 'Soft-close hinges' },
      { label: 'Interior Layout', value: 'Open hanging + shelf bays (customisable)' },
      { label: 'Pricing', value: 'Per sq ft (width × height)' },
      { label: 'Country of Origin', value: 'India' },
      { label: 'Care', value: 'Wipe with a soft dry cloth; avoid harsh cleaners' },
    ],
    features: [
      'Engraved geometric door pattern for a premium façade',
      'Durable 25 mm board with matte PU finish',
      'Soft-close hinged doors for quiet everyday use',
      'Flexible hanging and shelf storage layout',
      'Sized exactly to your bedroom wall or niche',
      'Low-maintenance surfaces for easy cleaning',
    ],
    disclaimer:
      'Accessories shown in images are for representation only and are not part of the product. Final colour may vary slightly from screen display. Custom sizes are confirmed before production.',
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
    brand: 'Priyabadal Homes',
    collection: 'Rose Gold Inset',
    sku: 'PBH-ROSE-PU-WR',
    description:
      'Floor-to-ceiling hinged wardrobe in matte taupe PU with rose-gold metallic inset frames, rounded capsule panels, and soft-close dark wood interiors. Priced at ₹1,500 / sq ft · 25 mm · PU finish.',
    style: ['modern', 'luxe', 'geometric'],
    rooms: ['bedroom'],
    image: '/products/wardrobe-rose-closed.png',
    images: [
      '/products/wardrobe-rose-closed.png',
      '/products/wardrobe-rose-ajar.png',
      '/products/wardrobe-rose-open.png',
    ],
    highlights: [
      '₹1,500 / sq ft',
      '25 mm PU shutters',
      'Rose-gold metallic inset frames',
      'Soft-close dark wood interiors',
      'Made to your wall size',
    ],
    details: [
      { label: 'Brand', value: 'Priyabadal Homes' },
      { label: 'Assembly', value: 'Carpenter Assembly (on-site)' },
      { label: 'Collection', value: 'Rose Gold Inset' },
      { label: 'Dimensions', value: 'Made to measure — custom width × height' },
      {
        label: 'Dimensions (reference)',
        value: 'Typical floor-to-ceiling bay; share opening size in ft',
      },
      {
        label: 'Primary Material',
        value: '25 mm engineered board with matte taupe PU',
      },
      {
        label: 'Secondary Material',
        value: 'Rose-gold metallic inset profiles; dark wood interiors',
      },
      { label: 'Product Rating', value: 'Made-to-order quality' },
      { label: 'Room Type', value: 'Bedroom' },
      { label: 'Warranty', value: "12 Months' warranty on manufacturing defects" },
      { label: 'Weight', value: 'Depends on final size' },
      { label: 'Sku', value: 'PBH-ROSE-PU-WR' },
    ],
    specifications: [
      { label: 'Colour / Finish', value: 'Matte taupe PU with rose-gold insets' },
      { label: 'Board Thickness', value: '25 mm' },
      { label: 'Door Type', value: 'Hinged' },
      { label: 'Number of Doors', value: 'Custom (based on width)' },
      { label: 'Storage Type', value: 'Hanging rails + shelves + drawers (customisable)' },
      { label: 'Accent', value: 'Rose-gold metallic inset frames' },
      { label: 'Hardware', value: 'Soft-close hinges' },
      { label: 'Interior Layout', value: 'Dark wood interiors with open & closed storage' },
      { label: 'Pricing', value: 'Per sq ft (width × height)' },
      { label: 'Country of Origin', value: 'India' },
      { label: 'Care', value: 'Wipe with a soft dry cloth; avoid harsh cleaners' },
    ],
    features: [
      'Rose-gold inset frames for a distinctive façade',
      'Rounded capsule panel detailing',
      'Durable 25 mm board with matte PU finish',
      'Soft-close hinged doors and dark wood interiors',
      'Sized exactly to your bedroom wall or niche',
      'Low-maintenance surfaces for easy cleaning',
    ],
    disclaimer:
      'Accessories shown in images are for representation only and are not part of the product. Final colour and metal tone may vary slightly from screen display. Custom sizes are confirmed before production.',
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
    id: 'modular-kitchen-showcase',
    name: 'Modular Kitchen Showcase',
    categoryId: 'kitchen',
    subcategoryId: 'modular',
    price: 189999,
    currency: 'INR',
    brand: 'Priyabadal Homes',
    collection: 'Kitchen',
    sku: 'PBH-KIT-VIDEO-01',
    description:
      'Made-to-measure modular kitchen with clean cabinetry, soft lighting, and a practical layout — see the walkthrough video for the full look.',
    style: ['modern', 'warm', 'minimal'],
    rooms: ['kitchen'],
    image: '/products/kitchen-modular-showcase.jpg',
    images: ['/products/kitchen-modular-showcase.jpg'],
    videos: ['/products/kitchen-modular-showcase.mp4'],
    highlights: [
      'Product walkthrough video',
      'Modular made-to-measure layout',
      'Customise size & finish',
      'WhatsApp quote available',
    ],
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
    id: 'arched-bell-jali-mandir',
    name: 'Arched Bell Jali Mandir',
    categoryId: 'temple',
    subcategoryId: 'floor',
    price: 72999,
    currency: 'INR',
    brand: 'Priyabadal Homes',
    collection: 'Temple',
    sku: 'PBH-TMP-01',
    description:
      'Floor-standing arched mandir in soft ivory with lattice doors, hanging brass bells, fluted drawers, and warm interior lighting.',
    style: ['modern', 'luxe', 'traditional'],
    rooms: ['puja', 'temple'],
    image: '/products/temple-1-1.jpg',
    images: [
      '/products/temple-1-1.jpg',
      '/products/temple-1-2.jpg',
      '/products/temple-1-3.jpg',
    ],
    highlights: [
      'Arched jali doors with brass bells',
      'Fluted drawer & cabinet storage',
      'Warm backlit puja niche',
      'Made to your wall height',
    ],
  },
  {
    id: 'lotus-relief-temple-doors',
    name: 'Lotus Relief Temple Doors',
    categoryId: 'temple',
    subcategoryId: 'carved',
    price: 68999,
    currency: 'INR',
    brand: 'Priyabadal Homes',
    collection: 'Temple',
    sku: 'PBH-TMP-02',
    description:
      'Statement temple doors with layered lotus relief in ivory and metallic gold, opening to a lit multi-shelf puja interior.',
    style: ['luxe', 'carved', 'modern'],
    rooms: ['puja', 'temple'],
    image: '/products/temple-2-1.jpg',
    images: ['/products/temple-2-1.jpg', '/products/temple-2-2.jpg'],
    highlights: [
      '3D lotus relief façade',
      'Gold metallic recessed detail',
      'Soft-lit deity shelves',
      'Ideal for niche or cupboard openings',
    ],
  },
  {
    id: 'sunburst-elephant-mandir',
    name: 'Sunburst Elephant Mandir',
    categoryId: 'temple',
    subcategoryId: 'floor',
    price: 89999,
    currency: 'INR',
    brand: 'Priyabadal Homes',
    collection: 'Temple',
    sku: 'PBH-TMP-03',
    description:
      'Cream-and-gold niche mandir with sunburst door grills, layered altar lighting, and carved elephant cabinet doors.',
    style: ['traditional', 'luxe', 'carved'],
    rooms: ['puja', 'temple'],
    image: '/products/temple-3-1.jpg',
    images: ['/products/temple-3-1.jpg', '/products/temple-3-2.jpg'],
    highlights: [
      'Gold sunburst door grills',
      'Multi-tier lit altar',
      'Carved elephant base doors',
      'Full niche installation',
    ],
  },
  {
    id: 'pink-lotus-arched-mandir',
    name: 'Pink Lotus Arched Mandir',
    categoryId: 'temple',
    subcategoryId: 'carved',
    price: 79999,
    currency: 'INR',
    brand: 'Priyabadal Homes',
    collection: 'Temple',
    sku: 'PBH-TMP-04',
    description:
      'Arched ivory mandir with white-on-white floral relief and sculpted pink lotus handles — a soft, modern puja centrepiece.',
    style: ['modern', 'luxe', 'carved'],
    rooms: ['puja', 'temple', 'living room'],
    image: '/products/temple-4-1.jpg',
    images: [
      '/products/temple-4-1.jpg',
      '/products/temple-4-2.jpg',
      '/products/temple-4-3.jpg',
      '/products/temple-4-4.jpg',
    ],
    highlights: [
      'Sculpted pink lotus handles',
      'White floral relief doors',
      'Arched niche fit',
      'Warm interior lighting',
    ],
  },
  {
    id: 'golden-lotus-arch-niche',
    name: 'Golden Lotus Arch Niche',
    categoryId: 'temple',
    subcategoryId: 'wall-mounted',
    price: 64999,
    currency: 'INR',
    brand: 'Priyabadal Homes',
    collection: 'Temple',
    sku: 'PBH-TMP-05',
    description:
      'Open arched puja niche with sunburst tile backdrop, champagne gold lotus centrepiece, marble altar, and storage drawers below.',
    style: ['modern', 'minimal', 'luxe'],
    rooms: ['puja', 'temple'],
    image: '/products/temple-5-1.jpg',
    images: [
      '/products/temple-5-1.jpg',
      '/products/temple-5-2.jpg',
      '/products/temple-5-3.jpg',
    ],
    highlights: [
      'Open arch niche design',
      'Gold lotus wall motif',
      'Marble altar tiers',
      'Drawer storage below',
    ],
  },
  {
    id: 'hex-jali-elephant-mandir',
    name: 'Hex Jali Elephant Mandir',
    categoryId: 'temple',
    subcategoryId: 'floor',
    price: 84999,
    currency: 'INR',
    brand: 'Priyabadal Homes',
    collection: 'Temple',
    sku: 'PBH-TMP-06',
    description:
      'Built-in white wardrobe mandir with hexagonal jali doors, carved elephants, lit interior, and drawer storage below.',
    style: ['modern', 'traditional', 'carved'],
    rooms: ['puja', 'temple', 'bedroom'],
    image: '/products/temple-6-1.jpg',
    images: ['/products/temple-6-1.jpg', '/products/temple-6-2.jpg'],
    highlights: [
      'Hexagonal jali shutters',
      'Carved elephant panels',
      'Integrated wardrobe bay',
      'Lit Ganesha niche',
    ],
  },
  {
    id: 'painted-marble-mandir-suite',
    name: 'Painted Marble Mandir Suite',
    categoryId: 'temple',
    subcategoryId: 'floor',
    price: 95999,
    currency: 'INR',
    brand: 'Priyabadal Homes',
    collection: 'Temple',
    sku: 'PBH-TMP-07',
    description:
      'Full puja room suite with hand-painted marble mandir, backlit decorative wall panel, gold leaf accents, and drawer base.',
    style: ['luxe', 'traditional', 'carved'],
    rooms: ['puja', 'temple'],
    image: '/products/temple-7-1.jpg',
    images: ['/products/temple-7-1.jpg', '/products/temple-7-2.jpg'],
    highlights: [
      'Hand-painted marble mandir',
      'Backlit feature wall',
      'Gold leaf accents',
      'Complete room composition',
    ],
  },
  {
    id: 'lotus-branch-bifold-mandir',
    name: 'Lotus Branch Bifold Mandir',
    categoryId: 'temple',
    subcategoryId: 'floor',
    price: 69999,
    currency: 'INR',
    brand: 'Priyabadal Homes',
    collection: 'Temple',
    sku: 'PBH-TMP-08',
    description:
      'Tall white bifold mandir with etched lotus-and-branch door pattern, warm interior light, and slim niche fit.',
    style: ['modern', 'minimal', 'luxe'],
    rooms: ['puja', 'temple', 'hallway'],
    image: '/products/temple-8-1.jpg',
    images: ['/products/temple-8-1.jpg', '/products/temple-8-2.jpg'],
    highlights: [
      'Bifold etched doors',
      'Lotus branch motif',
      'Warm recessed lighting',
      'Space-saving niche unit',
    ],
  },
  {
    id: 'gold-calligraphy-prayer-niche',
    name: 'Gold Calligraphy Prayer Niche',
    categoryId: 'temple',
    subcategoryId: 'wall-mounted',
    price: 74999,
    currency: 'INR',
    brand: 'Priyabadal Homes',
    collection: 'Temple',
    sku: 'PBH-TMP-09',
    description:
      'Serene prayer niche with layered wall panels, marble platform, gold calligraphy focal art, and matching seating accents.',
    style: ['modern', 'luxe', 'minimal'],
    rooms: ['puja', 'temple'],
    image: '/products/temple-9-1.jpg',
    images: ['/products/temple-9-1.jpg'],
    highlights: [
      'Panelled feature wall',
      'Marble prayer platform',
      'Gold calligraphy centrepiece',
      'Complete room styling',
    ],
  },
  {
    id: 'brushed-metal-scallop-mandir',
    name: 'Brushed Metal Scallop Mandir',
    categoryId: 'temple',
    subcategoryId: 'floor',
    price: 82999,
    currency: 'INR',
    brand: 'Priyabadal Homes',
    collection: 'Temple',
    sku: 'PBH-TMP-10',
    description:
      'Contemporary brushed-metal mandir with scalloped arched jali doors, floral lattice, and flush drawer storage below.',
    style: ['modern', 'minimal', 'luxe'],
    rooms: ['puja', 'temple'],
    image: '/products/temple-10-1.jpg',
    images: ['/products/temple-10-1.jpg', '/products/temple-10-2.jpg'],
    highlights: [
      'Brushed metal finish',
      'Scalloped arched silhouette',
      'Floral jali lattice',
      'Handle-less drawer base',
    ],
  },
  {
    id: 'wood-canopy-lotus-mandir',
    name: 'Wood Canopy Lotus Mandir',
    categoryId: 'temple',
    subcategoryId: 'wall-mounted',
    price: 71999,
    currency: 'INR',
    brand: 'Priyabadal Homes',
    collection: 'Temple',
    sku: 'PBH-TMP-11',
    description:
      'Open wall mandir with wood canopy, hanging brass bell and diyas, lotus mural backdrop, and marble-top storage cabinet.',
    style: ['warm', 'traditional', 'modern'],
    rooms: ['puja', 'temple', 'living room'],
    image: '/products/temple-11-1.jpg',
    images: ['/products/temple-11-1.jpg', '/products/temple-11-2.jpg'],
    highlights: [
      'Wood canopy with spotlights',
      'Hanging bell & diya chains',
      'Lotus mural backdrop',
      'Marble-top cabinet base',
    ],
  },
  {
    id: 'tree-relief-arch-jali-mandir',
    name: 'Tree Relief Arch Jali Mandir',
    categoryId: 'temple',
    subcategoryId: 'carved',
    price: 76999,
    currency: 'INR',
    brand: 'Priyabadal Homes',
    collection: 'Temple',
    sku: 'PBH-TMP-12',
    description:
      'White arch-jali mandir with sculpted tree-of-life interior relief, marble counter, and soft drawer storage below.',
    style: ['carved', 'modern', 'luxe'],
    rooms: ['puja', 'temple'],
    image: '/products/temple-12-1.jpg',
    images: ['/products/temple-12-1.jpg'],
    highlights: [
      'Arch jali folding doors',
      'Tree-of-life wall relief',
      'Marble altar counter',
      'Clean white finish',
    ],
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
  {
    id: 'silaibunai-sofa-refresh',
    name: 'Sofa Silai Bunai Refresh',
    categoryId: 'silaibunai',
    subcategoryId: 'sofa-upholstery',
    price: 14999,
    currency: 'INR',
    brand: 'Priyabadal Homes',
    collection: 'Silai Bunai',
    sku: 'PBH-SILAI-SOFA',
    description:
      'Custom sofa silai bunai — fabric change, cushion restitch, and neat piping finishes measured to your piece.',
    style: ['custom', 'soft', 'homely'],
    rooms: ['living room', 'bedroom'],
    image: '/products/categories/silaibunai.jpg',
    highlights: [
      'Custom fabric & stitch',
      'Cushion refill options',
      'On-site measurement',
      'WhatsApp quote',
    ],
  },
  {
    id: 'commercial-1bhk-pack',
    name: '1BHK Commercial Pack',
    categoryId: 'commercials',
    subcategoryId: '1bhk',
    price: 68500,
    currency: 'INR',
    pricingMode: 'unit',
    minOrderQuantity: 10,
    brand: 'Priyabadal Homes',
    collection: 'Commercial Bulk',
    sku: 'PBH-COM-1BHK',
    description:
      'Lowest-cost 1BHK commercial set for bulk housing — modular kitchen shell, bedroom wardrobe, and essential room doors. Ordered only in lots of 10+ identical packs.',
    style: ['commercial', 'bulk', 'value'],
    rooms: ['1bhk', 'project housing'],
    image: '/products/categories/commercials-1bhk.jpg',
    highlights: [
      'Bulk rate — lowest commercial cost',
      'Minimum order: 10 packs',
      '1BHK kitchen + wardrobe + doors',
      'Same finish across the full lot',
    ],
    details: [
      { label: 'Brand', value: 'Priyabadal Homes' },
      { label: 'Collection', value: 'Commercial Bulk' },
      { label: 'Order type', value: 'Bulk only — minimum 10 identical packs' },
      { label: 'Typical content', value: 'Kitchen shell, 1 wardrobe, room doors' },
      { label: 'Sku', value: 'PBH-COM-1BHK' },
    ],
    specifications: [
      { label: 'Apartment type', value: '1BHK' },
      { label: 'Pricing', value: 'Per pack · volume rate' },
      { label: 'Minimum quantity', value: '10 packs' },
      { label: 'Finish', value: 'Project laminate (standard colours)' },
      { label: 'Country of Origin', value: 'India' },
    ],
    features: [
      'Built for builders, hostels, and housing societies that need many matching units',
      'Bulk production keeps the unit cost as low as possible',
      'One specification locked for the full order of 10+',
    ],
    disclaimer:
      'Commercial packs are bulk-only. We do not accept single-piece commercial orders. Final pack contents and sizes are confirmed on WhatsApp after site / layout details.',
  },
  {
    id: 'commercial-2bhk-pack',
    name: '2BHK Commercial Pack',
    categoryId: 'commercials',
    subcategoryId: '2bhk',
    price: 98500,
    currency: 'INR',
    pricingMode: 'unit',
    minOrderQuantity: 10,
    brand: 'Priyabadal Homes',
    collection: 'Commercial Bulk',
    sku: 'PBH-COM-2BHK',
    description:
      '2BHK commercial apartment pack at project pricing — kitchen, two bedroom wardrobes, and door set. Minimum 10 identical copies for bulk manufacture.',
    style: ['commercial', 'bulk', 'value'],
    rooms: ['2bhk', 'project housing'],
    image: '/products/categories/commercials-2bhk.jpg',
    highlights: [
      'Bulk rate — lowest commercial cost',
      'Minimum order: 10 packs',
      '2BHK kitchen + 2 wardrobes + doors',
      'Ideal for builder projects',
    ],
    details: [
      { label: 'Brand', value: 'Priyabadal Homes' },
      { label: 'Collection', value: 'Commercial Bulk' },
      { label: 'Order type', value: 'Bulk only — minimum 10 identical packs' },
      { label: 'Typical content', value: 'Kitchen, 2 wardrobes, door set' },
      { label: 'Sku', value: 'PBH-COM-2BHK' },
    ],
    specifications: [
      { label: 'Apartment type', value: '2BHK' },
      { label: 'Pricing', value: 'Per pack · volume rate' },
      { label: 'Minimum quantity', value: '10 packs' },
      { label: 'Finish', value: 'Project laminate (standard colours)' },
      { label: 'Country of Origin', value: 'India' },
    ],
    features: [
      'Standardised 2BHK layout packs for faster bulk production',
      'Lower cost because we manufacture a minimum of 10 matching sets',
      'Quote on WhatsApp with your project quantity (10+)',
    ],
    disclaimer:
      'Commercial packs are bulk-only. We do not accept single-piece commercial orders. Final pack contents and sizes are confirmed on WhatsApp after site / layout details.',
  },
  {
    id: 'commercial-3bhk-pack',
    name: '3BHK Commercial Pack',
    categoryId: 'commercials',
    subcategoryId: '3bhk',
    price: 138500,
    currency: 'INR',
    pricingMode: 'unit',
    minOrderQuantity: 10,
    brand: 'Priyabadal Homes',
    collection: 'Commercial Bulk',
    sku: 'PBH-COM-3BHK',
    description:
      '3BHK commercial pack for large projects — kitchen, multi-bedroom storage, and doors at our sharpest bulk price. Orders start at 10 identical packs.',
    style: ['commercial', 'bulk', 'value'],
    rooms: ['3bhk', 'project housing'],
    image: '/products/categories/commercials-3bhk.jpg',
    highlights: [
      'Bulk rate — lowest commercial cost',
      'Minimum order: 10 packs',
      '3BHK full apartment commercial set',
      'Best unit price at volume',
    ],
    details: [
      { label: 'Brand', value: 'Priyabadal Homes' },
      { label: 'Collection', value: 'Commercial Bulk' },
      { label: 'Order type', value: 'Bulk only — minimum 10 identical packs' },
      { label: 'Typical content', value: 'Kitchen, 3 wardrobes / storage, door set' },
      { label: 'Sku', value: 'PBH-COM-3BHK' },
    ],
    specifications: [
      { label: 'Apartment type', value: '3BHK' },
      { label: 'Pricing', value: 'Per pack · volume rate' },
      { label: 'Minimum quantity', value: '10 packs' },
      { label: 'Finish', value: 'Project laminate (standard colours)' },
      { label: 'Country of Origin', value: 'India' },
    ],
    features: [
      'Built for township and multi-tower commercial fit-outs',
      'Volume manufacturing from 10 packs upward unlocks the lowest rate',
      'Share floor plans on WhatsApp for a project quote',
    ],
    disclaimer:
      'Commercial packs are bulk-only. We do not accept single-piece commercial orders. Final pack contents and sizes are confirmed on WhatsApp after site / layout details.',
  },
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
