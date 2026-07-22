import { Link } from 'react-router-dom'
import { categories } from '../data/catalog'
import './HomePage.css'

export function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero__media" aria-hidden="true">
          <div className="hero__wash" />
          <img
            className="hero__image"
            src="https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=2400&q=80"
            alt=""
            width={2400}
            height={1600}
          />
        </div>
        <div className="hero__content">
          <p className="hero__brand reveal reveal--1">Priya Badal</p>
          <h1 className="hero__headline reveal reveal--2">
            Interiors, curated pieces, and an AI guide for your home.
          </h1>
          <p className="hero__lede reveal reveal--3">
            Browse categories, see real prices, add your own product photos, or
            ask the AI guide what fits your room and budget.
          </p>
          <div className="hero__actions reveal reveal--4">
            <Link className="btn btn--primary" to="/shop">
              Browse shop
            </Link>
            <Link className="btn btn--ghost" to="/chat">
              Ask AI guide
            </Link>
          </div>
        </div>
      </section>

      <section className="home-cats">
        <div className="home-cats__intro">
          <p className="eyebrow">Categories</p>
          <h2>Shop by room & style.</h2>
        </div>
        <div className="home-cats__grid">
          {categories.map((cat) => (
            <Link key={cat.id} className="home-cat" to={`/shop/${cat.id}`}>
              <img src={cat.image} alt="" loading="lazy" />
              <span>
                <strong>{cat.name}</strong>
                <em>{cat.subcategories.length} subcategories</em>
              </span>
            </Link>
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
