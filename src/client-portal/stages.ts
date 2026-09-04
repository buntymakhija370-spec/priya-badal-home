import type { JobStatus, OrderStatus, WorkshopOrder } from '../workshop/types'

/** Client-facing journey: Order → CNC → Paint Booth → Dispatch → Accounting */
export type ClientStageId =
  | 'order'
  | 'cnc'
  | 'paint'
  | 'dispatch'
  | 'accounting'

export type ClientStageState = 'upcoming' | 'current' | 'done'

export type ClientStage = {
  id: ClientStageId
  label: string
  detail: string
  state: ClientStageState
}

function jobDone(status?: JobStatus) {
  return status === 'done'
}

function jobActive(status?: JobStatus) {
  return status === 'in_progress' || status === 'assigned'
}

function orderClosed(status: OrderStatus) {
  return status === 'dispatched' || status === 'delivered'
}

export function buildClientStages(order: WorkshopOrder): ClientStage[] {
  const jobs = order.jobs || {}
  const balance = Math.max(0, (order.totalAmount || 0) - (order.advancePaid || 0))
  const accountingDone = balance <= 0 && (order.totalAmount || 0) > 0
  const dispatched = orderClosed(order.status) || jobDone(jobs.dispatch)

  const orderDone =
    order.status !== 'enquiry' && order.status !== 'cancelled'
  const cncDone = jobDone(jobs.cnc) || (jobDone(jobs.cutting) && jobDone(jobs.finishing))
  const paintDone = jobDone(jobs.finishing)

  const stages: Omit<ClientStage, 'state'>[] = [
    {
      id: 'order',
      label: 'Order received',
      detail: orderDone
        ? `Confirmed · ${order.orderNo}`
        : 'Waiting for confirmation',
    },
    {
      id: 'cnc',
      label: 'CNC cutting',
      detail: jobActive(jobs.cnc)
        ? 'In progress at CNC'
        : cncDone
          ? 'CNC complete'
          : 'Queued for CNC',
    },
    {
      id: 'paint',
      label: 'Paint booth',
      detail: jobActive(jobs.finishing)
        ? 'In paint / finish booth'
        : paintDone
          ? 'Paint & finish complete'
          : 'Waiting for paint booth',
    },
    {
      id: 'dispatch',
      label: 'Dispatch',
      detail: dispatched
        ? order.vehicleNo
          ? `Dispatched · vehicle ${order.vehicleNo}`
          : 'Dispatched'
        : jobActive(jobs.dispatch) || jobActive(jobs.packing)
          ? 'Preparing dispatch'
          : 'Not yet packed',
    },
    {
      id: 'accounting',
      label: 'Accounting',
      detail: accountingDone
        ? 'Fully paid · closed'
        : balance > 0
          ? `Balance due`
          : 'Payment to be confirmed',
    },
  ]

  const doneFlags = [orderDone, cncDone, paintDone, dispatched, accountingDone]

  let currentIndex = doneFlags.findIndex((d) => !d)
  if (currentIndex < 0) currentIndex = stages.length - 1
  if (order.status === 'cancelled') {
    return stages.map((s) => ({ ...s, state: 'upcoming' as const }))
  }

  return stages.map((s, i) => ({
    ...s,
    state: doneFlags[i] ? 'done' : i === currentIndex ? 'current' : 'upcoming',
  }))
}

export function clientStatusLabel(order: WorkshopOrder): string {
  if (order.status === 'cancelled') return 'Cancelled'
  if (order.status === 'delivered') return 'Delivered'
  const stages = buildClientStages(order)
  const current = stages.find((s) => s.state === 'current')
  if (current) return current.label
  return 'Complete'
}
