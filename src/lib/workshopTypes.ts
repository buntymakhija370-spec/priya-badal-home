/** Shared workshop floor types — workers, orders, stage accountability */

export const WORK_STAGES = [
  { id: 'designing', label: 'Designing', short: 'Design', hint: 'Layout, drawings, CNC file' },
  { id: 'cutting', label: 'Cutting', short: 'Cut', hint: 'Panels & shutters cut to size' },
  { id: 'pasting', label: 'Pasting', short: 'Paste', hint: 'Laminate / veneer pasting' },
  { id: 'colouring', label: 'Colouring', short: 'Colour', hint: 'Paint, polish, stain' },
  { id: 'finishing', label: 'Finishing', short: 'Finish', hint: 'Edge, hardware, fit-up' },
  { id: 'quality_check', label: 'Quality check', short: 'QC', hint: 'Measure & approve' },
  { id: 'dispatching', label: 'Dispatching', short: 'Dispatch', hint: 'Pack & send to site' },
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

export type WorkshopSnapshot = {
  workers: Worker[]
  orders: WorkshopOrder[]
  events: StatusEvent[]
  updatedAt: string
}

export function stageLabel(id: WorkStageId): string {
  return WORK_STAGES.find((s) => s.id === id)?.label ?? id
}

export function stageHint(id: WorkStageId): string {
  return WORK_STAGES.find((s) => s.id === id)?.hint ?? ''
}

export function emptyStages(): OrderStage[] {
  return WORK_STAGES.map((s) => ({
    stageId: s.id,
    status: 'pending',
    workerId: null,
    startedAt: null,
    completedAt: null,
    statement: '',
    updates: [],
    managerNote: '',
  }))
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
