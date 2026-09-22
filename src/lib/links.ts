import { SITE_ORIGIN } from './site'

/** Clean product path for routing and sharing, e.g. /product/taupe-panel-hinged-wardrobe */
export function productPath(productId: string) {
  return `/product/${productId}`
}

/** Absolute URL for Instagram / WhatsApp / bio links */
export function productShareUrl(productId: string, origin = SITE_ORIGIN) {
  return `${origin.replace(/\/$/, '')}${productPath(productId)}`
}

/** Public quotation page (static HTML in /public/quotations) */
export function quotationShareUrl(slug: string, origin = SITE_ORIGIN) {
  return `${origin.replace(/\/$/, '')}/quotations/${slug}.html`
}

/** Direct PDF URL for a quotation file under /public/quotations */
export function quotationPdfUrl(fileName: string, origin = SITE_ORIGIN) {
  return `${origin.replace(/\/$/, '')}/quotations/${fileName.replace(/^\//, '')}`
}

export function shopPath(categoryId?: string, subcategoryId?: string) {
  if (!categoryId) return '/shop'
  if (!subcategoryId) return `/shop/${categoryId}`
  return `/shop/${categoryId}/${subcategoryId}`
}
