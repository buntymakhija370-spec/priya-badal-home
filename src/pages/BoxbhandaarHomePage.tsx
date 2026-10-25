import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import {
  BOXBHANDAAR_BRAND,
  BOXBHANDAAR_CATEGORIES,
  BOXBHANDAAR_FILMS,
  BOXBHANDAAR_PRODUCTS,
  BOXBHANDAAR_TAGLINE,
  boxWhatsAppUrl,
  formatBoxPrice,
  getBoxCategory,
} from '../data/boxbhandaar'
import './BoxbhandaarHomePage.css'

function FilmCard({
  title,
  caption,
  src,
  poster,
  href,
}: {
  title: string
  caption: string
  src: string
  poster: string
  href?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void el.play().catch(() => undefined)
        else el.pause()
      },
      { threshold: 0.45 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const body = (
    <>
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
    </>
  )

  if (href) {
    return (
      <Link className="bb-film bb-film--link" to={href}>
        {body}
      </Link>
    )
  }

  return <article className="bb-film">{body}</article>
}

export function BoxbhandaarHomePage() {
  const featured = BOXBHANDAAR_PRODUCTS.slice(0, 6)

  return (
    <main className="bb-home">
      <section className="bb-hero" aria-label={`${BOXBHANDAAR_BRAND} home`}>
        <div className="bb-hero__media" aria-hidden="true">
          <video
            className="bb-hero__video"
            src="/boxbhandaar/product-videos/pastel-cutout-crates.mp4"
            poster="/boxbhandaar/product-videos/pastel-cutout-crates.jpg"
            muted
            playsInline
            autoPlay
            loop
            preload="auto"
          />
          <div className="bb-hero__wash" />
        </div>
        <div className="bb-hero__content">
          <p className="bb-hero__eyebrow">Standalone box brand</p>
          <h1 className="bb-hero__brand">{BOXBHANDAAR_BRAND}</h1>
          <p className="bb-hero__tag">{BOXBHANDAAR_TAGLINE}</p>
          <p className="bb-hero__lede">
            Eighteen wooden crates, trays, carriers, and organizers — photographed
            as they are, sorted into clear categories, ordered on WhatsApp.
          </p>
          <div className="bb-hero__actions">
            <Link className="bb-btn bb-btn--primary" to="/boxbhandaar/shop">
              Shop the collection
            </Link>
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

      <section
        id="categories"
        className="bb-section bb-cats"
        aria-labelledby="bb-cats-title"
      >
        <p className="bb-kicker">Browse</p>
        <h2 id="bb-cats-title">Categories from the photographs</h2>
        <p className="bb-lead">
          Grouped by what each piece is made to do — not by festival alone.
        </p>
        <div className="bb-cats__grid">
          {BOXBHANDAAR_CATEGORIES.map((cat) => {
            const count = BOXBHANDAAR_PRODUCTS.filter((p) => p.categoryId === cat.id)
              .length
            return (
              <Link
                key={cat.id}
                className="bb-cat"
                to={`/boxbhandaar/shop/${cat.id}`}
              >
                <div className="bb-cat__media">
                  <img src={cat.image} alt="" loading="lazy" />
                </div>
                <div className="bb-cat__copy">
                  <h3>{cat.name}</h3>
                  <p>{cat.short}</p>
                  <span>
                    {count} {count === 1 ? 'piece' : 'pieces'}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
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
              <FilmCard
                title={film.title}
                caption={film.caption}
                src={film.src}
                poster={film.poster}
                href={
                  film.productId
                    ? `/boxbhandaar/box/${film.productId}`
                    : undefined
                }
              />
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
          <p className="bb-kicker">Featured</p>
          <h2 id="bb-boxes-title">From the shelf</h2>
          <p className="bb-lead">A first look at six pieces. Shop all eighteen in the catalogue.</p>
        </div>
        <div className="bb-boxes__grid">
          {featured.map((product, index) => (
            <article key={product.id} className="bb-box">
              <Link className="bb-box__media" to={`/boxbhandaar/box/${product.id}`}>
                <img
                  src={product.image}
                  alt=""
                  loading={index < 2 ? 'eager' : 'lazy'}
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
                  <h3>
                    <Link to={`/boxbhandaar/box/${product.id}`}>{product.name}</Link>
                  </h3>
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
        <div className="bb-boxes__more">
          <Link className="bb-btn bb-btn--quiet" to="/boxbhandaar/shop">
            View all 18 products
          </Link>
        </div>
      </section>

      <section className="bb-cta" aria-labelledby="bb-cta-title">
        <div className="bb-cta__inner">
          <p className="bb-kicker bb-kicker--on-dark">Ready</p>
          <h2 id="bb-cta-title">Order the box that fits the moment.</h2>
          <p>
            Message us with the product name and quantity. We confirm stock, packing,
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
