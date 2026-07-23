import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { ProductCard } from '../components/ProductCard'
import { useFavoriteIds } from '../hooks/useFavorites'
import { getAllProducts } from '../lib/products'
import './FavoritesPage.css'

export function FavoritesPage() {
  const ids = useFavoriteIds()
  const products = useMemo(() => {
    const all = getAllProducts()
    return ids
      .map((id) => all.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
  }, [ids])

  return (
    <main className="favorites page-pad">
      <header className="favorites__header">
        <p className="eyebrow">Saved</p>
        <h1>Favorites</h1>
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
