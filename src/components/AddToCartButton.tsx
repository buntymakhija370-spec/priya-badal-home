import { useState } from 'react'
import { addToCart, getCartQuantity } from '../lib/cart'
import { useCartItems } from '../hooks/useCart'
import './AddToCartButton.css'

type Props = {
  productId: string
  className?: string
}

export function AddToCartButton({ productId, className = '' }: Props) {
  const items = useCartItems()
  const inCart = items.some((item) => item.productId === productId)
  const qty = getCartQuantity(productId)
  const [justAdded, setJustAdded] = useState(false)

  const onAdd = () => {
    addToCart(productId, 1)
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
