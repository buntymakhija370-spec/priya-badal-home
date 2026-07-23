import { Link, useParams } from 'react-router-dom'
import { formatPrice, getCategory, getSubcategory } from '../data/catalog'
import { getProductById, getProductsByCategory } from '../lib/products'
import { ProductCard } from '../components/ProductCard'
import { ProductImageScroller } from '../components/ProductImageScroller'
import { CustomizeButton } from '../components/PriceCalculator'
import { useProductSeo } from '../hooks/useProductSeo'
import { shopPath } from '../lib/links'
import './ProductPage.css'

export function ProductPage() {
  const { productId } = useParams()
  const product = productId ? getProductById(productId) : undefined
  useProductSeo(product)

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
  const gallery = product.images?.length ? product.images : [product.image]

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
            <ProductImageScroller images={gallery} alt={product.name} />
          </div>
        </div>

        <div className="product-page__info">
          <p className="eyebrow">
            {category?.name}
            {subcategory ? ` · ${subcategory.name}` : ''}
          </p>
          <h1>{product.name}</h1>

          <div className="product-page__price-block">
            <span className="product-page__price-from">From</span>
            <span className="product-page__price-value">{formatPrice(product.price)}</span>
            {product.pricingMode === 'per-sqft' && (
              <span className="product-page__price-unit">/sq ft</span>
            )}
          </div>

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
          </ul>

          <p className="product-page__desc">{product.description}</p>

          <div className="product-page__actions">
            <CustomizeButton product={product} />
          </div>
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
