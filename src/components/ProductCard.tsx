import { Link } from 'react-router-dom'
import { formatPrice, type Product } from '../data/catalog'
import { FavoriteButton } from './FavoriteButton'
import './ProductCard.css'

type Props = {
  product: Product
}

export function ProductCard({ product }: Props) {
  return (
    <article className="product-card">
      <div className="product-card__media">
        <Link to={`/product/${product.id}`} tabIndex={-1} aria-hidden="true">
          <img src={product.image} alt="" loading="lazy" />
        </Link>
      </div>
      <div className="product-card__body">
        <h3>
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="product-card__price">{formatPrice(product.price)}</p>
        <p className="product-card__desc">{product.description}</p>
        <div className="product-card__actions">
          <FavoriteButton productId={product.id} />
          <Link className="btn btn--outline product-card__view" to={`/product/${product.id}`}>
            View details
          </Link>
        </div>
      </div>
    </article>
  )
}
