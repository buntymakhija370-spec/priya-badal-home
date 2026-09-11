/** Shared workshop floor types — workers, orders, stage accountability */

export const WORK_STAGES = [
  { id: 'designing', label: 'Designing', short: 'Design' },
  { id: 'cutting', label: 'Cutting', short: 'Cut' },
  { id: 'pasting', label: 'Pasting', short: 'Paste' },
  { id: 'colouring', label: 'Colouring', short: 'Colour' },
  { id: 'finishing', label: 'Finishing', short: 'Finish' },
  { id: 'quality_check', label: 'Quality check', short: 'QC' },
  { id: 'dispatching', label: 'Dispatching', short: 'Dispatch' },
] as const

export type WorkStageId = (typeof WORK_STAGES)[number]['id']

export type WorkerRole = WorkStageId | 'multi'

export type Worker = {
  id: string
  code: string
  name: string
  pin: string
  role: WorkerRole
  phone?: string
  active: boolean
}

export type StageStatus = 'pending' | 'assigned' | 'in_progress' | 'done'

export type OrderStage = {
  stageId: WorkStageId
  status: StageStatus
  workerId: string | null
  startedAt: string | null
  completedAt: string | null
  /** Latest worker statement of what they are doing */
  statement: string
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
  stages: OrderStage[]
}

export type WorkshopSession =
  | { role: 'manager'; name: string }
  | { role: 'worker'; workerId: string; name: string }

export type WorkshopSnapshot = {
  workers: Worker[]
  orders: WorkshopOrder[]
  events: StatusEvent[]
  updatedAt: string
}

export function stageLabel(id: WorkStageId): string {
  return WORK_STAGES.find((s) => s.id === id)?.label ?? id
}

export function emptyStages(): OrderStage[] {
  return WORK_STAGES.map((s) => ({
    stageId: s.id,
    status: 'pending',
    workerId: null,
    startedAt: null,
    completedAt: null,
    statement: '',
  }))
}
