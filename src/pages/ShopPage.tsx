import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { categories, getCategory, getSubcategory } from '../data/catalog'
import { getProductsByCategory, getAllProducts } from '../lib/products'
import { ProductCard } from '../components/ProductCard'
import { shopPath } from '../lib/links'
import './ShopPage.css'

type SortId = 'featured' | 'price-asc' | 'price-desc' | 'name'

export function ShopPage() {
  const { categoryId, subcategoryId } = useParams()
  const category = categoryId ? getCategory(categoryId) : undefined
  const subcategory =
    categoryId && subcategoryId
      ? getSubcategory(categoryId, subcategoryId)
      : undefined

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortId>('featured')

  // Same ShopPage instance is reused across categories — reset filters + scroll
  useEffect(() => {
    setQuery('')
    setSort('featured')
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [categoryId, subcategoryId])

  const baseProducts = useMemo(() => {
    if (!categoryId) return getAllProducts()
    if (subcategoryId) return getProductsByCategory(categoryId, subcategoryId)
    return getProductsByCategory(categoryId)
  }, [categoryId, subcategoryId])

  const products = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = baseProducts
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.style.some((s) => s.toLowerCase().includes(q)),
      )
    }
    const sorted = [...list]
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price)
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name))
    return sorted
  }, [baseProducts, query, sort])

  const subcats = category?.subcategories ?? []
  const lede =
    subcategory?.description ??
    category?.description ??
    'Customise sizes and request WhatsApp quotes.'

  return (
    <main className={`shop page-pad ${category?.id === 'commercials' ? 'shop--commercials' : ''}`}>
      <header className="shop__header">
        <p className="eyebrow">Shop</p>
        <h1>
          {subcategory?.name ?? (category ? category.name : 'All products')}
        </h1>
        {category?.caption && category.id === 'commercials' ? (
          <p className="shop__caption">{category.caption}</p>
        ) : null}
        <p className="shop__lede">{lede}</p>
      </header>

      {category?.id === 'commercials' && category.conceptNote ? (
        <aside className="shop__concept" aria-label="Commercials concept">
          <p className="shop__concept-kicker">How commercials work</p>
          <p>{category.conceptNote}</p>
          <ul>
            <li>Lowest project cost through bulk manufacture</li>
            <li>Minimum order: {category.minOrderQuantity ?? 10} identical packs</li>
            <li>Choose 1BHK, 2BHK, or 3BHK package type</li>
            <li>WhatsApp quote with your project quantity (10+)</li>
          </ul>
        </aside>
      ) : null}

      <div className="shop__cats" aria-label="Categories">
        <Link className={`chip ${!categoryId ? 'chip--active' : ''}`} to="/shop">
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            className={`chip ${categoryId === cat.id ? 'chip--active' : ''}`}
            to={shopPath(cat.id)}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {category && subcats.length > 0 && (
        <div className="shop__subs" aria-label="Subcategories">
          <Link
            className={`chip ${!subcategoryId ? 'chip--active' : ''}`}
            to={shopPath(category.id)}
          >
            All {category.name}
          </Link>
          {subcats.map((sub) => (
            <Link
              key={sub.id}
              className={`chip ${subcategoryId === sub.id ? 'chip--active' : ''}`}
              to={shopPath(category.id, sub.id)}
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      <div className="shop__toolbar">
        <label className="shop__search">
          <span className="sr-only">Search products</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
          />
        </label>
        <label className="shop__sort">
          <span>Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
        <p className="shop__count">
          {products.length} product{products.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {products.length === 0 && (
        <p className="empty">No products match this search.</p>
      )}
    </main>
  )
}
