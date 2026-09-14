/** Shared workshop floor types — two work floors with different stage pipelines */

/** All stage ids used across floors */
export const WORK_STAGES = [
  { id: 'designing', label: 'Designing', short: 'Design', hint: 'Layout, drawings, CNC / cut list' },
  { id: 'cutting', label: 'Cutting', short: 'Cut', hint: 'Panels cut to size' },
  { id: 'edge_bending', label: 'Edge bending', short: 'Edge', hint: 'Edge banding on modular panels' },
  { id: 'boring', label: 'Boring', short: 'Bore', hint: 'Hinge / shelf / connector holes' },
  { id: 'paint_booth', label: 'Paint booth', short: 'Paint', hint: 'Hand-crafted colour & polish' },
  { id: 'quality_check', label: 'Quality check', short: 'QC', hint: 'Measure & approve' },
  { id: 'dispatch', label: 'Dispatch', short: 'Dispatch', hint: 'Pack & send to site' },
  { id: 'billing', label: 'Billing', short: 'Bill', hint: 'Final billing & close' },
] as const

export type WorkStageId = (typeof WORK_STAGES)[number]['id']

export type FloorType = 'modular' | 'handcrafted'

export const FLOOR_TYPES: {
  id: FloorType
  label: string
  summary: string
  stageIds: WorkStageId[]
}[] = [
  {
    id: 'modular',
    label: 'Modular',
    summary: 'Designing → Cutting → Edge bending → Boring → Quality check → Dispatch → Billing',
    stageIds: [
      'designing',
      'cutting',
      'edge_bending',
      'boring',
      'quality_check',
      'dispatch',
      'billing',
    ],
  },
  {
    id: 'handcrafted',
    label: 'Hand Crafted Panels',
    summary: 'Designing → Cutting → Paint booth → Quality check → Dispatch → Billing',
    stageIds: ['designing', 'cutting', 'paint_booth', 'quality_check', 'dispatch', 'billing'],
  },
]

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
  /** Which work floor this order runs on */
  floorType: FloorType
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
  /** Optional floor this machine mainly serves */
  floorType?: FloorType | 'shared'
}

export type WorkshopSnapshot = {
  workers: Worker[]
  orders: WorkshopOrder[]
  events: StatusEvent[]
  machines: Machine[]
  updatedAt: string
}

export function floorLabel(id: FloorType): string {
  return FLOOR_TYPES.find((f) => f.id === id)?.label ?? id
}

export function floorSummary(id: FloorType): string {
  return FLOOR_TYPES.find((f) => f.id === id)?.summary ?? ''
}

export function stagesForFloor(floorType: FloorType): WorkStageId[] {
  return FLOOR_TYPES.find((f) => f.id === floorType)?.stageIds ?? FLOOR_TYPES[0].stageIds
}

export function stageLabel(id: WorkStageId): string {
  return WORK_STAGES.find((s) => s.id === id)?.label ?? id
}

export function stageHint(id: WorkStageId): string {
  return WORK_STAGES.find((s) => s.id === id)?.hint ?? ''
}

export function stageMeta(id: WorkStageId) {
  return WORK_STAGES.find((s) => s.id === id)
}

export function emptyStages(floorType: FloorType = 'modular'): OrderStage[] {
  return stagesForFloor(floorType).map((stageId) => ({
    stageId,
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
