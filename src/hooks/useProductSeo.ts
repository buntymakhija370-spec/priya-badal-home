import { useEffect } from 'react'
import type { Product } from '../data/catalog'
import { productShareUrl } from '../lib/links'

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = href
}

/** Per-product title + social meta so each Instagram link is unique */
export function useProductSeo(product: Product | undefined) {
  useEffect(() => {
    if (!product) return

    const url = productShareUrl(product.id)
    const title = `${product.name} | Priya Badal`
    const description = `${product.description} From ₹${product.price.toLocaleString('en-IN')}.`

    const previousTitle = document.title
    document.title = title
    setMeta('name', 'description', description)
    setMeta('property', 'og:type', 'product')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', product.image)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', product.image)
    setCanonical(url)

    return () => {
      document.title = previousTitle
    }
  }, [product])
}
