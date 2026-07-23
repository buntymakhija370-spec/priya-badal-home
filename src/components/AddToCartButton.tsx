import { useState } from 'react'
import { calculatePrice, defaultConfig } from '../lib/pricing'
import { addConfiguredToCart, getCartQuantity } from '../lib/cart'
import { useCartItems } from '../hooks/useCart'
import type { Product } from '../data/catalog'
import './AddToCartButton.css'

type Props = {
  product: Product
  className?: string
}

export function AddToCartButton({ product, className = '' }: Props) {
  const items = useCartItems()
  const inCart = items.some((item) => item.productId === product.id)
  const qty = getCartQuantity(product.id)
  const [justAdded, setJustAdded] = useState(false)

  const onAdd = () => {
    const config = defaultConfig(product.categoryId, product)
    const quote = calculatePrice(product, config)
    addConfiguredToCart({
      productId: product.id,
      quantity: 1,
      config: quote.config,
      unitPrice: quote.unitPrice,
    })
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1200)
  }

  return (
    <button
      type="button"
      className={`cart-btn ${inCart ? 'is-in-cart' : ''} ${className}`.trim()}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onAdd()
      }}
    >
      {justAdded ? 'Added' : inCart ? `Add again · ${qty} in cart` : 'Add to cart'}
    </button>
  )
}
