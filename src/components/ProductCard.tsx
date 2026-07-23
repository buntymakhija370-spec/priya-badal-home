import { Link } from 'react-router-dom'
import { formatPrice, type Product } from '../data/catalog'
import { productPath } from '../lib/links'
import { FavoriteButton } from './FavoriteButton'
import { AddToCartButton } from './AddToCartButton'
import './ProductCard.css'

type Props = {
  product: Product
}

export function ProductCard({ product }: Props) {
  const href = productPath(product.id)

  return (
    <article className="product-card">
      <div className="product-card__media">
        <Link to={href} tabIndex={-1} aria-hidden="true">
          <img src={product.image} alt="" loading="lazy" />
        </Link>
      </div>
      <div className="product-card__body">
        <h3>
          <Link to={href}>{product.name}</Link>
        </h3>
        <p className="product-card__price">From {formatPrice(product.price)}</p>
        <p className="product-card__desc">{product.description}</p>
        <div className="product-card__actions">
          <AddToCartButton product={product} />
          <FavoriteButton productId={product.id} />
        </div>
        <Link className="product-card__cta" to={href}>
          View · Customize
        </Link>
      </div>
    </article>
  )
}
