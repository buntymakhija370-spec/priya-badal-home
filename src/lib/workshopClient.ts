import type {
  WorkStageId,
  WorkshopOrder,
  WorkshopSnapshot,
  Worker,
  OrderStage,
  StatusEvent,
} from './workshopTypes'

const SESSION_KEY = 'pbh-workshop-session'

export type WorkshopAuth =
  | { role: 'manager'; name: string; pin: string }
  | { role: 'worker'; workerId: string; code: string; name: string; workerRole: string }

export function loadSession(): WorkshopAuth | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as WorkshopAuth
  } catch {
    return null
  }
}

export function saveSession(session: WorkshopAuth | null) {
  if (!session) localStorage.removeItem(SESSION_KEY)
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export async function workshopLogin(input: {
  role: 'worker' | 'manager'
  code?: string
  pin: string
}): Promise<WorkshopAuth> {
  const data = await parse<{
    role: 'worker' | 'manager'
    name: string
    workerId?: string
    code?: string
    workerRole?: string
  }>(
    await fetch('/api/workshop/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  )
  if (data.role === 'manager') {
    const auth: WorkshopAuth = { role: 'manager', name: data.name, pin: input.pin }
    saveSession(auth)
    return auth
  }
  const auth: WorkshopAuth = {
    role: 'worker',
    workerId: data.workerId!,
    code: data.code!,
    name: data.name,
    workerRole: data.workerRole || 'multi',
  }
  saveSession(auth)
  return auth
}

export async function fetchSnapshot(): Promise<WorkshopSnapshot> {
  return parse(await fetch('/api/workshop/snapshot'))
}

export async function fetchWorkerJobs(workerId: string): Promise<{
  jobs: { order: WorkshopOrder; stage: OrderStage }[]
  updatedAt: string
}> {
  return parse(await fetch(`/api/workshop/worker-jobs?workerId=${encodeURIComponent(workerId)}`))
}

export async function postWorkerAction(body: {
  workerId: string
  orderId: string
  stageId: WorkStageId
  action: 'start' | 'statement' | 'complete'
  statement?: string
}): Promise<{ order: WorkshopOrder; snapshot: WorkshopSnapshot }> {
  return parse(
    await fetch('/api/workshop/worker-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
}

function mgrHeaders(pin: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Workshop-Manager': pin,
  }
}

export async function fetchBoard(pin: string): Promise<{
  orders: WorkshopOrder[]
  workingNow: { worker: Worker; jobs: { order: WorkshopOrder; stage: OrderStage }[] }[]
  idleCount: number
  events: StatusEvent[]
  updatedAt: string
}> {
  return parse(await fetch('/api/workshop/board', { headers: mgrHeaders(pin) }))
}

export async function fetchWorkers(pin: string): Promise<{ workers: Omit<Worker, 'pin'>[] }> {
  return parse(await fetch('/api/workshop/workers', { headers: mgrHeaders(pin) }))
}

export async function createWorkshopOrder(
  pin: string,
  body: { orderNo: string; customerName: string; productLabel: string; notes?: string },
) {
  return parse<{ order: WorkshopOrder }>(
    await fetch('/api/workshop/orders', {
      method: 'POST',
      headers: mgrHeaders(pin),
      body: JSON.stringify(body),
    }),
  )
}

export async function assignWorkshopStage(
  pin: string,
  body: { orderId: string; stageId: WorkStageId; workerId: string; managerNote?: string },
) {
  return parse<{ order: WorkshopOrder }>(
    await fetch('/api/workshop/assign', {
      method: 'POST',
      headers: mgrHeaders(pin),
      body: JSON.stringify(body),
    }),
  )
}

export async function unassignWorkshopStage(
  pin: string,
  body: { orderId: string; stageId: WorkStageId },
) {
  return parse<{ order: WorkshopOrder }>(
    await fetch('/api/workshop/unassign', {
      method: 'POST',
      headers: mgrHeaders(pin),
      body: JSON.stringify(body),
    }),
  )
}

export async function closeWorkshopOrder(pin: string, orderId: string) {
  return parse<{ order: WorkshopOrder }>(
    await fetch('/api/workshop/close', {
      method: 'POST',
      headers: mgrHeaders(pin),
      body: JSON.stringify({ orderId }),
    }),
  )
}

export async function resetWorkshop(pin: string) {
  return parse<WorkshopSnapshot>(
    await fetch('/api/workshop/reset', {
      method: 'POST',
      headers: mgrHeaders(pin),
    }),
  )
}
