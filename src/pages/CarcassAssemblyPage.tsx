import { Link } from 'react-router-dom'
import {
  CARCASS_ASSEMBLY_DRAWING_SRC,
  CARCASS_ASSEMBLY_QR_SRC,
  CARCASS_ASSEMBLY_STEPS,
  CARCASS_CONSTRUCTION_DETAIL,
  CARCASS_CONSTRUCTION_SHORT,
  CARCASS_SPEC_ROWS,
} from '../data/carcassSpec'
import './CarcassAssemblyPage.css'

export function CarcassAssemblyPage() {
  return (
    <main className="cguide page-pad">
      <header className="cguide__header">
        <p className="cguide__eyebrow">Carcass assembly guide</p>
        <h1>Easy carcass installation</h1>
        <p className="cguide__lede">
          Every Priyabadal Homes carcass (where listed) is built to one clear standard —{' '}
          <strong>{CARCASS_CONSTRUCTION_SHORT}</strong>. Use this drawing and QR guide on site.
        </p>
        <div className="cguide__actions">
          <Link className="btn btn--dark" to="/carcass">
            Open Carcass Planner
          </Link>
          <a className="btn btn--outline" href={CARCASS_ASSEMBLY_DRAWING_SRC} download>
            Download install drawing
          </a>
        </div>
      </header>

      <section className="cguide__spec" aria-labelledby="cguide-spec">
        <h2 id="cguide-spec">Carcass specification</h2>
        <p>{CARCASS_CONSTRUCTION_DETAIL}</p>
        <dl className="cguide__spec-grid">
          {CARCASS_SPEC_ROWS.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="cguide__visual" aria-labelledby="cguide-draw">
        <div className="cguide__drawing">
          <h2 id="cguide-draw">Installation drawing</h2>
          <figure>
            <img
              src={CARCASS_ASSEMBLY_DRAWING_SRC}
              alt="Exploded carcass installation drawing with sides, top, bottom, shelves and back panel"
            />
            <figcaption>
              Exploded view for easy on-site work — square the box with the back panel before
              hanging shutters.
            </figcaption>
          </figure>
        </div>

        <aside className="cguide__qr" aria-labelledby="cguide-qr">
          <h2 id="cguide-qr">QR for assembling carcass</h2>
          <img
            className="cguide__qr-img"
            src={CARCASS_ASSEMBLY_QR_SRC}
            alt="QR code linking to Priyabadal carcass assembly guide"
          />
          <p>
            Stick / print this QR on the packing slip. Carpenters scan it to open this guide —
            drawings, steps, and construction specs — without calling the showroom.
          </p>
          <p className="cguide__qr-note">
            Printable file:{' '}
            <a href={CARCASS_ASSEMBLY_QR_SRC} download>
              carcass-assembly-qr.svg
            </a>
          </p>
        </aside>
      </section>

      <section className="cguide__steps" aria-labelledby="cguide-steps">
        <h2 id="cguide-steps">Assembly steps</h2>
        <ol>
          {CARCASS_ASSEMBLY_STEPS.map((step) => (
            <li key={step.id}>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="cguide__help">
        <h2>Need a layout drawing for your size?</h2>
        <p>
          Plan bays and get a size-based carcass quote in Carcass Planner, or ask Priya Badal AI /
          WhatsApp for your confirmed feet size.
        </p>
        <div className="cguide__actions">
          <Link className="btn btn--dark" to="/carcass">
            Carcass Planner
          </Link>
          <Link className="btn btn--outline" to="/chat">
            Ask Priya Badal AI
          </Link>
        </div>
      </section>
    </main>
  )
}
