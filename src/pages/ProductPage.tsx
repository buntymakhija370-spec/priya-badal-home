import { Link, useParams } from 'react-router-dom'
import { formatPrice, getCategory, getSubcategory } from '../data/catalog'
import { getProductById, getProductsByCategory } from '../lib/products'
import { ProductCard } from '../components/ProductCard'
import { FavoriteButton } from '../components/FavoriteButton'
import './ProductPage.css'

export function ProductPage() {
  const { productId } = useParams()
  const product = productId ? getProductById(productId) : undefined

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

  return (
    <main className="product-page page-pad">
      <nav className="crumbs">
        <Link to="/shop">Shop</Link>
        <span>/</span>
        {category && (
          <>
            <Link to={`/shop/${category.id}`}>{category.name}</Link>
            <span>/</span>
          </>
        )}
        {subcategory && <span>{subcategory.name}</span>}
      </nav>

      <div className="product-page__layout">
        <div className="product-page__media">
          <img src={product.image} alt={product.name} />
        </div>
        <div className="product-page__info">
          <p className="eyebrow">
            {category?.name}
            {subcategory ? ` · ${subcategory.name}` : ''}
          </p>
          <h1>{product.name}</h1>
          <p className="product-page__price">{formatPrice(product.price)}</p>
          <p className="product-page__desc">{product.description}</p>
          <div className="product-page__tags">
            {product.style.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
          <div className="product-page__actions">
            <FavoriteButton productId={product.id} />
            <Link className="btn btn--dark" to="/chat">
              Ask AI about this
            </Link>
            <Link className="btn btn--outline" to={`/shop/${product.categoryId}`}>
              More in {category?.name}
            </Link>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="related">
          <h2>You may also like</h2>
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
