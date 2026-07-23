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

/** Merge product overrides with Pepperfry-style defaults so every PDP is complete. */
export function resolveProductPresentation(product: Product) {
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
    { label: 'Pricing', value: product.pricingMode === 'per-sqft' ? 'Per sq ft' : 'Per unit' },
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
