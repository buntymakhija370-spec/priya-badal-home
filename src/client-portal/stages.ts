import type { JobStatus, WorkshopOrder } from '../workshop/types'

/** Client-facing journey aligned to workshop pipeline */
export type ClientStageId =
  | 'order'
  | 'review'
  | 'design'
  | 'cutting'
  | 'finishing'
  | 'qc'
  | 'dispatch'
  | 'delivered'

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

export function buildClientStages(order: WorkshopOrder): ClientStage[] {
  const jobs = order.jobs || {}
  const balance = Math.max(0, (order.totalAmount || 0) - (order.advancePaid || 0))

  const orderDone = order.status !== 'enquiry' && order.status !== 'cancelled'
  const reviewDone = jobDone(jobs.review)
  const designDone = jobDone(jobs.design)
  const cuttingDone = jobDone(jobs.cutting)
  const finishingDone = jobDone(jobs.phase2_finishing)
  const qcDone = jobDone(jobs.qc)
  const dispatchDone =
    jobDone(jobs.dispatch) || order.status === 'dispatched' || order.status === 'delivered'
  const deliveredDone = jobDone(jobs.transport) || order.status === 'delivered'

  const stages: Omit<ClientStage, 'state'>[] = [
    {
      id: 'order',
      label: 'Order received',
      detail: orderDone ? `Confirmed · ${order.orderNo}` : 'Waiting for confirmation',
    },
    {
      id: 'review',
      label: 'Priya & Badal review',
      detail: jobActive(jobs.review)
        ? 'Under review'
        : reviewDone
          ? 'Review OK'
          : 'Waiting for review',
    },
    {
      id: 'design',
      label: 'Designing',
      detail: jobActive(jobs.design)
        ? 'Design in progress'
        : designDone
          ? 'Design complete'
          : 'Queued for design',
    },
    {
      id: 'cutting',
      label: 'Cutting',
      detail: jobActive(jobs.cutting)
        ? 'Cutting in progress'
        : cuttingDone
          ? 'Cutting complete'
          : 'Waiting for cutting',
    },
    {
      id: 'finishing',
      label: 'Phase 2 finishing',
      detail: jobActive(jobs.phase2_finishing)
        ? 'Finishing in progress'
        : finishingDone
          ? 'Finishing complete'
          : 'Waiting for Phase 2',
    },
    {
      id: 'qc',
      label: 'Quality check',
      detail: jobActive(jobs.qc) ? 'QC in progress' : qcDone ? 'QC passed' : 'Waiting for QC',
    },
    {
      id: 'dispatch',
      label: 'Dispatch',
      detail: dispatchDone
        ? order.vehicleNo
          ? `Dispatched · ${order.vehicleNo}`
          : 'Dispatched'
        : jobActive(jobs.dispatch)
          ? 'Preparing dispatch'
          : 'Not yet dispatched',
    },
    {
      id: 'delivered',
      label: 'Transport / delivered',
      detail: deliveredDone
        ? balance > 0
          ? 'Delivered · balance pending'
          : 'Delivered'
        : jobActive(jobs.transport)
          ? 'Out for delivery'
          : 'Waiting for transport',
    },
  ]

  const doneFlags = [
    orderDone,
    reviewDone,
    designDone,
    cuttingDone,
    finishingDone,
    qcDone,
    dispatchDone,
    deliveredDone,
  ]

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
