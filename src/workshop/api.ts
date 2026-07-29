import type {
  DepartmentId,
  DepartmentReport,
  JobStatus,
  OrderSource,
  OrderStatus,
  Partner,
  WorkshopDb,
  WorkshopOrder,
  OrderLine,
} from './types'
import { emptyJobs } from './types'

const PIN_KEY = 'pbh-workshop-pin-ok'

export function isWorkshopAuthed() {
  return sessionStorage.getItem(PIN_KEY) === '1'
}

export function setWorkshopAuthed(ok: boolean) {
  if (ok) sessionStorage.setItem(PIN_KEY, '1')
  else sessionStorage.removeItem(PIN_KEY)
}

/** Default workshop PIN — change in Workshop settings later / env */
export const WORKSHOP_PIN = '2468'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export function fetchWorkshopDb() {
  return api<WorkshopDb>('/api/workshop')
}

export function saveWorkshopDb(db: WorkshopDb) {
  return api<WorkshopDb>('/api/workshop', {
    method: 'PUT',
    body: JSON.stringify(db),
  })
}

export function createOrder(input: {
  source: OrderSource
  customerName: string
  customerPhone: string
  customerCity?: string
  partnerId?: string
  partnerName?: string
  lines: Omit<OrderLine, 'id'>[]
  advancePaid?: number
  totalAmount: number
  dueDate?: string
  productionNotes?: string
  status?: OrderStatus
}) {
  return api<WorkshopOrder>('/api/workshop/orders', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateOrder(id: string, patch: Partial<WorkshopOrder>) {
  return api<WorkshopOrder>(`/api/workshop/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export function setJobStatus(orderId: string, departmentId: DepartmentId, status: JobStatus, note?: string, assignee?: string) {
  return api<{ order: WorkshopOrder; report: DepartmentReport }>('/api/workshop/jobs', {
    method: 'POST',
    body: JSON.stringify({ orderId, departmentId, status, note, assignee }),
  })
}

export function upsertPartner(partner: Partner) {
  return api<Partner>('/api/workshop/partners', {
    method: 'POST',
    body: JSON.stringify(partner),
  })
}

export function newLocalLine(partial: Omit<OrderLine, 'id'>): OrderLine {
  return { id: crypto.randomUUID(), ...partial }
}

export function seedJobsIfMissing(order: WorkshopOrder): WorkshopOrder {
  if (order.jobs && Object.keys(order.jobs).length) return order
  return { ...order, jobs: emptyJobs() }
}
