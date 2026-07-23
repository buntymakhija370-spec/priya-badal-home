import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatPrice, getCategory, getSubcategory } from '../data/catalog'
import { getProductById, getProductsByCategory } from '../lib/products'
import { ProductCard } from '../components/ProductCard'
import { FavoriteButton } from '../components/FavoriteButton'
import { AddToCartButton } from '../components/AddToCartButton'
import { CustomizeButton } from '../components/PriceCalculator'
import { useProductSeo } from '../hooks/useProductSeo'
import { shopPath } from '../lib/links'
import './ProductPage.css'

export function ProductPage() {
  const { productId } = useParams()
  const product = productId ? getProductById(productId) : undefined
  useProductSeo(product)
  const gallery = product
    ? product.images?.length
      ? product.images
      : [product.image]
    : []
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    setActiveImage(0)
  }, [productId])

  if (!product) {
    return (
      <main className="page-pad">
        <h1>Product not found</h1>
        <Link to="/shop">Back to shop</Link>
      </main>
    )
  }

  const category = getCategory(product.categoryId)
  const subcategory = getSubcategory(product.categoryId, product.subcategoryId)
  const related = getProductsByCategory(product.categoryId)
    .filter((p) => p.id !== product.id)
    .slice(0, 3)
  const shown = gallery[Math.min(activeImage, gallery.length - 1)] ?? product.image
  const priceLabel =
    product.pricingMode === 'per-sqft'
      ? `${formatPrice(product.price)} / sq ft`
      : `From ${formatPrice(product.price)}`

  return (
    <main className="product-page page-pad">
      <nav className="crumbs">
        <Link to="/shop">Shop</Link>
        <span>/</span>
        {category && (
          <>
            <Link to={shopPath(category.id)}>{category.name}</Link>
            <span>/</span>
          </>
        )}
        {subcategory && <span>{subcategory.name}</span>}
      </nav>

      <div className="product-page__layout">
        <div className="product-page__gallery">
          <div className="product-page__media">
            <img src={shown} alt={product.name} />
          </div>
          {gallery.length > 1 && (
            <div className="product-page__thumbs" role="tablist" aria-label="Product photos">
              {gallery.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  role="tab"
                  aria-selected={index === activeImage}
                  className={
                    index === activeImage
                      ? 'product-page__thumb is-active'
                      : 'product-page__thumb'
                  }
                  onClick={() => setActiveImage(index)}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-page__info">
          <p className="eyebrow">
            {category?.name}
            {subcategory ? ` · ${subcategory.name}` : ''}
          </p>
          <h1>{product.name}</h1>
          <p className="product-page__price">{priceLabel}</p>
          <ul className="product-page__specs">
            {product.defaultFinishId && (
              <li>
                Finish:{' '}
                <strong>
                  {product.defaultFinishId === 'pu' ? 'PU' : product.defaultFinishId}
                </strong>
              </li>
            )}
            {product.defaultThicknessId && (
              <li>
                Thickness: <strong>{product.defaultThicknessId} mm</strong>
              </li>
            )}
            {product.pricingMode === 'per-sqft' && (
              <li>
                Rate: <strong>{formatPrice(product.price)} / sq ft</strong>
              </li>
            )}
          </ul>
          <p className="product-page__desc">{product.description}</p>

          <div className="product-page__tags">
            {product.style.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>

          <div className="product-page__actions">
            <CustomizeButton product={product} />
            <AddToCartButton product={product} />
            <FavoriteButton productId={product.id} />
          </div>

          <Link className="product-page__ai" to="/chat">
            Need ideas? Ask the AI interior guide
          </Link>
        </div>
      </div>

      {related.length > 0 && (
        <section className="related">
          <div className="related__head">
            <p className="eyebrow">More like this</p>
            <h2>You may also like</h2>
          </div>
          <div className="product-grid">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
