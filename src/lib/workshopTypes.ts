/** Shared workshop process + machinery types (single pipeline — no floor categories) */

export const WORK_STAGES = [
  { id: 'designing', label: 'Designing', short: 'Design', code: 'DSN', hint: 'Layout, drawings, CNC / cut list' },
  { id: 'cutting', label: 'Cutting', short: 'Cut', code: 'CUT', hint: 'Panels cut to size' },
  { id: 'edge_bending', label: 'Edge bending', short: 'Edge', code: 'EDG', hint: 'Edge banding' },
  { id: 'boring', label: 'Boring', short: 'Bore', code: 'BOR', hint: 'Hinge / shelf / connector holes' },
  { id: 'pasting', label: 'Pasting', short: 'Paste', code: 'PST', hint: 'Laminate / veneer pasting' },
  { id: 'sending', label: 'Sending', short: 'Send', code: 'SND', hint: 'Send panels to next bay / booth' },
  { id: 'basecoating', label: 'Basecoating', short: 'Base', code: 'BSC', hint: 'Primer / base coat' },
  { id: 'painting_booth_1', label: 'Painting booth 1', short: 'Booth 1', code: 'PB1', hint: 'Paint booth 1 colour & finish' },
  { id: 'painting_booth_2', label: 'Painting booth 2', short: 'Booth 2', code: 'PB2', hint: 'Paint booth 2 colour & finish' },
  { id: 'painting', label: 'Painting', short: 'Paint', code: 'PNT', hint: 'General colour, polish & paint' },
  { id: 'leather_job', label: 'Leather job', short: 'Leather', code: 'LTH', hint: 'Leather wrap, stitch & finish' },
  { id: 'oxidisation', label: 'Oxidisation', short: 'Oxide', code: 'OXD', hint: 'Metal oxide / antique treatment' },
] as const

export type WorkStageId = (typeof WORK_STAGES)[number]['id']

export type WorkerRole = WorkStageId | 'multi'
export type OrderPriority = 'normal' | 'urgent' | 'rush'
export type StageStatus = 'pending' | 'assigned' | 'in_progress' | 'done'

export type Worker = {
  id: string
  code: string
  name: string
  pin: string
  role: WorkerRole
  phone?: string
  active: boolean
  bay?: string
}

export type StageUpdate = {
  id: string
  at: string
  workerId: string
  text: string
  kind: 'started' | 'statement' | 'completed'
}

/** Photo or CAD/PDF attached to an order or stage start. */
export type WorkshopAttachment = {
  id: string
  name: string
  mimeType: string
  dataUrl: string
  uploadedAt: string
  uploadedBy: string
  kind: 'design' | 'start'
}

export type OrderStage = {
  stageId: WorkStageId
  status: StageStatus
  workerId: string | null
  startedAt: string | null
  completedAt: string | null
  statement: string
  updates: StageUpdate[]
  managerNote: string
  /** Scannable Code128 payload for this department stage */
  barcode: string
  /** Compulsory site photo taken by the worker before starting this stage */
  startPhoto: WorkshopAttachment | null
}

export type StatusEvent = {
  id: string
  at: string
  orderId: string
  workerId: string
  stageId: WorkStageId
  kind: 'assigned' | 'started' | 'statement' | 'completed' | 'unassigned' | 'closed'
  message: string
}

/** One custom size line on an order (applies to every product / category). */
export type OrderSizeLine = {
  id: string
  sizeLabel: string
  quantity: number
  /** Raw material for this size — for floor + procurement */
  material: string
  /** Colour / laminate / finish option for this size */
  colour: string
}

/** One manufactured piece — gets its own unique barcode sticker. */
export type OrderPiece = {
  id: string
  sizeLineId: string
  sizeLabel: string
  material: string
  colour: string
  /** 1-based across the whole order */
  pieceIndex: number
  /** 1-based within this size line */
  pieceInSize: number
  barcode: string
  status: 'pending' | 'in_progress' | 'done'
}

export type WorkshopOrder = {
  id: string
  orderNo: string
  customerName: string
  productLabel: string
  notes: string
  createdAt: string
  closedAt: string | null
  status: 'open' | 'in_progress' | 'closed'
  priority: OrderPriority
  /** Total manufactured pieces (= sum of size quantities / pieces.length) */
  quantity: number
  material: string
  finish: string
  bay: string
  dueDate: string | null
  stages: OrderStage[]
  /** Custom sizes for this order (any product / category) */
  sizes: OrderSizeLine[]
  /** One barcode per piece to manufacture */
  pieces: OrderPiece[]
  /** Optional catalogue / quote design code (e.g. regular design quote ref) */
  designCode: string
  /** Optional designer reference photos / CAD — for designing stage (not every worker) */
  designFiles: WorkshopAttachment[]
}

export type MachineStatus = 'idle' | 'running' | 'maintenance' | 'offline'

export type Machine = {
  id: string
  code: string
  name: string
  type: string
  bay: string
  status: MachineStatus
  orderId: string | null
  stageId: WorkStageId | null
  operatorId: string | null
  note: string
  updatedAt: string
}

export type WorkshopSnapshot = {
  workers: Worker[]
  orders: WorkshopOrder[]
  events: StatusEvent[]
  machines: Machine[]
  updatedAt: string
}

