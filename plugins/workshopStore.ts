/**
 * Workshop floor store — workers, job orders, stage assignments, status log.
 * File-backed so phones on the same LAN share live state via the Vite API.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomBytes } from 'node:crypto'
import type {
  OrderStage,
  StageStatus,
  StatusEvent,
  WorkStageId,
  Worker,
  WorkshopOrder,
  WorkshopSnapshot,
} from '../src/lib/workshopTypes.ts'
import { WORK_STAGES, emptyStages } from '../src/lib/workshopTypes.ts'

type StoreFile = {
  workers: Worker[]
  orders: WorkshopOrder[]
  events: StatusEvent[]
  updatedAt: string
}

const DATA_DIR = resolve(process.cwd(), 'data')
const STORE_PATH = resolve(DATA_DIR, 'workshop.json')

const FIRST = [
  'Amit', 'Rahul', 'Suresh', 'Vikram', 'Ravi', 'Deepak', 'Manoj', 'Sanjay',
  'Anil', 'Pankaj', 'Naveen', 'Kiran', 'Ajay', 'Pradeep', 'Sunil', 'Mahesh',
  'Gopal', 'Ramesh', 'Dinesh', 'Yogesh', 'Imran', 'Farhan', 'Arjun', 'Nikhil',
  'Sachin', 'Vishal', 'Rohit', 'Kunal', 'Ashok', 'Bharat',
]
const LAST = [
  'Sharma', 'Patel', 'Singh', 'Yadav', 'Kumar', 'Verma', 'Joshi', 'Gupta',
  'Mehta', 'Nair', 'Reddy', 'Khan', 'Das', 'Mishra', 'Chauhan', 'Thakur',
]

const ROLE_CYCLE: Worker['role'][] = [
  'designing',
  'cutting',
  'pasting',
  'colouring',
  'finishing',
  'quality_check',
  'dispatching',
  'multi',
]

function nowIso() {
  return new Date().toISOString()
}

function uid(prefix: string) {
  return `${prefix}_${randomBytes(4).toString('hex')}`
}

function seedWorkers(): Worker[] {
  const workers: Worker[] = []
  for (let i = 1; i <= 60; i++) {
    const code = `W${String(i).padStart(2, '0')}`
    const name = `${FIRST[(i - 1) % FIRST.length]} ${LAST[Math.floor((i - 1) / FIRST.length) % LAST.length]}`
    const pin = String(1000 + ((i * 37) % 9000))
    workers.push({
      id: `worker_${code.toLowerCase()}`,
      code,
      name,
      pin,
      role: ROLE_CYCLE[(i - 1) % ROLE_CYCLE.length],
      phone: `98${String(10000000 + i * 1357).slice(0, 8)}`,
      active: true,
    })
  }
  return workers
}

function seedOrders(workers: Worker[]): { orders: WorkshopOrder[]; events: StatusEvent[] } {
  const cutter = workers.find((w) => w.role === 'cutting')!
  const paster = workers.find((w) => w.role === 'pasting')!
  const designer = workers.find((w) => w.role === 'designing')!

  const mk = (
    orderNo: string,
    customerName: string,
    productLabel: string,
    notes: string,
    mutate: (stages: OrderStage[]) => void,
  ): WorkshopOrder => {
    const stages = emptyStages()
    mutate(stages)
    const anyProgress = stages.some((s) => s.status !== 'pending')
    return {
      id: uid('ord'),
      orderNo,
      customerName,
      productLabel,
      notes,
      createdAt: nowIso(),
      closedAt: null,
      status: anyProgress ? 'in_progress' : 'open',
      stages,
    }
  }

  const o1 = mk(
    'PBH-2401',
    'Sharma Residence',
    'Kitchen shutter set — oak matt',
    '8 shutters, soft-close hinges',
    (stages) => {
      const d = stages.find((s) => s.stageId === 'designing')!
      d.status = 'done'
      d.workerId = designer.id
      d.startedAt = nowIso()
      d.completedAt = nowIso()
      d.statement = 'Layout locked, CNC file ready'
      const c = stages.find((s) => s.stageId === 'cutting')!
      c.status = 'in_progress'
      c.workerId = cutter.id
      c.startedAt = nowIso()
      c.statement = 'Cutting carcass panels — bay 2'
    },
  )

  const o2 = mk(
    'PBH-2402',
    'Mehta Villa',
    'Wardrobe 8 ft — walnut',
    'Sliding + openable mix',
    (stages) => {
      const d = stages.find((s) => s.stageId === 'designing')!
      d.status = 'assigned'
      d.workerId = designer.id
      d.statement = ''
      const p = stages.find((s) => s.stageId === 'pasting')!
      p.status = 'assigned'
      p.workerId = paster.id
    },
  )

  const o3 = mk('PBH-2403', 'Kapoor Flat', 'TV wall panel — fluted', 'White + brass accents', () => {})

  const events: StatusEvent[] = [
    {
      id: uid('evt'),
      at: nowIso(),
      orderId: o1.id,
      workerId: designer.id,
      stageId: 'designing',
      kind: 'completed',
      message: `${designer.name} completed Designing on ${o1.orderNo}`,
    },
    {
      id: uid('evt'),
      at: nowIso(),
      orderId: o1.id,
      workerId: cutter.id,
      stageId: 'cutting',
      kind: 'started',
      message: `${cutter.name} started Cutting on ${o1.orderNo}: Cutting carcass panels — bay 2`,
    },
  ]

  return { orders: [o1, o2, o3], events }
}

function ensureStore(): StoreFile {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(STORE_PATH)) {
    const workers = seedWorkers()
    const { orders, events } = seedOrders(workers)
    const initial: StoreFile = {
      workers,
      orders,
      events,
      updatedAt: nowIso(),
    }
    writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2))
    return initial
  }
  try {
    const raw = readFileSync(STORE_PATH, 'utf8')
    const parsed = JSON.parse(raw) as StoreFile
    if (!Array.isArray(parsed.workers) || !Array.isArray(parsed.orders)) {
      throw new Error('invalid')
    }
    return {
      workers: parsed.workers,
      orders: parsed.orders,
      events: Array.isArray(parsed.events) ? parsed.events : [],
      updatedAt: parsed.updatedAt || nowIso(),
    }
  } catch {
    const workers = seedWorkers()
    const { orders, events } = seedOrders(workers)
    return { workers, orders, events, updatedAt: nowIso() }
  }
}

function saveStore(store: StoreFile) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  store.updatedAt = nowIso()
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2))
}

function pushEvent(
  store: StoreFile,
  partial: Omit<StatusEvent, 'id' | 'at'> & { at?: string },
) {
  store.events.unshift({
    id: uid('evt'),
    at: partial.at || nowIso(),
    orderId: partial.orderId,
    workerId: partial.workerId,
    stageId: partial.stageId,
    kind: partial.kind,
    message: partial.message,
  })
  // Keep last 500 events
  if (store.events.length > 500) store.events.length = 500
}

function recomputeOrderStatus(order: WorkshopOrder) {
  if (order.closedAt) {
    order.status = 'closed'
    return
  }
  const allDone = order.stages.every((s) => s.status === 'done')
  if (allDone) {
    order.status = 'closed'
    order.closedAt = nowIso()
    return
  }
  const any = order.stages.some((s) => s.status !== 'pending')
  order.status = any ? 'in_progress' : 'open'
}

export function getManagerPin(): string {
  return (process.env.WORKSHOP_MANAGER_PIN || '2468').trim()
}

export function assertManager(pin: string | undefined | null) {
  if (!pin || pin !== getManagerPin()) {
    throw new Error('Manager PIN incorrect')
  }
}

export function snapshot(): WorkshopSnapshot {
  const store = ensureStore()
  return {
    workers: store.workers,
    orders: store.orders,
    events: store.events.slice(0, 80),
    updatedAt: store.updatedAt,
  }
}

export function loginWorker(code: string, pin: string): Worker {
  const store = ensureStore()
  const worker = store.workers.find(
    (w) => w.code.toUpperCase() === code.trim().toUpperCase() && w.active,
  )
  if (!worker || worker.pin !== pin.trim()) {
    throw new Error('Worker code or PIN incorrect')
  }
  return worker
}

export function createOrder(input: {
  orderNo: string
  customerName: string
  productLabel: string
  notes?: string
}): WorkshopOrder {
  const store = ensureStore()
  const orderNo = input.orderNo.trim() || `PBH-${Date.now().toString().slice(-4)}`
  if (store.orders.some((o) => o.orderNo === orderNo && !o.closedAt)) {
    throw new Error(`Open order ${orderNo} already exists`)
  }
  const order: WorkshopOrder = {
    id: uid('ord'),
    orderNo,
    customerName: input.customerName.trim() || 'Customer',
    productLabel: input.productLabel.trim() || 'Custom piece',
    notes: (input.notes || '').trim(),
    createdAt: nowIso(),
    closedAt: null,
    status: 'open',
    stages: emptyStages(),
  }
  store.orders.unshift(order)
  saveStore(store)
  return order
}

export function assignStage(input: {
  orderId: string
  stageId: WorkStageId
  workerId: string
  managerNote?: string
}): WorkshopOrder {
  const store = ensureStore()
  const order = store.orders.find((o) => o.id === input.orderId)
  if (!order) throw new Error('Order not found')
  if (order.status === 'closed') throw new Error('Order is closed')
  const worker = store.workers.find((w) => w.id === input.workerId && w.active)
  if (!worker) throw new Error('Worker not found')
  const stage = order.stages.find((s) => s.stageId === input.stageId)
  if (!stage) throw new Error('Stage not found')
  if (stage.status === 'done') throw new Error('Stage already completed')

  stage.workerId = worker.id
  stage.status = 'assigned'
  stage.statement = ''
  stage.startedAt = null
  stage.completedAt = null
  recomputeOrderStatus(order)

  pushEvent(store, {
    orderId: order.id,
    workerId: worker.id,
    stageId: input.stageId,
    kind: 'assigned',
    message: `${worker.name} assigned to ${label(input.stageId)} on ${order.orderNo}${
      input.managerNote ? ` — ${input.managerNote}` : ''
    }`,
  })
  saveStore(store)
  return order
}

export function unassignStage(orderId: string, stageId: WorkStageId): WorkshopOrder {
  const store = ensureStore()
  const order = store.orders.find((o) => o.id === orderId)
  if (!order) throw new Error('Order not found')
  const stage = order.stages.find((s) => s.stageId === stageId)
  if (!stage) throw new Error('Stage not found')
  if (stage.status === 'done') throw new Error('Cannot unassign completed stage')
  const prevWorker = stage.workerId
  stage.workerId = null
  stage.status = 'pending'
  stage.statement = ''
  stage.startedAt = null
  recomputeOrderStatus(order)
  if (prevWorker) {
    pushEvent(store, {
      orderId: order.id,
      workerId: prevWorker,
      stageId,
      kind: 'unassigned',
      message: `${label(stageId)} unassigned on ${order.orderNo}`,
    })
  }
  saveStore(store)
  return order
}

export function workerUpdate(input: {
  workerId: string
  orderId: string
  stageId: WorkStageId
  action: 'start' | 'statement' | 'complete'
  statement?: string
}): WorkshopOrder {
  const store = ensureStore()
  const worker = store.workers.find((w) => w.id === input.workerId && w.active)
  if (!worker) throw new Error('Worker not found')
  const order = store.orders.find((o) => o.id === input.orderId)
  if (!order) throw new Error('Order not found')
  if (order.status === 'closed') throw new Error('Order is closed')
  const stage = order.stages.find((s) => s.stageId === input.stageId)
  if (!stage) throw new Error('Stage not found')
  if (stage.workerId !== worker.id) {
    throw new Error('This job is not assigned to you')
  }

  if (input.action === 'start') {
    if (stage.status === 'done') throw new Error('Already completed')
    stage.status = 'in_progress'
    stage.startedAt = stage.startedAt || nowIso()
    const msg = (input.statement || '').trim() || `Started ${label(input.stageId)}`
    stage.statement = msg
    pushEvent(store, {
      orderId: order.id,
      workerId: worker.id,
      stageId: input.stageId,
      kind: 'started',
      message: `${worker.name} started ${label(input.stageId)} on ${order.orderNo}: ${msg}`,
    })
  } else if (input.action === 'statement') {
    const msg = (input.statement || '').trim()
    if (!msg) throw new Error('Write what you are doing')
    if (stage.status === 'assigned') {
      stage.status = 'in_progress'
      stage.startedAt = stage.startedAt || nowIso()
    }
    if (stage.status === 'done') throw new Error('Stage already done')
    stage.statement = msg
    pushEvent(store, {
      orderId: order.id,
      workerId: worker.id,
      stageId: input.stageId,
      kind: 'statement',
      message: `${worker.name} on ${order.orderNo} (${label(input.stageId)}): ${msg}`,
    })
  } else if (input.action === 'complete') {
    if (stage.status === 'done') throw new Error('Already completed')
    const msg = (input.statement || '').trim() || stage.statement || 'Stage completed'
    stage.statement = msg
    stage.status = 'done'
    stage.startedAt = stage.startedAt || nowIso()
    stage.completedAt = nowIso()
    pushEvent(store, {
      orderId: order.id,
      workerId: worker.id,
      stageId: input.stageId,
      kind: 'completed',
      message: `${worker.name} completed ${label(input.stageId)} on ${order.orderNo}: ${msg}`,
    })
  }

  const wasOpen = !order.closedAt
  recomputeOrderStatus(order)
  if (wasOpen && order.closedAt) {
    pushEvent(store, {
      orderId: order.id,
      workerId: worker.id,
      stageId: input.stageId,
      kind: 'closed',
      message: `Order ${order.orderNo} closed — all workmanship stages done`,
    })
  }
  saveStore(store)
  return order
}

export function closeOrder(orderId: string, managerName = 'Manager'): WorkshopOrder {
  const store = ensureStore()
  const order = store.orders.find((o) => o.id === orderId)
  if (!order) throw new Error('Order not found')
  if (order.status === 'closed') return order
  order.closedAt = nowIso()
  order.status = 'closed'
  // Mark remaining incomplete stages as-is for accountability trail
  pushEvent(store, {
    orderId: order.id,
    workerId: 'manager',
    stageId: 'dispatching',
    kind: 'closed',
    message: `${managerName} closed order ${order.orderNo}`,
  })
  saveStore(store)
  return order
}

export function resetDemoData(): WorkshopSnapshot {
  const workers = seedWorkers()
  const { orders, events } = seedOrders(workers)
  const store: StoreFile = { workers, orders, events, updatedAt: nowIso() }
  saveStore(store)
  return snapshot()
}

export function workerJobs(workerId: string) {
  const store = ensureStore()
  return store.orders
    .filter((o) => o.status !== 'closed')
    .flatMap((order) =>
      order.stages
        .filter((s) => s.workerId === workerId && s.status !== 'done')
        .map((stage) => ({ order, stage })),
    )
}

export function liveBoard() {
  const store = ensureStore()
  const active = store.orders.filter((o) => o.status !== 'closed')
  const byWorker = new Map<
    string,
    { worker: Worker; jobs: { order: WorkshopOrder; stage: OrderStage }[] }
  >()
  for (const w of store.workers) {
    byWorker.set(w.id, { worker: w, jobs: [] })
  }
  for (const order of active) {
    for (const stage of order.stages) {
      if (!stage.workerId || stage.status === 'done' || stage.status === 'pending') continue
      const row = byWorker.get(stage.workerId)
      if (row) row.jobs.push({ order, stage })
    }
  }
  return {
    orders: active,
    workingNow: [...byWorker.values()].filter((r) => r.jobs.length > 0),
    idleCount: [...byWorker.values()].filter((r) => r.jobs.length === 0 && r.worker.active).length,
    events: store.events.slice(0, 40),
    updatedAt: store.updatedAt,
  }
}

function label(id: WorkStageId) {
  return WORK_STAGES.find((s) => s.id === id)?.label ?? id
}

export type { StageStatus }
