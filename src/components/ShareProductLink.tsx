import { useState } from 'react'
import { productShareUrl } from '../lib/links'
import type { Product } from '../data/catalog'
import './ShareProductLink.css'

type Props = {
  product: Product
}

export function ShareProductLink({ product }: Props) {
  const [copied, setCopied] = useState(false)
  const url = productShareUrl(product.id)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const share = async () => {
    const payload = {
      title: product.name,
      text: `${product.name} — from Priyabadal Homes`,
      url,
    }
    if (navigator.share) {
      try {
        await navigator.share(payload)
        return
      } catch {
        // user cancelled or share failed — fall through to copy
      }
    }
    await copy()
  }

  return (
    <section className="share-link" aria-label="Product link for Instagram">
      <p className="share-link__label">Product link (Instagram)</p>
      <div className="share-link__row">
        <input
          className="share-link__url"
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Shareable product URL"
        />
        <button type="button" className="btn btn--outline" onClick={copy}>
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <button type="button" className="btn btn--dark" onClick={share}>
          Share
        </button>
      </div>
      <p className="share-link__hint">
        Unique link for this product — paste in Instagram bio, stories, or DMs.
      </p>
    </section>
  )
}
