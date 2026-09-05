import type { OrderLine } from './types'

/** Build a short finish summary from detailed specs */
export function summarizeLineFinish(line: Partial<OrderLine>): string {
  const bits: string[] = []
  if (line.finishType && line.finishType !== 'other') bits.push(line.finishType)
  if (line.coatingColor || line.coatingCode) {
    bits.push(
      `Coat ${[line.coatingCode, line.coatingColor].filter(Boolean).join(' ')}`.trim(),
    )
  }
  if (line.innerLaminate) bits.push(`Inner lam ${line.innerLaminate}`)
  if (line.outerLaminate) bits.push(`Outer lam ${line.outerLaminate}`)
  if (line.leatherCode || line.leatherColor) {
    bits.push(`Leather ${[line.leatherCode, line.leatherColor].filter(Boolean).join(' ')}`.trim())
  }
  if (line.viewSide && line.viewSide !== 'na') bits.push(`View: ${line.viewSide}`)
  if (line.thicknessMm) bits.push(`${line.thicknessMm}mm`)
  if (line.finish?.trim() && !bits.length) return line.finish.trim()
  return bits.join(' · ') || line.finish?.trim() || ''
}

/** Full job-sheet text for one product — used by every department */
export function formatLineJobSheet(line: OrderLine, index?: number): string {
  const rows: string[] = []
  const title = index != null ? `Product ${index + 1}: ${line.productName}` : line.productName
  rows.push(title)
  if (line.category) rows.push(`Category: ${line.category}`)
  if (line.sku) rows.push(`SKU: ${line.sku}`)
  rows.push(`Qty: ${line.qty}`)
  if (line.thicknessMm) rows.push(`Thickness: ${line.thicknessMm} mm`)
  if ([line.widthFt, line.heightFt, line.depthFt].some((n) => n)) {
    rows.push(
      `Size: ${line.widthFt || '—'} × ${line.heightFt || '—'} × ${line.depthFt || '—'} ft`,
    )
  }
  if (line.finishType) rows.push(`Finish type: ${line.finishType}`)
  if (line.viewSide && line.viewSide !== 'na') rows.push(`View / face: ${line.viewSide}`)
  if (line.coatingCode || line.coatingColor) {
    rows.push(
      `Coating: ${[line.coatingCode && `No. ${line.coatingCode}`, line.coatingColor]
        .filter(Boolean)
        .join(' · ')}`,
    )
  }
  if (line.innerLaminate) rows.push(`Inner laminate paste: ${line.innerLaminate}`)
  if (line.outerLaminate) rows.push(`Outer laminate paste: ${line.outerLaminate}`)
  if (line.leatherCode || line.leatherColor) {
    rows.push(
      `Leather: ${[line.leatherCode, line.leatherColor].filter(Boolean).join(' · ')}`,
    )
  }
  if (line.finish) rows.push(`Finish note: ${line.finish}`)
  if (line.notes) rows.push(`Special: ${line.notes}`)
  rows.push(`Rate: ₹${Number(line.unitPrice || 0).toLocaleString('en-IN')}`)
  return rows.join('\n')
}

export function formatOrderJobSheet(lines: OrderLine[]): string {
  return lines.map((l, i) => formatLineJobSheet(l, i)).join('\n\n')
}
