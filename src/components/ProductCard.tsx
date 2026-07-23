import { Link } from 'react-router-dom'
import { formatPrice, type Product } from '../data/catalog'
import { productPath } from '../lib/links'
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
        <p className="product-card__price">
          <span className="product-card__price-from">From</span>{' '}
          {formatPrice(product.price)}
          {product.pricingMode === 'per-sqft' ? (
            <span className="product-card__price-unit"> /sq ft</span>
          ) : null}
        </p>
        <p className="product-card__desc">{product.description}</p>
        <Link className="btn btn--customise product-card__customise" to={href}>
          Customise &amp; Price
        </Link>
      </div>
    </article>
  )
}
