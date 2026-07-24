import { Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { categories, type Category } from '../data/catalog'
import { MATERIAL_POINTS, MATERIALS_LEDE } from '../data/materials'
import { ORDER_STEPS } from '../data/orderProcess'
import { getAllProducts } from '../lib/products'
import { ProductCard } from '../components/ProductCard'
import './HomePage.css'

const CATEGORY_CLIP_SECONDS = 10

function CategorySlide({
  cat,
  active,
  index,
  total,
}: {
  cat: Category
  active: boolean
  index: number
  total: number
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (active) {
      void el.play().catch(() => undefined)
    } else {
      el.pause()
      el.currentTime = 0
    }
  }, [active])

  return (
    <article className={`home-cat ${active ? 'is-active' : ''}`}>
      <Link className="home-cat__media" to={`/shop/${cat.id}`} aria-label={`Shop ${cat.name}`}>
        {cat.video ? (
          <video
            ref={videoRef}
            className="home-cat__video"
            src={cat.video}
            poster={cat.image}
            muted
            playsInline
            loop
            preload={active ? 'auto' : 'metadata'}
            onTimeUpdate={() => {
              const el = videoRef.current
              if (!el || !active) return
              if (el.currentTime >= CATEGORY_CLIP_SECONDS) {
                el.currentTime = 0
                void el.play().catch(() => undefined)
              }
            }}
          />
        ) : (
          <img src={cat.image} alt="" loading="lazy" />
        )}
        <div className="home-cat__wash" aria-hidden="true" />
        <div className="home-cat__copy">
          <p className="home-cat__count">
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </p>
          <h3 className="home-cat__label">{cat.name}</h3>
          <span className="home-cat__cta">Shop collection</span>
        </div>
      </Link>
    </article>
  )
}

export function HomePage() {
  const featured = useMemo(() => getAllProducts().slice(0, 4), [])
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const nextCategory = categories[(activeIndex + 1) % categories.length]
  const hasNext = activeIndex < categories.length - 1

  useEffect(() => {
    const root = trackRef.current
    if (!root) return

    const slides = Array.from(root.querySelectorAll<HTMLElement>('.home-cat'))
    if (slides.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible?.target) return
        const idx = slides.indexOf(visible.target as HTMLElement)
        if (idx >= 0) setActiveIndex(idx)
      },
      { root, threshold: [0.55, 0.75], rootMargin: '0px -12% 0px -12%' },
    )

    slides.forEach((slide) => observer.observe(slide))
    return () => observer.disconnect()
  }, [])

  const scrollToIndex = (index: number) => {
    const root = trackRef.current
    const slide = root?.querySelectorAll<HTMLElement>('.home-cat')[index]
    slide?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }

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
            <a className="btn btn--ghost" href="#categories">
              Watch collections
            </a>
          </div>
        </div>
      </section>

      <section className="home-cats" id="categories" aria-label="Shop categories">
        <header className="home-cats__head">
          <div>
            <p className="eyebrow">Collections</p>
            <h2>Swipe to explore</h2>
          </div>
          <p className="home-cats__hint">
            {activeIndex + 1} of {categories.length}
            {hasNext ? ` · Next: ${nextCategory?.name}` : ' · End of list'}
          </p>
        </header>

        <div className="home-cats__rail">
          <div ref={trackRef} className="home-cats__track">
            {categories.map((cat, index) => (
              <CategorySlide
                key={cat.id}
                cat={cat}
                active={activeIndex === index}
                index={index}
                total={categories.length}
              />
            ))}
          </div>
        </div>

        <div className="home-cats__footer">
          <div className="home-cats__dots" role="tablist" aria-label="Category slides">
            {categories.map((cat, index) => (
              <button
                key={cat.id}
                type="button"
                className={`home-cats__dot ${activeIndex === index ? 'is-active' : ''}`}
                aria-label={`Show ${cat.name}`}
                aria-current={activeIndex === index ? 'true' : undefined}
                onClick={() => scrollToIndex(index)}
              />
            ))}
          </div>

          {hasNext && nextCategory ? (
            <button
              type="button"
              className="home-cats__next"
              onClick={() => scrollToIndex(activeIndex + 1)}
            >
              <span className="home-cats__next-label">Next</span>
              <strong>{nextCategory.name}</strong>
              <span className="home-cats__next-thumb" aria-hidden="true">
                <img src={nextCategory.image} alt="" />
              </span>
            </button>
          ) : (
            <Link className="home-cats__next home-cats__next--done" to="/shop">
              <span className="home-cats__next-label">Browse</span>
              <strong>All products</strong>
            </Link>
          )}
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

      <section className="home-process" aria-labelledby="home-process-title">
        <div className="home-process__head">
          <div>
            <p className="eyebrow">Custom orders</p>
            <h2 id="home-process-title">How your custom order works</h2>
            <p>
              From choosing a look to carpenter fitting — made to your wall size,
              with WhatsApp quotes at every step.
            </p>
          </div>
          <Link className="btn btn--outline" to="/how-it-works">
            Full details
          </Link>
        </div>
        <ol className="home-process__steps">
          {ORDER_STEPS.map((step, index) => (
            <li key={step.id}>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <strong>{step.title}</strong>
              <em>{step.summary}</em>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-materials" aria-labelledby="home-materials-title">
        <div className="home-materials__media" aria-hidden="true">
          <img
            src="/products/categories/wardrobe.jpg"
            alt=""
            loading="lazy"
          />
          <div className="home-materials__wash" />
        </div>
        <div className="home-materials__content">
          <p className="eyebrow">Materials</p>
          <h2 id="home-materials-title">
            Premium Materials,
            <br />
            Zero Compromise
          </h2>
          <p className="home-materials__lede">{MATERIALS_LEDE}</p>
          <ul className="home-materials__list">
            {MATERIAL_POINTS.map((point) => (
              <li key={point.id}>
                <strong>{point.title}</strong>
                <span>{point.body}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="home-featured">
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
