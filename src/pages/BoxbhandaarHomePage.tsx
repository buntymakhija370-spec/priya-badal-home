import { Link } from 'react-router-dom'
import { useEffect, useRef, type CSSProperties } from 'react'
import {
  BOXBHANDAAR_BRAND,
  BOXBHANDAAR_FILMS,
  BOXBHANDAAR_PARENT,
  BOXBHANDAAR_PRODUCTS,
  BOXBHANDAAR_TAGLINE,
  boxWhatsAppUrl,
  formatBoxPrice,
} from '../data/boxbhandaar'
import './BoxbhandaarHomePage.css'

function FilmCard({
  title,
  caption,
  src,
  poster,
}: {
  title: string
  caption: string
  src: string
  poster: string
}) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void el.play().catch(() => undefined)
        } else {
          el.pause()
        }
      },
      { threshold: 0.45 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <article className="bb-film">
      <div className="bb-film__media">
        <video
          ref={ref}
          className="bb-film__video"
          src={src}
          poster={poster}
          muted
          playsInline
          loop
          preload="metadata"
        />
      </div>
      <div className="bb-film__copy">
        <h3>{title}</h3>
        <p>{caption}</p>
      </div>
    </article>
  )
}

export function BoxbhandaarHomePage() {
  return (
    <main className="bb-home">
      <section className="bb-hero" aria-label={`${BOXBHANDAAR_BRAND} home`}>
        <div className="bb-hero__media" aria-hidden="true">
          <video
            className="bb-hero__video"
            src="/boxbhandaar/videos/wrap-hero.mp4"
            poster="/boxbhandaar/videos/wrap-hero.jpg"
            muted
            playsInline
            autoPlay
            loop
            preload="auto"
          />
          <div className="bb-hero__wash" />
        </div>
        <div className="bb-hero__content">
          <p className="bb-hero__eyebrow">{BOXBHANDAAR_PARENT}</p>
          <h1 className="bb-hero__brand">{BOXBHANDAAR_BRAND}</h1>
          <p className="bb-hero__tag">{BOXBHANDAAR_TAGLINE}</p>
          <p className="bb-hero__lede">
            A short shelf of festive boxes — Diwali, weddings, corporate gifting —
            each one kept simple, filmed with care, and ready to order on WhatsApp.
          </p>
          <div className="bb-hero__actions">
            <a className="bb-btn bb-btn--primary" href="#boxes">
              View the boxes
            </a>
            <a
              className="bb-btn bb-btn--ghost"
              href={boxWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              Order on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="bb-section bb-about" aria-labelledby="bb-about-title">
        <p className="bb-kicker">The idea</p>
        <h2 id="bb-about-title">Fewer boxes. Stronger presence.</h2>
        <p className="bb-lead">
          Boxbhandaar is not a catalogue warehouse. It is a small festive line —
          four boxes, clear prices, and short films that show how each gift feels
          in the hand before you send it.
        </p>
      </section>

      <section
        id="films"
        className="bb-section bb-films"
        aria-labelledby="bb-films-title"
      >
        <div className="bb-films__head">
          <p className="bb-kicker">Films</p>
          <h2 id="bb-films-title">Watch the craft</h2>
          <p className="bb-lead">
            Short loops of wrap, fold, and finish — the interface is the film.
          </p>
        </div>
        <div className="bb-films__rail" role="list">
          {BOXBHANDAAR_FILMS.map((film) => (
            <div key={film.id} role="listitem">
              <FilmCard {...film} />
            </div>
          ))}
        </div>
      </section>

      <section
        id="boxes"
        className="bb-section bb-boxes"
        aria-labelledby="bb-boxes-title"
      >
        <div className="bb-boxes__head">
          <p className="bb-kicker">The collection</p>
          <h2 id="bb-boxes-title">Four festive boxes</h2>
          <p className="bb-lead">Limited line. Order what you need — nothing extra.</p>
        </div>
        <div className="bb-boxes__grid">
          {BOXBHANDAAR_PRODUCTS.map((product, index) => (
            <article
              key={product.id}
              className="bb-box"
              style={{ '--bb-accent': product.accent } as CSSProperties}
            >
              <Link className="bb-box__media" to={`/boxbhandaar/box/${product.id}`}>
                <img src={product.image} alt="" loading={index < 2 ? 'eager' : 'lazy'} />
                <span className="bb-box__index">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </Link>
              <div className="bb-box__body">
                <div className="bb-box__titles">
                  <h3>
                    <Link to={`/boxbhandaar/box/${product.id}`}>{product.name}</Link>
                  </h3>
                  <p>{product.short}</p>
                </div>
                <div className="bb-box__meta">
                  <p className="bb-box__price">{formatBoxPrice(product.price)}</p>
                  <p className="bb-box__serves">{product.serves}</p>
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
      </section>

      <section className="bb-cta" aria-labelledby="bb-cta-title">
        <div className="bb-cta__inner">
          <p className="bb-kicker bb-kicker--on-dark">Ready</p>
          <h2 id="bb-cta-title">Send a box that feels considered.</h2>
          <p>
            Message us with the occasion and quantity. We confirm stock, packing,
            and delivery on WhatsApp.
          </p>
          <a
            className="bb-btn bb-btn--primary"
            href={boxWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            Chat with Boxbhandaar
          </a>
        </div>
      </section>
    </main>
  )
}
