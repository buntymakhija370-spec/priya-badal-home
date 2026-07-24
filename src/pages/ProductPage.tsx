import { Link, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { formatPrice, getCategory, getSubcategory, type SpecRow } from '../data/catalog'
import { getAllProducts, getProductById } from '../lib/products'
import { getProductMedia } from '../lib/media'
import { resolveProductPresentation } from '../lib/productSpecs'
import { ProductGallery } from '../components/ProductGallery'
import { ProductCard } from '../components/ProductCard'
import { CustomizeButton } from '../components/PriceCalculator'
import { FavoriteButton } from '../components/FavoriteButton'
import { ShareProductLink } from '../components/ShareProductLink'
import { useProductSeo } from '../hooks/useProductSeo'
import { shopPath } from '../lib/links'
import './ProductPage.css'

type SectionId = 'details' | 'specs' | 'features'

function SpecTable({ rows, caption }: { rows: SpecRow[]; caption: string }) {
  return (
    <table className="spec-table">
      <caption className="sr-only">{caption}</caption>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.label}-${row.value}`}>
            <th scope="row">{row.label}</th>
            <td>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function ProductPage() {
  const { productId } = useParams()
  const product = productId ? getProductById(productId) : undefined
  useProductSeo(product)
  const [section, setSection] = useState<SectionId>('details')

  const related = useMemo(() => {
    if (!product) return []
    return getAllProducts()
      .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
      .slice(0, 4)
  }, [product])

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
  const media = getProductMedia(product)
  const presentation = resolveProductPresentation(product)

  return (
    <main className="product-page page-pad">
      <nav className="crumbs" aria-label="Breadcrumb">
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
          <ProductGallery media={media} alt={product.name} />
        </div>

        <div className="product-page__info">
          <p className="product-page__brand">by {presentation.brand}</p>
          <h1>{product.name}</h1>

          <div className="product-page__price-block">
            <span className="product-page__price-from">From</span>
            <span className="product-page__price-value">{formatPrice(product.price)}</span>
            {product.pricingMode === 'per-sqft' && (
              <span className="product-page__price-unit">/sq ft</span>
            )}
          </div>

          <ul className="product-page__trust">
            <li>12-month warranty</li>
            <li>On-site assembly</li>
            <li>Made to measure</li>
          </ul>

          <ul className="product-page__highlights">
            {presentation.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <p className="product-page__desc">{product.description}</p>

          <div className="product-page__actions">
            <CustomizeButton product={product} />
            <FavoriteButton productId={product.id} className="product-page__fav" />
          </div>
          <Link
            className="btn btn--outline product-page__visualise"
            to={`/visualise?product=${product.id}`}
          >
            Visualise in my room (AI)
          </Link>
          <Link className="product-page__how" to="/how-it-works">
            How your custom order works
          </Link>

          <p className="product-page__sku">Sku: {presentation.sku}</p>
        </div>
      </div>

      <section className="product-page__panels" aria-label="Product information">
        <div className="product-page__tabs" role="tablist" aria-label="Product sections">
          {(
            [
              ['details', 'Product Details'],
              ['specs', 'Specifications'],
              ['features', 'Features'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={section === id}
              className={
                section === id
                  ? 'product-page__tab is-active'
                  : 'product-page__tab'
              }
              onClick={() => setSection(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="product-page__panel" role="tabpanel">
          {section === 'details' && (
            <>
              <h2 className="product-page__panel-title">Product Details</h2>
              <SpecTable rows={presentation.details} caption="Product details" />
            </>
          )}

          {section === 'specs' && (
            <>
              <h2 className="product-page__panel-title">Specifications</h2>
              <SpecTable
                rows={presentation.specifications}
                caption="Product specifications"
              />
            </>
          )}

          {section === 'features' && (
            <>
              <h2 className="product-page__panel-title">Features</h2>
              <ul className="product-page__features">
                {presentation.features.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <p className="product-page__disclaimer">
          <strong>Disclaimer:</strong> {presentation.disclaimer}
        </p>
      </section>

      <ShareProductLink product={product} />

      {related.length > 0 && (
        <section className="product-page__related">
          <div className="product-page__related-head">
            <h2>You may also like</h2>
            {category && (
              <Link to={shopPath(category.id)}>More in {category.name}</Link>
            )}
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
