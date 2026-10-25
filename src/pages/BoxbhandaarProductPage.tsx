import { Link, Navigate, useParams } from 'react-router-dom'
import {
  boxWhatsAppUrl,
  formatBoxPrice,
  getBoxProduct,
} from '../data/boxbhandaar'
import './BoxbhandaarProductPage.css'

export function BoxbhandaarProductPage() {
  const { productId = '' } = useParams()
  const product = getBoxProduct(productId)

  if (!product) {
    return <Navigate to="/boxbhandaar" replace />
  }

  return (
    <main className="bb-pdp">
      <div className="bb-pdp__frame">
        <Link className="bb-pdp__back" to="/boxbhandaar" state={{ scrollTo: 'boxes' }}>
          ← All boxes
        </Link>

        <div className="bb-pdp__grid">
          <div className="bb-pdp__media">
            <img src={product.image} alt={product.name} />
            <div className="bb-pdp__film" aria-hidden="true">
              <video
                src="/boxbhandaar/videos/film-detail.mp4"
                poster="/boxbhandaar/videos/film-detail.jpg"
                muted
                playsInline
                autoPlay
                loop
                preload="metadata"
              />
            </div>
          </div>

          <div className="bb-pdp__copy">
            <p className="bb-kicker">Festive box</p>
            <h1>{product.name}</h1>
            <p className="bb-pdp__short">{product.short}</p>
            <p className="bb-pdp__price">{formatBoxPrice(product.price)}</p>
            <p className="bb-pdp__desc">{product.description}</p>
            <p className="bb-pdp__serves">Serves · {product.serves}</p>

            <div className="bb-pdp__actions">
              <a
                className="bb-btn bb-btn--primary"
                href={boxWhatsAppUrl(product)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Order on WhatsApp
              </a>
              <Link
                className="bb-btn bb-btn--quiet"
                to="/boxbhandaar"
                state={{ scrollTo: 'films' }}
              >
                Watch films
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
