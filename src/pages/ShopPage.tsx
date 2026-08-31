import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { categories, getCategory } from '../data/catalog'
import { getProductsByCategory } from '../lib/products'
import { ProductCard } from '../components/ProductCard'
import { shopPath } from '../lib/links'
import './ShopPage.css'

type SortId = 'featured' | 'price-asc' | 'price-desc' | 'name'

export function ShopPage() {
  const { categoryId } = useParams()
  const category = categoryId ? getCategory(categoryId) : undefined

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortId>('featured')

  // Same ShopPage instance is reused across categories — reset filters only.
  // Scroll position is owned by ScrollToTop (Back restores where you left).
  useEffect(() => {
    setQuery('')
    setSort('featured')
  }, [categoryId])

  const baseProducts = useMemo(() => {
    if (!categoryId) return []
    return getProductsByCategory(categoryId)
  }, [categoryId])

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

  const landingLede = 'Pick a collection to see products, sizes, and WhatsApp quotes.'

  // Shop entry: ask which collection — do not dump every product.
  if (!categoryId) {
    return (
      <main className="shop page-pad shop--landing">
        <header className="shop__header">
          <p className="eyebrow">Shop</p>
          <h1>Choose a collection</h1>
          <p className="shop__lede">{landingLede}</p>
        </header>

        <aside className="shop__pick-banner" aria-label="How to shop">
          <p className="shop__pick-banner-kicker">Start here</p>
          <p>
            Tap a category banner below. Products open only after you choose a
            collection — so you see the right shutters, panels, or furniture first.
          </p>
        </aside>

        <div className="shop__pick" aria-label="Shop collections">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              className="shop__pick-card"
              to={shopPath(cat.id)}
              aria-label={`Open ${cat.name}`}
            >
              <span className="shop__pick-media" aria-hidden="true">
                <img src={cat.image} alt="" loading="lazy" />
              </span>
              <span className="shop__pick-copy">
                <strong>{cat.name}</strong>
                <span>
                  {cat.caption ??
                    cat.description.split(/[.!?]/)[0]?.trim() ??
                    'View products'}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="shop page-pad">
      <header className="shop__header">
        <p className="eyebrow">Shop</p>
        <h1>{category ? category.name : 'All products'}</h1>
        {category?.caption &&
        (category.id === 'live-edge-furniture' ||
          category.id === 'leather-shutters') ? (
          <p className="shop__caption">{category.caption}</p>
        ) : null}
        {category?.id === 'leather-shutters' ? (
          <p className="shop__lede">{category.description}</p>
        ) : null}
        <p className="shop__back">
          <Link to="/shop">← All collections</Link>
        </p>
      </header>

      {category?.id === 'leather-shutters' && category.conceptNote ? (
        <aside className="shop__concept shop__concept--leena" aria-label="Leena leather shutters">
          <p className="shop__concept-kicker">About Leena leather shutters</p>
          <p>{category.conceptNote}</p>
          <ul>
            <li>Leather-look padded shutters for wardrobes &amp; closets</li>
            <li>Looks: Linear, Urban, Modu, Nawabee, Zardosi, Wave &amp; Aura</li>
            <li>Priced per sq ft of shutter face · 25 mm calibrated plywood</li>
            <li>
              Wave &amp; Aura: add carcass at ₹1,800 / sq ft (special shutter-buyer
              rate — not ₹2,500)
            </li>
            <li>Confirm leather tone, stitch, and handles on WhatsApp</li>
            <li>Made to your opening after on-site measurement</li>
          </ul>
        </aside>
      ) : null}

      {category?.id === 'live-edge-furniture' && category.conceptNote ? (
        <aside className="shop__concept" aria-label="Live Edge Furniture information">
          <p className="shop__concept-kicker">About Live Edge Furniture</p>
          <p>{category.conceptNote}</p>
          <ul>
            <li>Indonesian imported solid teak wood</li>
            <li>Natural product — each piece is unique and not repeatable</li>
            <li>Ask size and confirm the exact piece on WhatsApp</li>
            <li>Seaters, consoles, centre tables, ball stools &amp; basins</li>
          </ul>
        </aside>
      ) : null}

      {category?.id === 'silaibunai' ? (
        <aside className="shop__concept shop__concept--pdf" aria-label="Silai Bunai catalogue">
          <p className="shop__concept-kicker">WhatsApp catalogue</p>
          <p>
            Download the full Silai Bunai lookbook — photos and names only
            (no prices). Share on WhatsApp; enquire on the website.
          </p>
          <p className="shop__pdf-link">
            <a href="/catalogs/priyabadal-silai-bunai.pdf?v=3" download>
              Download Silai Bunai PDF
            </a>
          </p>
        </aside>
      ) : null}

      {category?.id === 'kitchen' ? (
        <aside className="shop__concept shop__concept--pdf" aria-label="Kitchen catalogue">
          <p className="shop__concept-kicker">WhatsApp catalogue</p>
          <p>
            Download the full Kitchen lookbook — photos and names only (no
            prices). Share on WhatsApp; enquire on the website.
          </p>
          <p className="shop__pdf-link">
            <a href="/catalogs/priyabadal-kitchen.pdf?v=3" download>
              Download Kitchen PDF
            </a>
          </p>
        </aside>
      ) : null}

      <div className="shop__toolbar">
        <label className="shop__search">
          <span className="sr-only">Search products</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this collection…"
          />
        </label>
        <label className="shop__sort">
          <span>Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
          >
            <option value="featured">Newest first</option>
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
