import { Link, Navigate, useParams } from 'react-router-dom'
import {
  BOXBHANDAAR_PRODUCTS,
  boxWhatsAppUrl,
  formatBoxPrice,
  getBoxCategory,
  getBoxProduct,
} from '../data/boxbhandaar'
import './BoxbhandaarProductPage.css'

export function BoxbhandaarProductPage() {
  const { productId = '' } = useParams()
  const product = getBoxProduct(productId)

  if (!product) {
    return <Navigate to="/boxbhandaar/shop" replace />
  }

  const category = getBoxCategory(product.categoryId)
  const related = BOXBHANDAAR_PRODUCTS.filter(
    (p) => p.categoryId === product.categoryId && p.id !== product.id,
  ).slice(0, 3)

  return (
    <main className="bb-pdp">
      <div className="bb-pdp__frame">
        <Link className="bb-pdp__back" to={category ? `/boxbhandaar/shop/${category.id}` : '/boxbhandaar/shop'}>
          ← {category ? category.name : 'All boxes'}
        </Link>

        <div className="bb-pdp__grid">
          <div className="bb-pdp__media">
            <img src={product.image} alt={product.name} />
          </div>

          <div className="bb-pdp__copy">
            <p className="bb-kicker">{category?.name ?? 'Box'}</p>
            <h1>{product.name}</h1>
            <p className="bb-pdp__short">{product.short}</p>
            <p className="bb-pdp__price">{formatBoxPrice(product.price)}</p>
            <p className="bb-pdp__desc">{product.description}</p>
            <dl className="bb-pdp__specs">
              <div>
                <dt>Size</dt>
                <dd>{product.size}</dd>
              </div>
              <div>
                <dt>Finish</dt>
                <dd>{product.finish}</dd>
              </div>
            </dl>

            <div className="bb-pdp__actions">
              <a
                className="bb-btn bb-btn--primary"
                href={boxWhatsAppUrl(product)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Order on WhatsApp
              </a>
              <Link className="bb-btn bb-btn--quiet" to="/boxbhandaar/shop">
                Shop all
              </Link>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="bb-pdp__related" aria-labelledby="bb-related-title">
            <h2 id="bb-related-title">More in {category?.name}</h2>
            <div className="bb-pdp__related-grid">
              {related.map((item) => (
                <Link key={item.id} className="bb-pdp__related-card" to={`/boxbhandaar/box/${item.id}`}>
                  <img src={item.image} alt="" loading="lazy" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
