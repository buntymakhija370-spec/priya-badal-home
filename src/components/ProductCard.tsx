import { Link } from 'react-router-dom'
import {
  formatPrice,
  getCategory,
  getMinOrderQuantity,
  type Product,
} from '../data/catalog'
import { getProductMedia } from '../lib/media'
import { productPath } from '../lib/links'
import { useCurrency } from '../hooks/useCurrency'
import { ProductImageScroller } from './ProductImageScroller'
import { CustomizeButton } from './PriceCalculator'
import { FavoriteButton } from './FavoriteButton'
import './ProductCard.css'

type Props = {
  product: Product
}

export function ProductCard({ product }: Props) {
  useCurrency()
  const href = productPath(product.id)
  const media = getProductMedia(product)
  const category = getCategory(product.categoryId)
  const minQty = getMinOrderQuantity(product)

  return (
    <article className="product-card">
      <div className="product-card__media">
        <ProductImageScroller media={media} alt={product.name} />
        <FavoriteButton
          productId={product.id}
          className="fav-btn--icon fav-btn--on-media product-card__fav"
        />
        {minQty > 1 ? (
          <span className="product-card__bulk">Min. {minQty} packs</span>
        ) : null}
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
          {minQty > 1 ? (
            <span className="product-card__price-unit"> /pack</span>
          ) : null}
        </p>
        {minQty > 1 ? (
          <p className="product-card__min">
            Bulk commercial · order {minQty}+ identical packs
          </p>
        ) : null}
        <p className="product-card__desc">{product.description}</p>
        <CustomizeButton product={product} className="product-card__customise" />
      </div>
    </article>
  )
}
