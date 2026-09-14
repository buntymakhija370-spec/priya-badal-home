import type {
  Machine,
  MachineStatus,
  OrderPriority,
  OrderStage,
  StatusEvent,
  WorkStageId,
  Worker,
  WorkshopOrder,
  WorkshopSnapshot,
} from './workshopTypes'

const SESSION_KEY = 'pbh-workshop-session'

export type WorkshopAuth =
  | { role: 'manager'; name: string; pin: string }
  | { role: 'worker'; workerId: string; code: string; name: string; workerRole: string }

export type BoardResponse = {
  orders: WorkshopOrder[]
  closedOrders: WorkshopOrder[]
  workingNow: { worker: Worker; jobs: { order: WorkshopOrder; stage: OrderStage }[] }[]
  idleCount: number
  events: StatusEvent[]
  stageStats: {
    stageId: WorkStageId
    label: string
    pending: number
    assigned: number
    inProgress: number
    done: number
  }[]
  totals: { open: number; closed: number; urgent: number; avgProgress: number }
  updatedAt: string
}

export type WorkerRosterEntry = Omit<Worker, 'pin'> & {
  busy: boolean
  activeJobCount: number
}

export type WorkerJobsResponse = {
  jobs: { order: WorkshopOrder; stage: OrderStage }[]
  completedJobs: { order: WorkshopOrder; stage: OrderStage; completedAt?: string }[]
  events: StatusEvent[]
  worker: Pick<Worker, 'id' | 'code' | 'name' | 'role' | 'bay' | 'phone'>
  updatedAt: string
}

export type OrderDetailResponse = {
  order: WorkshopOrder
  events: StatusEvent[]
  workers: Omit<Worker, 'pin'>[]
  progress: { done: number; total: number; percent: number }
}

export type WorkerDetailResponse = {
  worker: Worker
  activeJobs: { order: WorkshopOrder; stage: OrderStage }[]
  completedJobs: { order: WorkshopOrder; stage: OrderStage; completedAt?: string }[]
  events: StatusEvent[]
}

export type JobDetailResponse = {
  order: WorkshopOrder
  stage: OrderStage
  events: StatusEvent[]
  workers: Omit<Worker, 'pin'>[]
  updatedAt: string
}

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

function mgrHeaders(pin: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Workshop-Manager': pin,
  }
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

export async function fetchWorkerJobs(workerId: string): Promise<WorkerJobsResponse> {
  return parse(await fetch(`/api/workshop/worker-jobs?workerId=${encodeURIComponent(workerId)}`))
}

export async function fetchJobDetail(
  orderId: string,
  stageId: WorkStageId,
  workerId?: string,
): Promise<JobDetailResponse> {
  const q = new URLSearchParams({ orderId, stageId })
  if (workerId) q.set('workerId', workerId)
  return parse(await fetch(`/api/workshop/job-detail?${q}`))
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

export async function fetchBoard(pin: string): Promise<BoardResponse> {
  return parse(await fetch('/api/workshop/board', { headers: mgrHeaders(pin) }))
}

export async function fetchWorkers(pin: string): Promise<{
  workers: WorkerRosterEntry[]
  pins: Record<string, string>
  updatedAt: string
}> {
  return parse(await fetch('/api/workshop/workers', { headers: mgrHeaders(pin) }))
}

export async function fetchOrderDetail(pin: string, orderId: string): Promise<OrderDetailResponse> {
  return parse(
    await fetch(`/api/workshop/order-detail?orderId=${encodeURIComponent(orderId)}`, {
      headers: mgrHeaders(pin),
    }),
  )
}

export async function fetchWorkerDetail(
  pin: string,
  workerId: string,
): Promise<WorkerDetailResponse> {
  return parse(
    await fetch(`/api/workshop/worker-detail?workerId=${encodeURIComponent(workerId)}`, {
      headers: mgrHeaders(pin),
    }),
  )
}

export async function updateWorkshopWorker(
  pin: string,
  body: {
    workerId: string
    name?: string
    code?: string
    role?: Worker['role']
    bay?: string
    phone?: string
    pin?: string
    active?: boolean
  },
) {
  return parse<{ worker: Worker; snapshot: WorkshopSnapshot }>(
    await fetch('/api/workshop/workers/update', {
      method: 'POST',
      headers: mgrHeaders(pin),
      body: JSON.stringify(body),
    }),
  )
}

export async function createWorkshopOrder(
  pin: string,
  body: {
    orderNo: string
    customerName: string
    productLabel: string
    notes?: string
    priority?: OrderPriority
    quantity?: number
    material?: string
    finish?: string
    bay?: string
    dueDate?: string | null
    floorType: 'modular' | 'handcrafted'
  },
) {
  return parse<{ order: WorkshopOrder; snapshot: WorkshopSnapshot }>(
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
  return parse<{ order: WorkshopOrder; snapshot: WorkshopSnapshot }>(
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
  return parse<{ order: WorkshopOrder; snapshot: WorkshopSnapshot }>(
    await fetch('/api/workshop/unassign', {
      method: 'POST',
      headers: mgrHeaders(pin),
      body: JSON.stringify(body),
    }),
  )
}

export async function closeWorkshopOrder(pin: string, orderId: string) {
  return parse<{ order: WorkshopOrder; snapshot: WorkshopSnapshot }>(
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

export type MachinesResponse = {
  machines: Machine[]
  orders: WorkshopOrder[]
  workers: Omit<Worker, 'pin'>[]
  updatedAt: string
}

export type ProcessBoardResponse = {
  columns: {
    stageId: WorkStageId
    label: string
    short: string
    active: { order: WorkshopOrder; stage: OrderStage; worker: Omit<Worker, 'pin'> | null }[]
    pending: { order: WorkshopOrder; stage: OrderStage }[]
  }[]
  orders: WorkshopOrder[]
  workers: Omit<Worker, 'pin'>[]
  updatedAt: string
}

export async function fetchMachines(pin: string): Promise<MachinesResponse> {
  return parse(await fetch('/api/workshop/machines', { headers: mgrHeaders(pin) }))
}

export async function updateMachine(
  pin: string,
  body: {
    machineId: string
    status?: MachineStatus
    orderId?: string | null
    stageId?: WorkStageId | null
    operatorId?: string | null
    note?: string
  },
) {
  return parse<{ machine: Machine; snapshot: WorkshopSnapshot }>(
    await fetch('/api/workshop/machines/update', {
      method: 'POST',
      headers: mgrHeaders(pin),
      body: JSON.stringify(body),
    }),
  )
}

export async function fetchProcessBoard(
  pin: string,
  floor: 'modular' | 'handcrafted' | 'all' = 'all',
): Promise<ProcessBoardResponse> {
  const q = floor === 'all' ? '' : `?floor=${floor}`
  return parse(await fetch(`/api/workshop/process${q}`, { headers: mgrHeaders(pin) }))
}

export type WsLocalSettings = {
  sound: boolean
  vibration: boolean
}

const WS_SETTINGS_KEY = 'pbh-ws-settings'

export function loadWsSettings(): WsLocalSettings {
  try {
    const raw = localStorage.getItem(WS_SETTINGS_KEY)
    if (!raw) return { sound: true, vibration: true }
    return { sound: true, vibration: true, ...JSON.parse(raw) }
  } catch {
    return { sound: true, vibration: true }
  }
}

export function saveWsSettings(settings: WsLocalSettings) {
  localStorage.setItem(WS_SETTINGS_KEY, JSON.stringify(settings))
}
