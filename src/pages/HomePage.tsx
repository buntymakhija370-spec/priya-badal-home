import { Link } from 'react-router-dom'
import { useMemo, useRef } from 'react'
import { categories } from '../data/catalog'
import { getAllProducts } from '../lib/products'
import { ProductCard } from '../components/ProductCard'
import './HomePage.css'

const CATEGORY_CLIP_SECONDS = 10

function CategoryVideo({
  src,
  poster,
}: {
  src: string
  poster: string
}) {
  const ref = useRef<HTMLVideoElement>(null)

  return (
    <video
      ref={ref}
      className="home-cat__video"
      src={src}
      poster={poster}
      muted
      playsInline
      autoPlay
      loop
      preload="metadata"
      onTimeUpdate={() => {
        const el = ref.current
        if (!el) return
        if (el.currentTime >= CATEGORY_CLIP_SECONDS) {
          el.currentTime = 0
          void el.play().catch(() => undefined)
        }
      }}
      onLoadedMetadata={() => {
        void ref.current?.play().catch(() => undefined)
      }}
    />
  )
}

export function HomePage() {
  const featured = useMemo(() => getAllProducts().slice(0, 4), [])

  return (
    <main>
      <section className="hero">
        <div className="hero__media" aria-hidden="true">
          <div className="hero__wash" />
          <video
            className="hero__image"
            src="/products/categories/kitchen.mp4"
            poster="/products/categories/kitchen.jpg"
            muted
            playsInline
            autoPlay
            loop
            preload="metadata"
          />
        </div>
        <div className="hero__content">
          <div className="hero__brand reveal reveal--1">
            <img
              className="hero__logo"
              src="/brand/priyabadal-homes-logo.svg"
              alt="Priyabadal Homes — Shutters, Doors, Wall Panels"
            />
          </div>
          <h1 className="hero__headline reveal reveal--2">
            Made-to-measure interiors with clear prices.
          </h1>
          <p className="hero__lede reveal reveal--3">
            Shop wardrobes, kitchens, doors, panels, and silai bunai. Customise
            sizes, add to cart, and get a WhatsApp quote.
          </p>
          <div className="hero__actions reveal reveal--4">
            <Link className="btn btn--primary" to="/shop">
              Shop now
            </Link>
            <Link className="btn btn--ghost" to="/product/geometric-pu-wardrobe">
              View wardrobe
            </Link>
          </div>
        </div>
      </section>

      <section className="home-trust" aria-label="Why shop with us">
        <ul>
          <li>
            <strong>Made to measure</strong>
            <span>Sized to your wall in feet</span>
          </li>
          <li>
            <strong>Transparent pricing</strong>
            <span>See estimates before you enquire</span>
          </li>
          <li>
            <strong>On-site assembly</strong>
            <span>Carpenter installation support</span>
          </li>
          <li>
            <strong>WhatsApp quotes</strong>
            <span>Confirm orders on chat</span>
          </li>
        </ul>
      </section>

      <section className="home-cats" aria-label="Shop categories">
        <div className="home-cats__stack">
          {categories.map((cat) => (
            <Link key={cat.id} className="home-cat" to={`/shop/${cat.id}`}>
              {cat.video ? (
                <CategoryVideo src={cat.video} poster={cat.image} />
              ) : (
                <img src={cat.image} alt="" loading="lazy" />
              )}
              <span className="home-cat__label">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-featured page-pad">
        <div className="home-featured__head">
          <div>
            <p className="eyebrow">Featured</p>
            <h2>Popular pieces</h2>
          </div>
          <Link className="btn btn--outline" to="/shop">
            View all
          </Link>
        </div>
        <div className="product-grid">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="home-cta">
        <p className="eyebrow">AI Interior Guide</p>
        <h2>Describe a room. Get pieces with prices.</h2>
        <p>
          Chat about style, budget, and space — the guide recommends products
          from this collection.
        </p>
        <Link className="btn btn--dark" to="/chat">
          Open chat board
        </Link>
      </section>
    </main>
  )
}
