/** Always use www — Instagram often opens the apex host, which must resolve via DNS. */
export const SITE_ORIGIN = 'https://www.priyabadalhomes.com'

/** Clean product path for routing and sharing, e.g. /product/taupe-panel-hinged-wardrobe */
export function productPath(productId: string) {
  return `/product/${productId}`
}

/** Absolute URL for Instagram / WhatsApp / bio links (always www) */
export function productShareUrl(productId: string, origin = SITE_ORIGIN) {
  return `${origin.replace(/\/$/, '')}${productPath(productId)}`
}

export function shopPath(categoryId?: string, subcategoryId?: string) {
  if (!categoryId) return '/shop'
  if (!subcategoryId) return `/shop/${categoryId}`
  return `/shop/${categoryId}/${subcategoryId}`
}
