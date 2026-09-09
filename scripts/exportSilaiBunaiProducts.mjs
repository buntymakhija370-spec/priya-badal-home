#!/usr/bin/env node
/** Sync Silai Bunai products from catalog.ts → scripts/silaibunai-products.json for PDF generation. */

import { writeFileSync } from 'node:fs'
import { baseProducts } from '../src/data/catalog.ts'

const products = baseProducts
  .filter((p) => p.categoryId === 'silaibunai')
  .map((p) => ({
    id: p.id,
    name: p.name,
    subcategoryId: p.subcategoryId,
    price: p.price,
    pricingMode: p.pricingMode ?? 'unit',
    thicknessMm: p.defaultThicknessId ? Number(p.defaultThicknessId) : null,
    sku: p.sku,
    description: p.description,
    collection: p.collection,
    image: p.image,
    images: p.images?.length ? p.images : p.image ? [p.image] : [],
  }))
  .sort((a, b) => {
    const skuA = a.sku ?? ''
    const skuB = b.sku ?? ''
    return skuA.localeCompare(skuB, undefined, { numeric: true })
  })

const out = new URL('./silaibunai-products.json', import.meta.url)
writeFileSync(out, `${JSON.stringify(products, null, 2)}\n`)
console.log(`Wrote ${products.length} Silai Bunai products → ${out.pathname}`)
