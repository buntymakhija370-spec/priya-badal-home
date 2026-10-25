import { Link, useParams } from 'react-router-dom'
import {
  BOXBHANDAAR_CATEGORIES,
  BOXBHANDAAR_PRODUCTS,
  boxWhatsAppUrl,
  formatBoxPrice,
  getBoxCategory,
  getProductsByCategory,
} from '../data/boxbhandaar'
import './BoxbhandaarShopPage.css'

export function BoxbhandaarShopPage() {
  const { categoryId } = useParams()
  const category = categoryId ? getBoxCategory(categoryId) : undefined
  const products = categoryId
    ? getProductsByCategory(categoryId)
    : BOXBHANDAAR_PRODUCTS

  if (categoryId && !category) {
    return (
      <main className="bb-shop">
        <div className="bb-shop__frame">
          <p className="bb-kicker">Shop</p>
          <h1>Category not found</h1>
          <Link className="bb-btn bb-btn--quiet" to="/boxbhandaar/shop">
            View all products
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="bb-shop">
      <div className="bb-shop__frame">
        <p className="bb-kicker">Shop</p>
        <h1>{category ? category.name : 'All boxes'}</h1>
        <p className="bb-lead">
          {category
            ? category.description
            : 'Eighteen pieces across crates, boxes, trays, carriers, organizers, planters, and workspace.'}
        </p>

        <div className="bb-shop__filters" role="navigation" aria-label="Categories">
          <Link
            className={`bb-shop__chip ${!categoryId ? 'is-active' : ''}`}
            to="/boxbhandaar/shop"
          >
            All
          </Link>
          {BOXBHANDAAR_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              className={`bb-shop__chip ${categoryId === cat.id ? 'is-active' : ''}`}
              to={`/boxbhandaar/shop/${cat.id}`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        <div className="bb-shop__grid">
          {products.map((product, index) => (
            <article key={product.id} className="bb-box">
              <Link className="bb-box__media" to={`/boxbhandaar/box/${product.id}`}>
                <img
                  src={product.image}
                  alt=""
                  loading={index < 4 ? 'eager' : 'lazy'}
                />
                <span className="bb-box__index">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </Link>
              <div className="bb-box__body">
                <p className="bb-box__cat">
                  {getBoxCategory(product.categoryId)?.name}
                </p>
                <div className="bb-box__titles">
                  <h2>
                    <Link to={`/boxbhandaar/box/${product.id}`}>{product.name}</Link>
                  </h2>
                  <p>{product.short}</p>
                </div>
                <div className="bb-box__meta">
                  <p className="bb-box__price">{formatBoxPrice(product.price)}</p>
                  <p className="bb-box__serves">{product.size}</p>
                </div>
                <div className="bb-box__actions">
                  <Link className="bb-btn bb-btn--quiet" to={`/boxbhandaar/box/${product.id}`}>
                    Details
                  </Link>
                  <a
                    className="bb-btn bb-btn--primary"
                    href={boxWhatsAppUrl(product)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Order
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
