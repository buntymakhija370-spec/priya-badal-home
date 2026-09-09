#!/usr/bin/env node
/** Sync Kitchen products from catalog.ts → scripts/kitchen-products.json for PDF generation. */

import { writeFileSync } from 'node:fs'
import { baseProducts } from '../src/data/catalog.ts'

const products = baseProducts
  .filter((p) => p.categoryId === 'kitchen')
  .map((p) => ({
    id: p.id,
    name: p.name,
    subcategoryId: p.subcategoryId,
    price: p.price,
    carcassPrice: p.carcassPrice ?? null,
    pricingMode: p.pricingMode ?? 'per-sqft',
    thicknessMm: p.defaultThicknessId ? Number(p.defaultThicknessId) : null,
    sku: p.sku,
    description: p.description,
    collection: p.collection,
    image: p.image,
    images: (p.images?.length ? p.images : p.image ? [p.image] : []).filter(
      (src) => !/\.svg(\?|$)/i.test(src),
    ),
  }))
  .sort((a, b) => {
    const skuA = a.sku ?? ''
    const skuB = b.sku ?? ''
    return skuA.localeCompare(skuB, undefined, { numeric: true })
  })

const out = new URL('./kitchen-products.json', import.meta.url)
writeFileSync(out, `${JSON.stringify(products, null, 2)}\n`)
console.log(`Wrote ${products.length} Kitchen products → ${out.pathname}`)
