import { Link, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { ProductCard } from '../components/ProductCard'
import { leaveCheckPage } from '../components/BottomNav'
import { useFavoriteIds } from '../hooks/useFavorites'
import { readCheckReturn } from '../lib/checkReturn'
import { getAllProducts } from '../lib/products'
import './FavoritesPage.css'

export function FavoritesPage() {
  const navigate = useNavigate()
  const ids = useFavoriteIds()
  const returnTo = readCheckReturn()
  const products = useMemo(() => {
    const all = getAllProducts()
    return ids
      .map((id) => all.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
  }, [ids])

  return (
    <main className="favorites page-pad">
      <header className="favorites__header">
        <button
          type="button"
          className="favorites__back"
          onClick={() => leaveCheckPage(navigate)}
        >
          ← Back{returnTo ? ' to previous page' : ''}
        </button>
        <p className="eyebrow">Saved</p>
        <h1>Check</h1>
        <p>
          {products.length === 0
            ? 'Tap the Favorite button on any product card to save it here.'
            : `${products.length} saved piece${products.length === 1 ? '' : 's'}.`}
        </p>
      </header>

      {products.length > 0 ? (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="favorites__empty">
          <p>No favorites yet.</p>
          <Link className="btn btn--dark" to="/shop">
            Browse shop
          </Link>
        </div>
      )}
    </main>
  )
}
