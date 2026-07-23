import { Link } from 'react-router-dom'
import { formatPrice } from '../data/catalog'
import { getAllProducts } from '../lib/products'
import { useCartActions, useCartItems } from '../hooks/useCart'
import { clearCart } from '../lib/cart'
import { describeConfig } from '../lib/pricing'
import './CartPage.css'

export function CartPage() {
  const items = useCartItems()
  const { setCartQuantity, removeFromCart } = useCartActions()
  const products = getAllProducts()

  const rows = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId)
      if (!product) return null
      return {
        item,
        product,
        lineTotal: item.unitPrice * item.quantity,
        summary: describeConfig(product.categoryId, item.config),
      }
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))

  const total = rows.reduce((sum, row) => sum + row.lineTotal, 0)

  return (
    <main className="cart page-pad">
      <header className="cart__header">
        <p className="eyebrow">Bag</p>
        <h1>Your cart</h1>
        <p>
          {rows.length === 0
            ? 'Your cart is empty — browse the shop to add pieces.'
            : `${rows.length} configured item${rows.length === 1 ? '' : 's'}.`}
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="cart__empty">
          <Link className="btn btn--dark" to="/shop">
            Browse shop
          </Link>
        </div>
      ) : (
        <>
          <ul className="cart__list">
            {rows.map(({ item, product, lineTotal, summary }) => (
              <li key={item.id} className="cart__row">
                <Link className="cart__media" to={`/product/${product.id}`}>
                  <img src={product.image} alt="" />
                </Link>
                <div className="cart__info">
                  <h2>
                    <Link to={`/product/${product.id}`}>{product.name}</Link>
                  </h2>
                  <p className="cart__config">{summary}</p>
                  <p className="cart__unit">{formatPrice(item.unitPrice)} each</p>
                  <div className="cart__controls">
                    <label>
                      Qty
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          setCartQuantity(
                            item.id,
                            Math.max(1, Number(e.target.value) || 1),
                          )
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="cart__remove"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="cart__line">{formatPrice(lineTotal)}</p>
              </li>
            ))}
          </ul>

          <div className="cart__summary">
            <div>
              <p className="cart__total-label">Total</p>
              <p className="cart__total">{formatPrice(total)}</p>
            </div>
            <div className="cart__summary-actions">
              <button type="button" className="btn btn--outline" onClick={() => clearCart()}>
                Clear cart
              </button>
              <Link className="btn btn--dark" to="/chat">
                Ask AI about my picks
              </Link>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
