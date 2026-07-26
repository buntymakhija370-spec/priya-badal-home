import type { Product } from '../data/catalog'

export type MediaItem = {
  type: 'image' | 'video'
  src: string
  poster?: string
  /** Short label under the photograph (what this view shows) */
  caption?: string
}

export function isVideoSrc(src: string) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src)
}

function defaultImageCaption(
  product: Product,
  imageIndex: number,
  imageCount: number,
): string {
  const custom = product.imageCaptions?.[imageIndex]?.trim()
  if (custom) return custom

  const hasCarcassViews =
    product.carcassPrice != null ||
    product.categoryId === 'wardrobe' ||
    product.categoryId === 'kitchen' ||
    product.categoryId === 'temple'

  if (imageCount <= 1) {
    return 'Product photograph — this is the look we make to your size and finish.'
  }

  if (hasCarcassViews) {
    if (imageIndex === 0) {
      return 'Closed exterior look — the finished façade as shown in this photograph.'
    }
    if (imageIndex === imageCount - 1) {
      return 'Open carcass / interior — storage layout as shown in this photograph.'
    }
    return `Detail view ${imageIndex} — as shown in this photograph.`
  }

  return `Photograph ${imageIndex + 1} of ${imageCount} — as shown here.`
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
    return images.map((src, index) => ({
      type: 'image' as const,
      src,
      caption: defaultImageCaption(product, index, images.length),
    }))
  }

  const items: MediaItem[] = videos.map((src, index) => ({
    type: 'video' as const,
    src,
    poster: product.image,
    caption:
      videos.length === 1
        ? 'Product video — walkthrough of the look shown here.'
        : `Product video ${index + 1} — walkthrough of the look shown here.`,
  }))

  let imageIndex = 0
  for (const src of images) {
    // Skip poster duplicate when video already uses it
    if (src === product.image) {
      imageIndex += 1
      continue
    }
    items.push({
      type: 'image',
      src,
      caption: defaultImageCaption(product, imageIndex, images.length),
    })
    imageIndex += 1
  }

  return items
}
