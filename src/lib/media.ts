import type { Product } from '../data/catalog'

export type MediaItem = {
  type: 'image' | 'video'
  src: string
  poster?: string
}

export function isVideoSrc(src: string) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src)
}

/** Build gallery media: videos first, then photos (poster not duplicated). */
export function getProductMedia(product: Product): MediaItem[] {
  const videos = product.videos ?? []
  const images = product.images?.length
    ? product.images
    : product.image
      ? [product.image]
      : []

  if (videos.length === 0) {
    return images.map((src) => ({ type: 'image' as const, src }))
  }

  const items: MediaItem[] = videos.map((src) => ({
    type: 'video' as const,
    src,
    poster: product.image,
  }))

  for (const src of images) {
    // Skip poster duplicate when video already uses it
    if (src === product.image) continue
    items.push({ type: 'image', src })
  }

  return items
}
