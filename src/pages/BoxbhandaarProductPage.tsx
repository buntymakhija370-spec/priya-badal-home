import { Link, Navigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  BOXBHANDAAR_PRODUCTS,
  BOXBHANDAAR_WA_DISPLAY,
  boxWhatsAppUrl,
  formatBoxPrice,
  getBoxCategory,
  getBoxProduct,
} from '../data/boxbhandaar'
import './BoxbhandaarProductPage.css'

type MediaTab = 'photo' | 'film'

export function BoxbhandaarProductPage() {
  const { productId = '' } = useParams()
  const product = getBoxProduct(productId)
  const [media, setMedia] = useState<MediaTab>('photo')

  useEffect(() => {
    window.scrollTo(0, 0)
    setMedia('photo')
  }, [productId])

  if (!product) {
    return <Navigate to="/boxbhandaar/shop" replace />
  }

  const category = getBoxCategory(product.categoryId)
  const related = BOXBHANDAAR_PRODUCTS.filter(
    (p) => p.categoryId === product.categoryId && p.id !== product.id,
  ).slice(0, 4)
  const hasFilm = Boolean(product.video)
  const orderUrl = boxWhatsAppUrl(product)

  return (
    <main className="bb-pdp">
      <div className="bb-pdp__frame">
        <nav className="bb-pdp__crumb" aria-label="Breadcrumb">
          <Link to="/boxbhandaar/shop">Shop</Link>
          <span aria-hidden="true">/</span>
          {category ? (
            <Link to={`/boxbhandaar/shop/${category.id}`}>{category.name}</Link>
          ) : (
            <span>Box</span>
          )}
          <span aria-hidden="true">/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <section className="bb-pdp__stage" aria-label={product.name}>
          <div className="bb-pdp__gallery">
            <div className="bb-pdp__stage-media">
              {media === 'film' && product.video ? (
                <video
                  key={product.video}
                  className="bb-pdp__stage-video"
                  src={product.video}
                  poster={product.videoPoster ?? product.image}
                  muted
                  playsInline
                  autoPlay
                  loop
                  controls
                  preload="metadata"
                />
              ) : (
                <img
                  className="bb-pdp__stage-photo"
                  src={product.image}
                  alt={product.name}
                />
              )}
            </div>

            {hasFilm && (
              <div className="bb-pdp__thumbs" role="tablist" aria-label="Product media">
                <button
                  type="button"
                  role="tab"
                  aria-selected={media === 'photo'}
                  className={`bb-pdp__thumb ${media === 'photo' ? 'is-active' : ''}`}
                  onClick={() => setMedia('photo')}
                >
                  <img src={product.image} alt="" />
                  <span>Photo</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={media === 'film'}
                  className={`bb-pdp__thumb ${media === 'film' ? 'is-active' : ''}`}
                  onClick={() => setMedia('film')}
                >
                  <img src={product.videoPoster ?? product.image} alt="" />
                  <span>Film</span>
                </button>
              </div>
            )}
          </div>

          <aside className="bb-pdp__buy">
            <p className="bb-pdp__cat">{category?.name ?? 'Box'}</p>
            <h1>{product.name}</h1>
            <p className="bb-pdp__short">{product.short}</p>

            <div className="bb-pdp__price-row">
              <p className="bb-pdp__price">{formatBoxPrice(product.price)}</p>
              <p className="bb-pdp__price-note">Inclusive of taxes · Made to order</p>
            </div>

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
              <div>
                <dt>Order</dt>
                <dd>Confirm on WhatsApp · {BOXBHANDAAR_WA_DISPLAY}</dd>
              </div>
            </dl>

            <div className="bb-pdp__actions">
              <a
                className="bb-btn bb-btn--primary bb-pdp__order"
                href={orderUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Order on WhatsApp
              </a>
              <Link
                className="bb-btn bb-btn--quiet"
                to={category ? `/boxbhandaar/shop/${category.id}` : '/boxbhandaar/shop'}
              >
                Back to {category?.name ?? 'shop'}
              </Link>
            </div>

            <ul className="bb-pdp__trust">
              <li>Message us to confirm finish, fill, and delivery city</li>
              <li>Hand-finished wooden piece — slight grain variation is natural</li>
              <li>No cart checkout — order is confirmed on WhatsApp</li>
            </ul>
          </aside>
        </section>

        {related.length > 0 && (
          <section className="bb-pdp__related" aria-labelledby="bb-related-title">
            <div className="bb-pdp__related-head">
              <div>
                <p className="bb-kicker">Also in this line</p>
                <h2 id="bb-related-title">More {category?.name?.toLowerCase()}</h2>
              </div>
              {category && (
                <Link className="bb-pdp__related-all" to={`/boxbhandaar/shop/${category.id}`}>
                  View all {category.name}
                </Link>
              )}
            </div>
            <div className="bb-pdp__related-grid">
              {related.map((item) => (
                <Link
                  key={item.id}
                  className="bb-pdp__related-card"
                  to={`/boxbhandaar/box/${item.id}`}
                >
                  <span className="bb-pdp__related-media">
                    <img src={item.image} alt="" loading="lazy" />
                  </span>
                  <span className="bb-pdp__related-copy">
                    <span className="bb-pdp__related-name">{item.name}</span>
                    <span className="bb-pdp__related-price">
                      {formatBoxPrice(item.price)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="bb-pdp__bar" aria-hidden={false}>
        <div className="bb-pdp__bar-inner">
          <div className="bb-pdp__bar-copy">
            <p className="bb-pdp__bar-name">{product.name}</p>
            <p className="bb-pdp__bar-price">{formatBoxPrice(product.price)}</p>
          </div>
          <a
            className="bb-btn bb-btn--primary bb-pdp__bar-order"
            href={orderUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Order
          </a>
        </div>
      </div>
    </main>
  )
}
