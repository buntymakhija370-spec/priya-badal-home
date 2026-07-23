import { Link, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { getCategory, getSubcategory } from '../data/catalog'
import { getProductsByCategory, getAllProducts } from '../lib/products'
import { ProductCard } from '../components/ProductCard'
import './ShopPage.css'

export function ShopPage() {
  const { categoryId, subcategoryId } = useParams()
  const category = categoryId ? getCategory(categoryId) : undefined
  const subcategory =
    categoryId && subcategoryId
      ? getSubcategory(categoryId, subcategoryId)
      : undefined

  const products = useMemo(() => {
    if (!categoryId) return getAllProducts()
    if (subcategoryId) return getProductsByCategory(categoryId, subcategoryId)
    return getProductsByCategory(categoryId)
  }, [categoryId, subcategoryId])

  return (
    <main className="shop page-pad">
      <header className="shop__header">
        <p className="eyebrow">Shop</p>
        <h1>
          {subcategory?.name ?? (category ? category.name : 'All products')}
        </h1>
        <p className="shop__lede">
          {category
            ? category.description
            : 'Browse every piece from the collection.'}
        </p>
        {categoryId && (
          <p className="shop__back">
            <Link to="/shop">All products</Link>
            {subcategoryId && category ? (
              <>
                {' · '}
                <Link to={`/shop/${category.id}`}>{category.name}</Link>
              </>
            ) : null}
          </p>
        )}
      </header>

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {products.length === 0 && (
        <p className="empty">No products in this category yet.</p>
      )}
    </main>
  )
}
