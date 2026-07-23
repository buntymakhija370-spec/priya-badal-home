import { Link } from 'react-router-dom'
import { categories } from '../data/catalog'
import { SITE, whatsappUrl } from '../lib/site'
import './HomePage.css'

const processSteps = [
  {
    n: '01',
    title: 'Choose Your Product',
    text: 'Browse our categories and select the design you love.',
  },
  {
    n: '02',
    title: 'Set Your Size',
    text: 'Enter exact dimensions — we manufacture to your precise measurements.',
  },
  {
    n: '03',
    title: 'Pick Your Colour',
    text: 'Choose from our range or request a custom shade to match your interiors.',
  },
  {
    n: '04',
    title: 'We Craft It',
    text: 'Local artisans handcraft your order with German-precision machines.',
  },
  {
    n: '05',
    title: 'Delivered to You',
    text: 'Carefully packaged and delivered to your doorstep across India.',
  },
]

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
          <p className="hero__brand reveal reveal--1">
            <span>{SITE.shortName}</span>
            <span className="hero__brand-homes">Homes</span>
          </p>
          <h1 className="hero__headline reveal reveal--2">
            Furniture Made to Your Exact Measurements
          </h1>
          <p className="hero__lede reveal reveal--3">
            Custom size · Custom colour · Handcrafted by local artisans
          </p>
          <div className="hero__actions reveal reveal--4">
            <Link className="btn btn--primary" to="/shop">
              Shop Categories
            </Link>
            <a
              className="btn btn--ghost"
              href={whatsappUrl('Hi Priyabadal Homes — I want a custom quote.')}
              target="_blank"
              rel="noreferrer"
            >
              Get Quote
            </a>
          </div>
        </div>
      </section>

      <section className="home-strip" aria-label="Highlights">
        <p>
          <strong>₹200</strong> starting / sq ft
        </p>
        <p>
          <strong>German</strong> technology machines
        </p>
        <p>
          <strong>Indian</strong> artisans
        </p>
        <p>
          <strong>7</strong> categories
        </p>
      </section>

      <section className="home-cats">
        <div className="home-cats__intro">
          <p className="eyebrow">Our Categories</p>
          <h2>Explore custom pieces for every space.</h2>
        </div>
        <div className="home-cats__grid">
          {categories.map((cat) => (
            <Link key={cat.id} className="home-cat" to={`/shop/${cat.id}`}>
              <img src={cat.image} alt="" loading="lazy" />
              <span>
                <strong>{cat.name}</strong>
                <em>
                  {cat.startingFrom
                    ? `From ₹${cat.startingFrom.toLocaleString('en-IN')} / sq ft`
                    : `${cat.subcategories.length} collections`}
                </em>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-process">
        <div className="home-process__intro">
          <p className="eyebrow">The Process</p>
          <h2>How your custom order works</h2>
        </div>
        <ol className="home-process__list">
          {processSteps.map((step) => (
            <li key={step.n}>
              <span className="home-process__n">{step.n}</span>
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-cta">
        <p className="eyebrow">Ready to Order</p>
        <h2>Share your size, colour, and product — get a quote in 24 hours.</h2>
        <p>
          Call or WhatsApp {SITE.phoneDisplay}, or email {SITE.email}. Our design
          experts help you choose within your budget.
        </p>
        <div className="home-cta__actions">
          <a
            className="btn btn--dark"
            href={whatsappUrl('Hi Priyabadal Homes — I want a custom quote.')}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp Quote
          </a>
          <a className="btn btn--outline-light" href={`tel:${SITE.phoneTel}`}>
            Call Us
          </a>
          <Link className="btn btn--outline-light" to="/chat">
            Ask AI Guide
          </Link>
        </div>
      </section>
    </main>
  )
}
