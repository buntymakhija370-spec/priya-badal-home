/** Clean product path for routing and sharing, e.g. /product/fluted-oak-panel */
export function productPath(productId: string) {
  return `/product/${productId}`
}

/** Absolute URL for Instagram / WhatsApp / bio links */
export function productShareUrl(productId: string, origin = window.location.origin) {
  return `${origin.replace(/\/$/, '')}${productPath(productId)}`
}

export function shopPath(categoryId?: string, subcategoryId?: string) {
  if (!categoryId) return '/shop'
  if (!subcategoryId) return `/shop/${categoryId}`
  return `/shop/${categoryId}/${subcategoryId}`
}
