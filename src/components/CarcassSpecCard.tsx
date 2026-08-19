import { Link } from 'react-router-dom'
import {
  CARCASS_ASSEMBLY_DRAWING_SRC,
  CARCASS_CONSTRUCTION_SHORT,
  CARCASS_SPEC_ROWS,
} from '../data/carcassSpec'
import './CarcassSpecCard.css'

type Props = {
  compact?: boolean
  className?: string
}

/** Shared carcass construction callout (no separate planner / guide pages) */
export function CarcassSpecCard({ compact = false, className = '' }: Props) {
  return (
    <aside
      className={`carcass-spec ${compact ? 'carcass-spec--compact' : ''} ${className}`.trim()}
      aria-label="Carcass construction specification"
    >
      <div className="carcass-spec__copy">
        <p className="carcass-spec__eyebrow">Carcass standard</p>
        <h3>{CARCASS_CONSTRUCTION_SHORT}</h3>
        {!compact ? (
          <ul>
            {CARCASS_SPEC_ROWS.map((row) => (
              <li key={row.label}>
                <strong>{row.label}:</strong> {row.value}
              </li>
            ))}
          </ul>
        ) : (
          <p>
            BWP plywood carcass with both-side 1 mm laminate and 2 mm edge banding. Confirm
            bay layout and install notes on WhatsApp.
          </p>
        )}
        <div className="carcass-spec__links">
          <a className="btn btn--outline" href={CARCASS_ASSEMBLY_DRAWING_SRC} download>
            Download drawing
          </a>
          <Link className="btn btn--dark" to="/chat">
            Ask AI Chat
          </Link>
        </div>
      </div>
    </aside>
  )
}
