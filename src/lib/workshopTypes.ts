/** Shared workshop process + machinery types (single pipeline — no floor categories) */

export const WORK_STAGES = [
  { id: 'designing', label: 'Designing', short: 'Design', code: 'DSN', hint: 'Layout, drawings, CNC / cut list' },
  { id: 'cutting', label: 'Cutting', short: 'Cut', code: 'CUT', hint: 'Panels cut to size' },
  { id: 'edge_bending', label: 'Edge bending', short: 'Edge', code: 'EDG', hint: 'Edge banding' },
  { id: 'boring', label: 'Boring', short: 'Bore', code: 'BOR', hint: 'Hinge / shelf / connector holes' },
  { id: 'painting', label: 'Painting', short: 'Paint', code: 'PNT', hint: 'Colour, polish & paint booth' },
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
  quantity: number
  material: string
  finish: string
  bay: string
  dueDate: string | null
  stages: OrderStage[]
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

/** Build a stable department barcode for an order stage (Code128-friendly). */
export function makeStageBarcode(orderNo: string, stageId: WorkStageId): string {
  const code = WORK_STAGES.find((s) => s.id === stageId)?.code ?? stageId.slice(0, 3).toUpperCase()
  const cleanOrder = orderNo.trim().toUpperCase().replace(/\s+/g, '')
  return `PB|${cleanOrder}|${code}`
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
