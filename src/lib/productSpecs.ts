import {
  getCategory,
  getSubcategory,
  type Product,
  type SpecRow,
} from '../data/catalog'

const FINISH_LABELS: Record<string, string> = {
  pu: 'PU finish',
  laminate: 'Laminate finish',
  veneer: 'Veneer finish',
  acrylic: 'Acrylic finish',
  matte: 'Matte laminate',
  'natural-oak': 'Natural oak',
  walnut: 'Walnut veneer',
  gloss: 'High gloss lacquer',
  textured: 'Textured finish',
  ceramic: 'Ceramic coating',
}

function finishLabel(product: Product) {
  if (!product.defaultFinishId) return 'Custom finish'
  return FINISH_LABELS[product.defaultFinishId] ?? product.defaultFinishId.toUpperCase()
}

function thicknessLabel(product: Product) {
  return product.defaultThicknessId
    ? `${product.defaultThicknessId} mm`
    : 'Made to measure'
}

function roomType(product: Product) {
  return product.rooms
    .map((r) => r.replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(', ')
}

function skuFor(product: Product) {
  if (product.sku) return product.sku
  return `PBH-${product.id.replace(/-/g, '').slice(0, 12).toUpperCase()}`
}

function mergeUniqueHighlights(base: string[], extra: string[]) {
  const seen = new Set(base.map((h) => h.toLowerCase()))
  const merged = [...base]
  for (const item of extra) {
    const key = item.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(item)
  }
  return merged
}

function liveEdgePresentation(product: Product) {
  const category = getCategory(product.categoryId)
  const subcategory = getSubcategory(product.categoryId, product.subcategoryId)
  const brand = product.brand ?? 'Priyabadal Homes'
  const collection = product.collection ?? subcategory?.name ?? 'Live Edge'

  const coreHighlights = [
    'Indonesian imported teak wood',
    'Solid teak · natural live edge',
    'One-of-a-kind — not repeatable',
    'Confirm size on WhatsApp',
  ]

  const highlights = mergeUniqueHighlights(
    coreHighlights,
    product.highlights ?? [],
  )

  const details: SpecRow[] = [
    { label: 'Brand', value: brand },
    { label: 'Collection', value: collection },
    { label: 'Origin', value: 'Indonesian imported furniture' },
    { label: 'Primary Material', value: 'Solid teak wood (natural live edge)' },
    {
      label: 'Uniqueness',
      value:
        'Natural product — each piece is unique; the same product is not repeatable',
    },
    {
      label: 'Dimensions / Size',
      value:
        'Natural size as shown — ask and confirm exact measurements on WhatsApp before ordering',
    },
    {
      label: 'Dimensions (reference)',
      value:
        'Because this is natural teak, size and form vary piece to piece. WhatsApp our team to confirm the exact piece.',
    },
    { label: 'Assembly', value: 'Ready piece / light on-site placement' },
    { label: 'Room Type', value: roomType(product) || 'Home' },
    { label: 'Warranty', value: "12 Months' warranty on manufacturing defects" },
    { label: 'Weight', value: 'Shared on WhatsApp confirmation for the selected piece' },
    { label: 'Sku', value: skuFor(product) },
  ]

  const specifications: SpecRow[] = [
    { label: 'Wood', value: 'Teak wood (solid)' },
    { label: 'Finish', value: 'Natural teak polish / oil finish (as shown)' },
    { label: 'Category', value: category?.name ?? 'Live Edge Furniture' },
    { label: 'Subcategory', value: subcategory?.name ?? '—' },
    { label: 'Country of Origin', value: 'Indonesia (imported)' },
    { label: 'Pricing', value: 'Per piece (as shown)' },
    {
      label: 'Availability',
      value: 'Subject to the exact natural piece in stock — confirm on WhatsApp',
    },
    { label: 'Style tags', value: product.style.join(', ') || 'natural, organic' },
    {
      label: 'Care',
      value: 'Wipe with a soft dry cloth; avoid harsh cleaners and prolonged water on unfinished edges',
    },
  ]

  const features = product.features ?? [
    'Indonesian imported solid teak live-edge furniture',
    '100% teak wood — natural grain, knots, and organic form',
    'Each piece is unique; the same product cannot be repeated exactly',
    'Ask size and confirm the exact piece on WhatsApp before ordering',
    'Statement natural furniture for living, entry, and bathroom spaces',
  ]

  const disclaimer =
    product.disclaimer ??
    'Live Edge pieces are Indonesian imported solid teak. As natural products, grain, colour, voids, and size vary — no two pieces are identical and the same product is not repeatable. Confirm exact size and the available piece on WhatsApp before purchase. Accessories in photos are for representation only.'

  const detailLabels = new Set((product.details ?? []).map((r) => r.label.toLowerCase()))
  const specLabels = new Set(
    (product.specifications ?? []).map((r) => r.label.toLowerCase()),
  )

  return {
    brand,
    collection,
    sku: skuFor(product),
    highlights,
    details: [
      ...(product.details ?? []),
      ...details.filter((r) => !detailLabels.has(r.label.toLowerCase())),
    ],
    specifications: [
      ...(product.specifications ?? []),
      ...specifications.filter((r) => !specLabels.has(r.label.toLowerCase())),
    ],
    features,
    disclaimer,
  }
}

/** Merge product overrides with Pepperfry-style defaults so every PDP is complete. */
export function resolveProductPresentation(product: Product) {
  if (product.categoryId === 'live-edge-furniture') {
    return liveEdgePresentation(product)
  }

  const category = getCategory(product.categoryId)
  const subcategory = getSubcategory(product.categoryId, product.subcategoryId)
  const brand = product.brand ?? 'Priyabadal Homes'
  const collection = product.collection ?? subcategory?.name ?? category?.name ?? 'Signature'
  const finish = finishLabel(product)
  const thickness = thicknessLabel(product)

  const defaultHighlights =
    product.highlights ??
    [
      product.pricingMode === 'per-sqft' ? 'Priced per sq ft — sized to your wall' : null,
      product.defaultFinishId ? finish : null,
      product.defaultThicknessId ? `${thickness} board` : null,
      'On-site carpenter assembly',
      'Made in India',
    ].filter(Boolean) as string[]

  const defaultDetails: SpecRow[] = [
    { label: 'Brand', value: brand },
    { label: 'Assembly', value: 'Carpenter Assembly (on-site)' },
    { label: 'Collection', value: collection },
    {
      label: 'Dimensions',
      value:
        product.pricingMode === 'per-sqft'
          ? 'Made to measure (custom width × height)'
          : 'Standard size — customise in quote',
    },
    {
      label: 'Dimensions (reference)',
      value:
        product.pricingMode === 'per-sqft'
          ? 'Share your opening size in ft for exact pricing'
          : 'Confirm final size with our team',
    },
    {
      label: 'Primary Material',
      value: product.defaultThicknessId
        ? `${thickness} engineered board with ${finish}`
        : `Premium interiors materials · ${finish}`,
    },
    { label: 'Product Rating', value: 'Made-to-order quality' },
    { label: 'Room Type', value: roomType(product) || category?.name || 'Home' },
    { label: 'Warranty', value: "12 Months' warranty on manufacturing defects" },
    {
      label: 'Weight',
      value:
        product.pricingMode === 'per-sqft'
          ? 'Depends on final size'
          : 'Shared on confirmation',
    },
    { label: 'Sku', value: skuFor(product) },
  ]

  const defaultSpecifications: SpecRow[] = [
    { label: 'Colour / Finish', value: finish },
    { label: 'Board Thickness', value: thickness },
    { label: 'Category', value: category?.name ?? '—' },
    { label: 'Subcategory', value: subcategory?.name ?? '—' },
    {
      label: 'Pricing',
      value:
        product.categoryId === 'kitchen' ||
        product.categoryId === 'wardrobe' ||
        product.categoryId === 'temple' ||
        product.categoryId === 'sculpted-furniture'
          ? product.pricingMode === 'per-sqft'
            ? 'Per sq ft — shutter only or with carcass'
            : 'Per unit — shutter only or with carcass'
          : product.pricingMode === 'per-sqft'
            ? 'Per sq ft'
            : 'Per unit',
    },
    { label: 'Style tags', value: product.style.join(', ') || '—' },
    { label: 'Country of Origin', value: 'India' },
    { label: 'Care', value: 'Wipe with a soft dry cloth; avoid harsh cleaners' },
  ]

  const defaultFeatures =
    product.features ??
    [
      `${finish} surfaces with a clean, modern look`,
      product.defaultThicknessId
        ? `Built on ${thickness} board for everyday durability`
        : 'Built for everyday home use',
      'Hardware and soft-close options available on customisation',
      'Storage layout can be tuned to your needs',
      'Low-maintenance surfaces for easy cleaning',
    ]

  const disclaimer =
    product.disclaimer ??
    'Accessories shown in images are for representation only and are not part of the product unless listed. Final colour and grain may vary slightly from screen display. Custom sizes are confirmed before production.'

  const detailLabels = new Set((product.details ?? []).map((r) => r.label.toLowerCase()))
  const specLabels = new Set((product.specifications ?? []).map((r) => r.label.toLowerCase()))

  return {
    brand,
    collection,
    sku: skuFor(product),
    highlights: defaultHighlights,
    details: [
      ...(product.details ?? []),
      ...defaultDetails.filter((r) => !detailLabels.has(r.label.toLowerCase())),
    ],
    specifications: [
      ...(product.specifications ?? []),
      ...defaultSpecifications.filter((r) => !specLabels.has(r.label.toLowerCase())),
    ],
    features: defaultFeatures,
    disclaimer,
  }
}
