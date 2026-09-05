import type { OrderLine } from '../types'
import { formatInr } from '../types'
import { summarizeLineFinish } from '../jobSheet'

/** Full product job-sheet card shown to every department */
export function JobSheetCard({
  line,
  index,
  compact = false,
}: {
  line: OrderLine
  index: number
  compact?: boolean
}) {
  const size =
    [line.widthFt, line.heightFt, line.depthFt].some((n) => n) || line.thicknessMm
      ? [
          [line.widthFt, line.heightFt, line.depthFt].some((n) => n)
            ? `${line.widthFt || '—'}×${line.heightFt || '—'}×${line.depthFt || '—'} ft`
            : null,
          line.thicknessMm ? `${line.thicknessMm} mm thick` : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : null

  return (
    <article className={`ws-jobcard ${compact ? 'ws-jobcard--compact' : ''}`}>
      <header>
        <p className="ws-eyebrow">Product {index + 1}</p>
        <h3>{line.productName || 'Untitled product'}</h3>
        <p className="ws-hint">
          Qty {line.qty}
          {line.category ? ` · ${line.category}` : ''}
          {line.sku ? ` · ${line.sku}` : ''}
          {!compact ? ` · ${formatInr(line.unitPrice)}` : ''}
        </p>
      </header>

      <dl className="ws-jobcard__grid">
        {size ? (
          <>
            <dt>Size / thickness</dt>
            <dd>{size}</dd>
          </>
        ) : null}
        {line.finishType ? (
          <>
            <dt>Finish type</dt>
            <dd>{line.finishType}</dd>
          </>
        ) : null}
        {line.viewSide && line.viewSide !== 'na' ? (
          <>
            <dt>View / face</dt>
            <dd>{line.viewSide}</dd>
          </>
        ) : null}
        {line.coatingCode || line.coatingColor ? (
          <>
            <dt>Coating</dt>
            <dd>
              {[line.coatingCode ? `No. ${line.coatingCode}` : null, line.coatingColor]
                .filter(Boolean)
                .join(' · ')}
            </dd>
          </>
        ) : null}
        {line.innerLaminate ? (
          <>
            <dt>Inner laminate</dt>
            <dd>Paste {line.innerLaminate}</dd>
          </>
        ) : null}
        {line.outerLaminate ? (
          <>
            <dt>Outer laminate</dt>
            <dd>Paste {line.outerLaminate}</dd>
          </>
        ) : null}
        {line.leatherCode || line.leatherColor ? (
          <>
            <dt>Leather</dt>
            <dd>{[line.leatherCode, line.leatherColor].filter(Boolean).join(' · ')}</dd>
          </>
        ) : null}
        {line.finish && !summarizeLineFinish(line).includes(line.finish) ? (
          <>
            <dt>Finish note</dt>
            <dd>{line.finish}</dd>
          </>
        ) : null}
        {line.notes ? (
          <>
            <dt>Special instruction</dt>
            <dd>{line.notes}</dd>
          </>
        ) : null}
      </dl>

      {!compact && summarizeLineFinish(line) ? (
        <p className="ws-jobcard__summary">{summarizeLineFinish(line)}</p>
      ) : null}
    </article>
  )
}

export function JobSheetList({
  lines,
  compact = false,
  title = 'Client job sheet — all products in this order',
}: {
  lines: OrderLine[]
  compact?: boolean
  title?: string
}) {
  if (!lines.length) return <p className="ws-hint">No products on this order yet.</p>
  return (
    <div className="ws-jobsheet">
      <h3>{title}</h3>
      <p className="ws-hint">
        One client order can have many products. Each product may have different coating, laminate,
        leather, thickness and view — departments must follow that product’s detail.
      </p>
      <div className="ws-jobsheet__list">
        {lines.map((line, i) => (
          <JobSheetCard key={line.id || i} line={line} index={i} compact={compact} />
        ))}
      </div>
    </div>
  )
}
