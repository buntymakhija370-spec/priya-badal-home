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

const STAFF_TOKEN_KEY = 'pbh-workshop-staff-token'
const STAFF_EXPIRES_KEY = 'pbh-workshop-staff-expires'

export function getStaffToken(): string | null {
  const token = sessionStorage.getItem(STAFF_TOKEN_KEY)
  const expires = sessionStorage.getItem(STAFF_EXPIRES_KEY)
  if (!token || !expires) return null
  if (new Date(expires).getTime() <= Date.now()) {
    clearStaffSession()
    return null
  }
  return token
}

export function isWorkshopAuthed() {
  return Boolean(getStaffToken())
}

export function clearStaffSession() {
  sessionStorage.removeItem(STAFF_TOKEN_KEY)
  sessionStorage.removeItem(STAFF_EXPIRES_KEY)
}

export function setStaffSession(token: string, expiresAt: string) {
  sessionStorage.setItem(STAFF_TOKEN_KEY, token)
  sessionStorage.setItem(STAFF_EXPIRES_KEY, expiresAt)
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  }
  const token = getStaffToken()
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(path, { ...init, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export async function staffLogin(pin: string) {
  const res = await api<{ token: string; expiresAt: string; role: string }>(
    '/api/workshop/staff/login',
    { method: 'POST', body: JSON.stringify({ pin }) },
  )
  setStaffSession(res.token, res.expiresAt)
  return res
}

export async function staffLogout() {
  try {
    await api('/api/workshop/logout', { method: 'POST', body: '{}' })
  } catch {
    // ignore network errors on logout
  }
  clearStaffSession()
}

export function fetchWorkshopDb() {
  return api<WorkshopDb>('/api/workshop')
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

export function setJobStatus(
  orderId: string,
  departmentId: DepartmentId,
  status: JobStatus,
  note?: string,
  assignee?: string,
) {
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
