import { Link } from 'react-router-dom'
import {
  CARCASS_ASSEMBLY_DRAWING_SRC,
  CARCASS_ASSEMBLY_PATH,
  CARCASS_ASSEMBLY_QR_SRC,
  CARCASS_CONSTRUCTION_SHORT,
  CARCASS_SPEC_ROWS,
} from '../data/carcassSpec'
import './CarcassSpecCard.css'

type Props = {
  compact?: boolean
  className?: string
}

/** Shared carcass construction + QR / drawing callout */
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
            BWP plywood carcass with both-side 1 mm laminate and 2 mm edge banding. Scan the QR
            for the installation drawing and assembly steps.
          </p>
        )}
        <div className="carcass-spec__links">
          <Link className="btn btn--dark" to={CARCASS_ASSEMBLY_PATH}>
            Assembly guide &amp; drawing
          </Link>
          <a className="btn btn--outline" href={CARCASS_ASSEMBLY_DRAWING_SRC} download>
            Download drawing
          </a>
        </div>
      </div>
      <div className="carcass-spec__qr">
        <img
          src={CARCASS_ASSEMBLY_QR_SRC}
          alt="QR code for Priyabadal carcass assembly guide"
        />
        <span>Scan to assemble</span>
      </div>
    </aside>
  )
}
