import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { categories, getCategory, getSubcategory } from '../data/catalog'
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

  const [activeSub, setActiveSub] = useState(subcategoryId ?? 'all')

  useEffect(() => {
    setActiveSub(subcategoryId ?? 'all')
  }, [subcategoryId, categoryId])

  const products = useMemo(() => {
    if (!categoryId) return getAllProducts()
    if (activeSub && activeSub !== 'all') {
      return getProductsByCategory(categoryId, activeSub)
    }
    return getProductsByCategory(categoryId)
  }, [categoryId, activeSub])

  return (
    <main className="shop page-pad">
      <header className="shop__header">
        <p className="eyebrow">Shop</p>
        <h1>{category ? category.name : 'All products'}</h1>
        <p className="shop__lede">
          {category
            ? category.description
            : 'Browse every piece — or filter by category and subcategory.'}
        </p>
      </header>

      <div className="shop__cats">
        <Link className={!categoryId ? 'chip chip--active' : 'chip'} to="/shop">
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            className={categoryId === cat.id ? 'chip chip--active' : 'chip'}
            to={`/shop/${cat.id}`}
            onClick={() => setActiveSub('all')}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {category && (
        <div className="shop__subs">
          <button
            type="button"
            className={activeSub === 'all' ? 'chip chip--active' : 'chip'}
            onClick={() => setActiveSub('all')}
          >
            All {category.name}
          </button>
          {category.subcategories.map((sub) => (
            <Link
              key={sub.id}
              className={activeSub === sub.id ? 'chip chip--active' : 'chip'}
              to={`/shop/${category.id}/${sub.id}`}
              onClick={() => setActiveSub(sub.id)}
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      {subcategory && (
        <p className="shop__filter-note">Showing: {subcategory.name}</p>
      )}

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {products.length === 0 && (
        <p className="empty">No products in this subcategory yet.</p>
      )}
    </main>
  )
}