/** Map older persisted stage ids onto the current pipeline */
const STAGE_ID_ALIASES: Record<string, WorkStageId> = {
  paint_booth: 'painting',
  quality_check: 'oxidisation',
  dispatch: 'leather_job',
  billing: 'oxidisation',
}

export function normalizeStageId(id: string): WorkStageId | null {
  if (WORK_STAGES.some((s) => s.id === id)) return id as WorkStageId
  return STAGE_ID_ALIASES[id] ?? null
}

export function stageLabel(id: WorkStageId | string): string {
  const normalized = normalizeStageId(id) ?? (id as WorkStageId)
  return WORK_STAGES.find((s) => s.id === normalized)?.label ?? id
}

export function stageHint(id: WorkStageId | string): string {
  const normalized = normalizeStageId(id) ?? (id as WorkStageId)
  return WORK_STAGES.find((s) => s.id === normalized)?.hint ?? ''
}

export function stageMeta(id: WorkStageId | string) {
  const normalized = normalizeStageId(id)
  return normalized ? WORK_STAGES.find((s) => s.id === normalized) : undefined
}

function cleanOrderNo(orderNo: string): string {
  return orderNo.trim().toUpperCase().replace(/\s+/g, '')
}

/** Build a stable department barcode for an order stage (Code128-friendly). */
export function makeStageBarcode(orderNo: string, stageId: WorkStageId): string {
  const code = WORK_STAGES.find((s) => s.id === stageId)?.code ?? stageId.slice(0, 3).toUpperCase()
  return `PB|${cleanOrderNo(orderNo)}|${code}`
}

/** Unique piece barcode: PB|{ORDER}|S{sizeLine}|{pieceInSize} — size text printed on the label. */
export function makePieceBarcode(orderNo: string, sizeLineIndex: number, pieceInSize: number): string {
  const line = `S${sizeLineIndex}`
  const n = String(pieceInSize).padStart(2, '0')
  return `PB|${cleanOrderNo(orderNo)}|${line}|${n}`
}

export function buildPiecesFromSizes(
  orderNo: string,
  sizeInputs: Array<{
    id?: string
    sizeLabel: string
    quantity: number
    material?: string
    colour?: string
  }>,
): { sizes: OrderSizeLine[]; pieces: OrderPiece[]; quantity: number } {
  const sizes: OrderSizeLine[] = []
  const pieces: OrderPiece[] = []
  let pieceIndex = 0
  sizeInputs.forEach((input, lineIdx) => {
    const sizeLabel = input.sizeLabel.trim()
    const quantity = Math.max(0, Math.floor(Number(input.quantity) || 0))
    if (!sizeLabel || quantity < 1) return
    const id = input.id?.trim() || `sz_${lineIdx + 1}`
    const material = (input.material || '').trim()
    const colour = (input.colour || '').trim()
    sizes.push({ id, sizeLabel, quantity, material, colour })
    for (let i = 1; i <= quantity; i++) {
      pieceIndex += 1
      pieces.push({
        id: `pc_${cleanOrderNo(orderNo)}_${pieceIndex}`,
        sizeLineId: id,
        sizeLabel,
        material,
        colour,
        pieceIndex,
        pieceInSize: i,
        barcode: makePieceBarcode(orderNo, sizes.length, i),
        status: 'pending',
      })
    }
  })
  return { sizes, pieces, quantity: pieces.length }
}

/** Aggregate unique materials from size lines for procurement pick-list. */
export function procurementMaterials(order: WorkshopOrder): Array<{
  material: string
  colour: string
  quantity: number
  sizes: string[]
}> {
  const map = new Map<string, { material: string; colour: string; quantity: number; sizes: string[] }>()
  for (const line of order.sizes || []) {
    const material = (line.material || order.material || '').trim()
    if (!material) continue
    const colour = (line.colour || '').trim()
    const key = `${material.toLowerCase()}|${colour.toLowerCase()}`
    const existing = map.get(key)
    if (existing) {
      existing.quantity += line.quantity
      if (!existing.sizes.includes(line.sizeLabel)) existing.sizes.push(line.sizeLabel)
    } else {
      map.set(key, {
        material,
        colour,
        quantity: line.quantity,
        sizes: [line.sizeLabel],
      })
    }
  }
  return [...map.values()]
}

export function emptyStages(orderNo = 'TEMP'): OrderStage[] {
  return WORK_STAGES.map((s) => ({
    stageId: s.id,
    status: 'pending' as const,
    workerId: null,
    startedAt: null,
    completedAt: null,
    statement: '',
    updates: [],
    managerNote: '',
    barcode: makeStageBarcode(orderNo, s.id),
    startPhoto: null,
  }))
}

export function stageBarcodeCode(stageId: WorkStageId): string {
  return WORK_STAGES.find((s) => s.id === stageId)?.code ?? stageId
}

export function orderProgress(order: WorkshopOrder): {
  done: number
  total: number
  percent: number
} {
  const total = order.stages.length
  const done = order.stages.filter((s) => s.status === 'done').length
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 }
}

export function formatDuration(from: string | null, to?: string | null): string {
  if (!from) return '—'
  const start = new Date(from).getTime()
  const end = to ? new Date(to).getTime() : Date.now()
  const mins = Math.max(0, Math.round((end - start) / 60_000))
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export function priorityLabel(p: OrderPriority): string {
  if (p === 'rush') return 'Rush'
  if (p === 'urgent') return 'Urgent'
  return 'Normal'
}
