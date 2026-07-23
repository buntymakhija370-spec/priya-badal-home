import { Link } from 'react-router-dom'
import { formatPrice, getCategory, type Product } from '../data/catalog'
import { productPath } from '../lib/links'
import { ProductImageScroller } from './ProductImageScroller'
import { CustomizeButton } from './PriceCalculator'
import { FavoriteButton } from './FavoriteButton'
import './ProductCard.css'

type Props = {
  product: Product
}

export function ProductCard({ product }: Props) {
  const href = productPath(product.id)
  const images = product.images?.length ? product.images : [product.image]
  const category = getCategory(product.categoryId)

  return (
    <article className="product-card">
      <div className="product-card__media">
        <ProductImageScroller images={images} alt={product.name} />
        <FavoriteButton
          productId={product.id}
          className="fav-btn--icon fav-btn--on-media product-card__fav"
        />
      </div>
      <div className="product-card__body">
        {category && <p className="product-card__cat">{category.name}</p>}
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
