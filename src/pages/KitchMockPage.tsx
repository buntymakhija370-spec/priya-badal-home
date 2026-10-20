import { Link } from 'react-router-dom'
import { shopPath } from '../lib/links'
import './KitchMockPage.css'

const WA_NUMBER = '918109555863'
const WA_DISPLAY = '+91 81095 55863'
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
  'Hi KitchMock — I want to book a 2–3 ft kitchen prototype (₹25,000).',
)}`

const steps = [
  {
    n: '01',
    title: '3D layout',
    text: 'Bring your 2D/3D drawings, or let our in-house design team create your kitchen layout.',
  },
  {
    n: '02',
    title: '2–3 ft prototype',
    text: 'We build a real cabinet section from your plan — actual shutters, finishes, and hardware.',
  },
  {
    n: '03',
    title: 'Factory build',
    text: 'Approve the live module, then our Indore plant fabricates and installs the full kitchen.',
  },
]

const proofs = [
  'Actual shutter paint & laminate finish under real light',
  'Drawer glide, soft-close & hinge feel',
  'Waterproof edge banding you can inspect',
  'Locked cost & timeline before full production',
]

export function KitchMockPage() {
  return (
    <main className="km">
      <section className="km-hero">
        <div className="km-hero__media" aria-hidden="true">
          <video
            className="km-hero__video"
            src="/products/categories/kitchen.mp4"
            poster="/products/categories/kitchen.jpg"
            muted
            playsInline
            autoPlay
            loop
            preload="metadata"
          />
          <div className="km-hero__wash" />
        </div>
        <div className="km-hero__content">
          <p className="km-hero__eyebrow">A dedicated venture of Priyabadal Homes</p>
          <h1 className="km-hero__brand">KitchMock</h1>
          <p className="km-hero__tag">See it. Touch it. Then build it.</p>
          <p className="km-hero__lede">
            Central India’s prototype-led modular kitchen brand — headquartered in
            Indore. Test a real 2–3 ft cabinet before you commit to the full kitchen.
          </p>
          <div className="km-hero__actions">
            <a className="km-btn km-btn--primary" href={WA_URL} target="_blank" rel="noopener noreferrer">
              Book prototype · ₹25,000
            </a>
            <Link className="km-btn km-btn--ghost" to={shopPath('kitchmock')}>
              Explore kitchen looks
            </Link>
            <a
              className="km-btn km-btn--ghost"
              href="/catalogs/kitchmock-brand-pitch.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              Pitch PDF
            </a>
          </div>
        </div>
      </section>

      <section className="km-section km-concept" aria-labelledby="km-concept-title">
        <p className="km-kicker">01 · The core concept</p>
        <h2 id="km-concept-title">Zero guesswork</h2>
        <p className="km-lead">
          Traditional brands ask for big advances on 3D renders and tiny swatches.
          KitchMock builds a functional 2–3 ft cabinet module from your layout first —
          then you decide.
        </p>
        <div className="km-compare" role="list">
          <article className="km-compare__card km-compare__card--old" role="listitem">
            <p className="km-compare__label">Old way</p>
            <h3>3D &amp; catalog guesswork</h3>
            <ul>
              <li>Screen renders only</li>
              <li>Tiny 2-inch swatches</li>
              <li>No real drawer feel</li>
              <li>High advance risk</li>
            </ul>
          </article>
          <article className="km-compare__card km-compare__card--new" role="listitem">
            <p className="km-compare__label">KitchMock way</p>
            <h3>Real 2–3 ft prototype</h3>
            <ul>
              <li>Actual chosen shutters</li>
              <li>Exact 3D drawing specs</li>
              <li>Live cabinet unit to touch</li>
              <li>Certainty before factory build</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="km-section km-journey" aria-labelledby="km-journey-title">
        <p className="km-kicker">02 · Customer journey</p>
        <h2 id="km-journey-title">From idea to reality</h2>
        <ol className="km-steps">
          {steps.map((s) => (
            <li key={s.n} className="km-steps__item">
              <span className="km-steps__n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="km-section km-policy" aria-labelledby="km-policy-title">
        <p className="km-kicker">03 · Confidence policy</p>
        <h2 id="km-policy-title">We believe when you believe us</h2>
        <p className="km-lead">
          Start with just <strong>₹25,000</strong> — no large upfront advance. Inspect a
          live 2–3 ft unit with your chosen shutters.
        </p>
        <div className="km-policy__grid">
          <article className="km-policy__card">
            <p className="km-policy__result">₹25,000 back</p>
            <h3>Approve &amp; confirm</h3>
            <p>
              Proceed with the full kitchen — the entire ₹25,000 is refunded / adjusted
              in your order.
            </p>
          </article>
          <article className="km-policy__card">
            <p className="km-policy__result">₹20,000 back</p>
            <h3>Not right? Walk away</h3>
            <p>
              Withdraw anytime. You receive ₹20,000 back; only ₹5,000 covers prototype
              material and fabrication.
            </p>
          </article>
        </div>
        <ul className="km-proofs">
          {proofs.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="km-section km-plant" aria-labelledby="km-plant-title">
        <p className="km-kicker">04 · Indore manufacturing</p>
        <h2 id="km-plant-title">Backed by Priyabadal Homes</h2>
        <p className="km-lead">
          80+ team · automated factory &amp; design studio · 6+ machine lines · 3 dust-free
          paint booths. Zero third-party carpentry outsourcing.
        </p>
        <div className="km-stats" role="list">
          <div role="listitem">
            <strong>80+</strong>
            <span>Designers, engineers &amp; craftsmen</span>
          </div>
          <div role="listitem">
            <strong>6+</strong>
            <span>Machine lines · press, nesting, edge, CNC, laser</span>
          </div>
          <div role="listitem">
            <strong>3</strong>
            <span>Pressurized PU paint booths</span>
          </div>
        </div>
      </section>

      <section className="km-section km-looks" aria-labelledby="km-looks-title">
        <p className="km-kicker">05 · Kitchen looks</p>
        <h2 id="km-looks-title">Explore the KitchMock range</h2>
        <p className="km-lead">
          Browse modular kitchen façades on the Priyabadal Homes shop — then book your
          live prototype on WhatsApp.
        </p>
        <div className="km-hero__actions">
          <Link className="km-btn km-btn--primary" to={shopPath('kitchmock')}>
            Shop KitchMock kitchens
          </Link>
          <a className="km-btn km-btn--ghost" href={WA_URL} target="_blank" rel="noopener noreferrer">
            WhatsApp {WA_DISPLAY}
          </a>
        </div>
      </section>

      <section className="km-cta" aria-labelledby="km-cta-title">
        <p className="km-kicker">Get started</p>
        <h2 id="km-cta-title">Ready to inspect your prototype?</h2>
        <p>
          Studio: D2, Ram Nagar, Behind Omni Garden, Opp. Harsh Hyundai Service Centre,
          Radisson, Indore
        </p>
        <p className="km-cta__meta">
          WhatsApp {WA_DISPLAY} · Instagram{' '}
          <a href="https://instagram.com/kitchmock" target="_blank" rel="noopener noreferrer">
            @kitchmock
          </a>
        </p>
        <a className="km-btn km-btn--primary" href={WA_URL} target="_blank" rel="noopener noreferrer">
          Book your live prototype
        </a>
        <p className="km-cta__parent">
          <Link to="/">Priyabadal Homes</Link> · full interiors catalogue
        </p>
      </section>
    </main>
  )
}
