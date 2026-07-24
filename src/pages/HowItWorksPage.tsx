import { Link } from 'react-router-dom'
import {
  MATERIAL_POINTS,
  MATERIALS_HEADLINE,
  MATERIALS_LEDE,
} from '../data/materials'
import { ORDER_NOTES, ORDER_STEPS } from '../data/orderProcess'
import { WHATSAPP_CHAT_URL, WHATSAPP_DISPLAY } from '../lib/whatsapp'
import './HowItWorksPage.css'

export function HowItWorksPage() {
  return (
    <main className="how page-pad">
      <header className="how__hero">
        <p className="eyebrow">Custom orders</p>
        <h1>How your custom order works</h1>
        <p>
          Every Priyabadal Homes piece is made to measure. Follow these steps from
          choosing a look to carpenter fitting — with clear prices and WhatsApp
          support throughout.
        </p>
        <div className="how__hero-actions">
          <Link className="btn btn--dark" to="/shop">
            Start shopping
          </Link>
          <a
            className="btn btn--outline"
            href={WHATSAPP_CHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp {WHATSAPP_DISPLAY}
          </a>
        </div>
      </header>

      <ol className="how__steps">
        {ORDER_STEPS.map((step, index) => (
          <li key={step.id} className="how__step">
            <span className="how__num" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <h2>{step.title}</h2>
              <p className="how__summary">{step.summary}</p>
              <p className="how__detail">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="how__materials" aria-labelledby="how-materials-title">
        <p className="eyebrow">Materials</p>
        <h2 id="how-materials-title">
          {MATERIALS_HEADLINE.replace('\n', ' ')}
        </h2>
        <p className="how__materials-lede">{MATERIALS_LEDE}</p>
        <ul className="how__materials-list">
          {MATERIAL_POINTS.map((point) => (
            <li key={point.id}>
              <strong>{point.title}</strong>
              <span>{point.body}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="how__notes" aria-labelledby="how-notes-title">
        <h2 id="how-notes-title">Good to know</h2>
        <div className="how__notes-grid">
          {ORDER_NOTES.map((note) => (
            <article key={note.title}>
              <h3>{note.title}</h3>
              <p>{note.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="how__cta">
        <h2>Ready to start your custom order?</h2>
        <p>Pick a product, set your size, and send a WhatsApp quote.</p>
        <div className="how__hero-actions">
          <Link className="btn btn--dark" to="/shop">
            Browse products
          </Link>
          <Link className="btn btn--outline" to="/visualise">
            Visualise in my room
          </Link>
        </div>
      </section>
    </main>
  )
}
