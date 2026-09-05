/**
 * Parse cutting-software material requisition strings.
 * Example from existing software:
 * Size:2440×1220×8,Quantity:32 Inner 809, Size:2440×1220×17,Quantity:47 Inner 809, ...
 */

export type LaminateFace = 'inner' | 'outer' | 'both' | 'plain'

export type BoardLine = {
  lengthMm: number
  widthMm: number
  thicknessMm: number
  quantity: number
  face: LaminateFace
  materialCode: string
  raw: string
}

export type CutRecordDraft = {
  jobName: string
  materialText: string
  sawWidthMm: number
  utilizationPercent: number
  notes?: string
  orderNo?: string
  customerName?: string
}

export type CutTotals = {
  totalSheets: number
  byFace: Record<LaminateFace, number>
  byThickness: Record<string, number>
  byMaterial: Record<string, number>
  areaSqft: number
}

export type CutRecordParsed = CutRecordDraft & {
  id: string
  createdAt: string
  updatedAt: string
  boards: BoardLine[]
  totals: CutTotals
}

const LINE_RE =
  /Size\s*:\s*(\d+(?:\.\d+)?)\s*[×xX*]\s*(\d+(?:\.\d+)?)\s*[×xX*]\s*(\d+(?:\.\d+)?)\s*,\s*Quantity\s*:\s*(\d+)\s*(Inner|Outer|Both)?\s*(\d+)?/gi

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

export function parseMaterialRequisition(text: string): BoardLine[] {
  const boards: BoardLine[] = []
  if (!text?.trim()) return boards
  const re = new RegExp(LINE_RE.source, LINE_RE.flags)
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    const faceRaw = (match[5] || '').toLowerCase()
    const face: LaminateFace =
      faceRaw === 'inner'
        ? 'inner'
        : faceRaw === 'outer'
          ? 'outer'
          : faceRaw === 'both'
            ? 'both'
            : 'plain'
    boards.push({
      lengthMm: Number(match[1]),
      widthMm: Number(match[2]),
      thicknessMm: Number(match[3]),
      quantity: Number(match[4]),
      face,
      materialCode: (match[6] || '').trim(),
      raw: match[0].trim(),
    })
  }
  return boards
}

export function computeCutTotals(boards: BoardLine[]): CutTotals {
  const byFace: Record<LaminateFace, number> = { inner: 0, outer: 0, both: 0, plain: 0 }
  const byThickness: Record<string, number> = {}
  const byMaterial: Record<string, number> = {}
  let totalSheets = 0
  let areaMm2 = 0

  for (const b of boards) {
    totalSheets += b.quantity
    byFace[b.face] += b.quantity
    const th = `${b.thicknessMm}mm`
    byThickness[th] = (byThickness[th] || 0) + b.quantity
    const matKey = b.materialCode
      ? `${b.face === 'plain' ? 'Code' : capitalize(b.face)} ${b.materialCode}`
      : capitalize(b.face)
    byMaterial[matKey] = (byMaterial[matKey] || 0) + b.quantity
    areaMm2 += b.lengthMm * b.widthMm * b.quantity
  }

  return {
    totalSheets,
    byFace,
    byThickness,
    byMaterial,
    areaSqft: round2(areaMm2 / 92903.04),
  }
}

export function buildCutRecord(
  input: CutRecordDraft,
  id = `cut_${Date.now().toString(36)}`,
  createdAt = new Date().toISOString(),
): CutRecordParsed {
  const boards = parseMaterialRequisition(input.materialText)
  return {
    ...input,
    id,
    createdAt,
    updatedAt: createdAt,
    boards,
    totals: computeCutTotals(boards),
  }
}

export const DEMO_MATERIAL_TEXT =
  'Size:2440×1220×8,Quantity:32 Inner 809, Size:2440×1220×17,Quantity:47 Inner 809, Size:2440×1220×17,Quantity:5 1514, Size:2440×1220×17,Quantity:31 Outer 8378, Size:2440×1220×17,Quantity:2 Both 8378'

export function cutRecordWhatsAppText(r: CutRecordParsed) {
  const lines = [
    '*Priyabadal · Cut record*',
    `Job: ${r.jobName}`,
    r.orderNo ? `Order: ${r.orderNo}` : null,
    r.customerName ? `Client: ${r.customerName}` : null,
    `Saw width: ${r.sawWidthMm} mm`,
    `Utilization: ${r.utilizationPercent}%`,
    `Total sheets: ${r.totals.totalSheets} · Area ~ ${r.totals.areaSqft} sqft`,
    '',
    '*Boards*',
    ...r.boards.map(
      (b) =>
        `• ${b.lengthMm}×${b.widthMm}×${b.thicknessMm} · qty ${b.quantity} · ${b.face}${b.materialCode ? ` ${b.materialCode}` : ''}`,
    ),
    '',
    '*By face*',
    `• Inner: ${r.totals.byFace.inner}`,
    `• Outer: ${r.totals.byFace.outer}`,
    `• Both: ${r.totals.byFace.both}`,
    `• Plain/other: ${r.totals.byFace.plain}`,
  ].filter(Boolean) as string[]
  if (r.notes?.trim()) lines.push('', `Notes: ${r.notes.trim()}`)
  return lines.join('\n')
}
