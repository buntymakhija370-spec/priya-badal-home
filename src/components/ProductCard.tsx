import { Link } from 'react-router-dom'
import { formatPrice, type Product } from '../data/catalog'
import { productPath } from '../lib/links'
import { ProductImageScroller } from './ProductImageScroller'
import { CustomizeButton } from './PriceCalculator'
import './ProductCard.css'

type Props = {
  product: Product
}

export function ProductCard({ product }: Props) {
  const href = productPath(product.id)
  const images = product.images?.length ? product.images : [product.image]

  return (
    <article className="product-card">
      <div className="product-card__media">
        <ProductImageScroller images={images} alt={product.name} />
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
        <CustomizeButton product={product} className="product-card__customise" />
      </div>
    </article>
  )
}
