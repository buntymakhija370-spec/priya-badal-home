import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  formatPrice,
  getCategory,
  getMinOrderQuantity,
  isProductCustomizable,
  type Product,
} from '../data/catalog'
import { getProductMedia } from '../lib/media'
import { productPath } from '../lib/links'
import { useCurrency } from '../hooks/useCurrency'
import { defaultConfig } from '../lib/pricing'
import { addConfiguredToCart } from '../lib/cart'
import { buildWhatsAppProductUrl } from '../lib/whatsapp'
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
  const customizable = isProductCustomizable(product)
  const [added, setAdded] = useState(false)

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
        {product.tags?.length ? (
          <div className="product-card__tags">
            {product.tags.map((tag) => (
              <span key={tag} className="product-card__tag">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="product-card__body">
        {category && <p className="product-card__cat">{category.name}</p>}
        <h3>
          <Link to={href}>{product.name}</Link>
        </h3>
        <p className="product-card__price">
          {customizable ? (
            <span className="product-card__price-from">From</span>
          ) : null}{' '}
          {formatPrice(product.price)}
          {product.pricingMode === 'per-sqft' ? (
            <span className="product-card__price-unit"> /sq ft shutter</span>
          ) : null}
          {minQty > 1 ? (
            <span className="product-card__price-unit"> /pack</span>
          ) : null}
        </p>
        {product.carcassPrice != null && product.pricingMode === 'per-sqft' ? (
          <p className="product-card__price-alt">
            Carcass {formatPrice(product.carcassPrice)}
            <span className="product-card__price-unit"> /sq ft</span>
            <span className="product-card__price-note">
              {' '}
              · with carcass = shutter + carcass
            </span>
          </p>
        ) : null}
        {minQty > 1 ? (
          <p className="product-card__min">
            Bulk commercial · order {minQty}+ identical packs
          </p>
        ) : null}
        <p className="product-card__desc">{product.description}</p>
        {!customizable && product.categoryId === 'live-edge-furniture' ? (
          <p className="product-card__note">
            Indonesian imported teak · unique natural piece · confirm size on
            WhatsApp
          </p>
        ) : null}
        {customizable ? (
          <CustomizeButton product={product} className="product-card__customise" />
        ) : (
          <div className="product-card__fixed-cta">
            <button
              type="button"
              className="btn btn--dark product-card__customise"
              onClick={() => {
                addConfiguredToCart({
                  productId: product.id,
                  quantity: 1,
                  config: defaultConfig(product.categoryId, product),
                  unitPrice: product.price,
                })
                setAdded(true)
                window.setTimeout(() => setAdded(false), 1400)
              }}
            >
              {added ? 'Added to cart' : 'Add to cart'}
            </button>
            <a
              className="product-card__wa"
              href={buildWhatsAppProductUrl(product)}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </div>
        )}
      </div>
    </article>
  )
}
