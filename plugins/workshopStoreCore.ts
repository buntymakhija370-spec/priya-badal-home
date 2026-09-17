/**
 * Workshop process store core — works in Vite (file) and Cloudflare Pages (KV).
 * Storage is injected via configureWorkshopStore().
 */
import type {
  Machine,
  MachineStatus,
  OrderPriority,
  OrderStage,
  StageUpdate,
  StatusEvent,
  WorkStageId,
  Worker,
  WorkshopOrder,
  WorkshopSnapshot,
} from '../src/lib/workshopTypes.ts'
import {
  WORK_STAGES,
  emptyStages,
  makeStageBarcode,
  normalizeStageId,
  orderProgress,
  stageLabel,
} from '../src/lib/workshopTypes.ts'

export type StoreFile = {
  workers: Worker[]
  orders: WorkshopOrder[]
  events: StatusEvent[]
  machines: Machine[]
  updatedAt: string
}

type StoreAccess = {
  load: () => StoreFile
  save: (store: StoreFile) => void
  reset?: () => void
}

let storeAccess: StoreAccess | null = null

/** Inject file or KV-backed storage before handling requests. */
export function configureWorkshopStore(access: StoreAccess) {
  storeAccess = access
}

export function createSeedStore(): StoreFile {
  const workers = seedWorkers()
  const { orders, events } = seedOrders(workers)
  const machines = seedMachines(workers, orders)
  return { workers, orders, events, machines, updatedAt: nowIso() }
}

export function hydrateStore(parsed: Partial<StoreFile> | null | undefined): StoreFile {
  if (!parsed) return createSeedStore()
  try {
    const workers = (parsed.workers || []).map((w) => ({
      ...w,
      role: normalizeWorkerRole(w.role),
      bay: w.bay || BAYS[0],
      active: w.active !== false,
    }))
    const orders = (parsed.orders || []).map(normalizeOrder)
    const events = Array.isArray(parsed.events)
      ? parsed.events.map((e) => ({
          ...e,
          stageId: (normalizeStageId(e.stageId) ?? 'designing') as WorkStageId,
        }))
      : []
    let machines = Array.isArray(parsed.machines)
      ? parsed.machines.map((m) => normalizeMachine(m))
      : []
    if (!machines.length) {
      machines = seedMachines(workers, orders)
    }
    return {
      workers,
      orders,
      events,
      machines,
      updatedAt: parsed.updatedAt || nowIso(),
    }
  } catch {
    return createSeedStore()
  }
}

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
const BAYS = ['Bay A', 'Bay B', 'Bay C', 'Bay D', 'Polish room', 'Paint booth', 'CNC cell', 'Assembly']

const ROLE_CYCLE: Worker['role'][] = [
  'designing',
  'cutting',
  'edge_bending',
  'boring',
  'painting',
  'leather_job',
  'oxidisation',
  'multi',
]

function nowIso() {
  return new Date().toISOString()
}

function uid(prefix: string) {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${prefix}_${hex}`
}

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3_600_000).toISOString()
}

function daysFromNow(d: number) {
  return new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10)
}

function normalizeWorkerRole(role: string): Worker['role'] {
  if (role === 'multi') return 'multi'
  return normalizeStageId(role) ?? 'multi'
}

function seedWorkers(): Worker[] {
  const workers: Worker[] = []
  for (let i = 1; i <= 60; i++) {
    const code = `W${String(i).padStart(2, '0')}`
    workers.push({
      id: `worker_${code.toLowerCase()}`,
      code,
      name: `${FIRST[(i - 1) % FIRST.length]} ${LAST[Math.floor((i - 1) / FIRST.length) % LAST.length]}`,
      pin: String(1000 + ((i * 37) % 9000)),
      role: ROLE_CYCLE[(i - 1) % ROLE_CYCLE.length],
      phone: `98${String(10_000_000 + i * 1357).slice(0, 8)}`,
      active: true,
      bay: BAYS[(i - 1) % BAYS.length],
    })
  }
  return workers
}

function pushUpdate(
  stage: OrderStage,
  workerId: string,
  text: string,
  kind: StageUpdate['kind'],
) {
  stage.updates.push({ id: uid('upd'), at: nowIso(), workerId, text, kind })
}

function seedOrders(workers: Worker[]): { orders: WorkshopOrder[]; events: StatusEvent[] } {
  const designer = workers.find((w) => w.role === 'designing')!
  const cutter = workers.find((w) => w.role === 'cutting')!
  const edger = workers.find((w) => w.role === 'edge_bending')!
  const borer = workers.find((w) => w.role === 'boring')!
  const painter = workers.find((w) => w.role === 'painting')!
  const leather = workers.find((w) => w.role === 'leather_job')!
  const oxide = workers.find((w) => w.role === 'oxidisation')!
  void edger
  void borer

  const mk = (
    orderNo: string,
    customerName: string,
    productLabel: string,
    notes: string,
    extra: Partial<WorkshopOrder>,
    mutate: (stages: OrderStage[]) => void,
  ): WorkshopOrder => {
    const stages = emptyStages(orderNo)
    mutate(stages)
    // Keep barcodes aligned with final order number
    for (const s of stages) s.barcode = makeStageBarcode(orderNo, s.stageId)
    const anyProgress = stages.some((s) => s.status !== 'pending')
    const allDone = stages.every((s) => s.status === 'done')
    return {
      id: uid('ord'),
      orderNo,
      customerName,
      productLabel,
      notes,
      createdAt: extra.createdAt || hoursAgo(8),
      closedAt: allDone ? nowIso() : null,
      status: allDone ? 'closed' : anyProgress ? 'in_progress' : 'open',
      priority: extra.priority || 'normal',
      quantity: extra.quantity ?? 1,
      material: extra.material || 'BWP plywood',
      finish: extra.finish || 'Matt laminate',
      bay: extra.bay || 'Bay A',
      dueDate: extra.dueDate ?? daysFromNow(5),
      stages,
    }
  }

  // Designing done, cutting in progress
  const o1 = mk(
    'PBH-2401',
    'Sharma Residence',
    'Kitchen carcass — oak matt',
    '8 carcass units, soft-close',
    {
      priority: 'urgent',
      quantity: 8,
      material: 'BWP 18mm',
      finish: 'Oak matt laminate',
      bay: 'Bay B',
      dueDate: daysFromNow(2),
      createdAt: hoursAgo(30),
    },
    (stages) => {
      const d = stages.find((s) => s.stageId === 'designing')!
      d.status = 'done'
      d.workerId = designer.id
      d.startedAt = hoursAgo(28)
      d.completedAt = hoursAgo(26)
      d.statement = 'Layout locked, CNC file ready'
      d.updates = [
        { id: uid('upd'), at: hoursAgo(28), workerId: designer.id, text: 'Started layout', kind: 'started' },
        { id: uid('upd'), at: hoursAgo(26), workerId: designer.id, text: 'Layout locked, CNC file ready', kind: 'completed' },
      ]
      const c = stages.find((s) => s.stageId === 'cutting')!
      c.status = 'in_progress'
      c.workerId = cutter.id
      c.startedAt = hoursAgo(4)
      c.statement = 'Cutting panels — bay 2, 6/8 done'
      c.managerNote = 'Priority for Tuesday install'
      c.updates = [
        { id: uid('upd'), at: hoursAgo(4), workerId: cutter.id, text: 'Started cutting panels', kind: 'started' },
        { id: uid('upd'), at: hoursAgo(1), workerId: cutter.id, text: 'Cutting panels — 6/8 done', kind: 'statement' },
      ]
    },
  )

  // Designing + cutting assigned; painting note for later
  const o2 = mk(
    'PBH-2402',
    'Mehta Villa',
    'Fluted TV panel — white + brass',
    'White + brass accents, 10 ft — paint then leather trim',
    {
      priority: 'rush',
      quantity: 1,
      material: 'MDF fluted',
      finish: 'White gloss + brass',
      bay: 'Paint booth',
      dueDate: daysFromNow(3),
      createdAt: hoursAgo(12),
    },
    (stages) => {
      const d = stages.find((s) => s.stageId === 'designing')!
      d.status = 'assigned'
      d.workerId = designer.id
      d.managerNote = 'Confirm fluted groove spacing with client'
      const c = stages.find((s) => s.stageId === 'cutting')!
      c.status = 'assigned'
      c.workerId = cutter.id
      c.managerNote = 'Cut after design approval'
      const p = stages.find((s) => s.stageId === 'painting')!
      p.managerNote = 'High-gloss white — mask brass inserts'
      const l = stages.find((s) => s.stageId === 'leather_job')!
      l.managerNote = 'Leather wrap on side returns after paint cure'
    },
  )

  // Open — not started
  const o3 = mk(
    'PBH-2403',
    'Kapoor Flat',
    'Wardrobe boxes — walnut',
    'Sliding mix, LED strip',
    {
      priority: 'normal',
      quantity: 1,
      material: 'BWP 18mm',
      finish: 'Walnut laminate',
      bay: 'Bay C',
      dueDate: daysFromNow(7),
      createdAt: hoursAgo(6),
    },
    () => {},
  )

  // Closed reference — all stages done
  const o4 = mk(
    'PBH-2390',
    'Iyer Home',
    'Temple panel — teak with oxide hardware',
    'Delivered last week — closed reference',
    {
      priority: 'normal',
      quantity: 1,
      material: 'Teak',
      finish: 'Natural polish + oxidised brass',
      bay: 'Assembly',
      dueDate: daysFromNow(-3),
      createdAt: hoursAgo(120),
    },
    (stages) => {
      const map: Partial<Record<WorkStageId, Worker>> = {
        designing: designer,
        cutting: cutter,
        edge_bending: edger,
        boring: borer,
        painting: painter,
        leather_job: leather,
        oxidisation: oxide,
      }
      for (const s of stages) {
        const w = map[s.stageId]!
        s.status = 'done'
        s.workerId = w.id
        s.startedAt = hoursAgo(100)
        s.completedAt = hoursAgo(90)
        s.statement = 'Completed'
        s.updates = [
          { id: uid('upd'), at: hoursAgo(90), workerId: w.id, text: 'Completed', kind: 'completed' },
        ]
      }
    },
  )

  const events: StatusEvent[] = [
    {
      id: uid('evt'),
      at: hoursAgo(26),
      orderId: o1.id,
      workerId: designer.id,
      stageId: 'designing',
      kind: 'completed',
      message: `${designer.name} completed Designing on ${o1.orderNo}`,
    },
    {
      id: uid('evt'),
      at: hoursAgo(4),
      orderId: o1.id,
      workerId: cutter.id,
      stageId: 'cutting',
      kind: 'started',
      message: `${cutter.name} started Cutting on ${o1.orderNo}: Cutting panels`,
    },
    {
      id: uid('evt'),
      at: hoursAgo(12),
      orderId: o2.id,
      workerId: designer.id,
      stageId: 'designing',
      kind: 'assigned',
      message: `${designer.name} assigned to Designing on ${o2.orderNo}`,
    },
    {
      id: uid('evt'),
      at: hoursAgo(90),
      orderId: o4.id,
      workerId: 'manager',
      stageId: 'oxidisation',
      kind: 'closed',
      message: `Order ${o4.orderNo} closed — all processes complete`,
    },
  ]

  return { orders: [o1, o2, o3, o4], events }
}

function seedMachines(workers: Worker[], orders: WorkshopOrder[]): Machine[] {
  const cutter = workers.find((w) => w.role === 'cutting')
  const painter = workers.find((w) => w.role === 'painting')

  const o1 = orders.find((o) => o.orderNo === 'PBH-2401')
  const o2 = orders.find((o) => o.orderNo === 'PBH-2402')
  const o1Cutting = o1?.stages.find((s) => s.stageId === 'cutting')

  const mk = (
    code: string,
    name: string,
    type: string,
    bay: string,
    extra: Partial<Machine> = {},
  ): Machine => ({
    id: uid('mach'),
    code,
    name,
    type,
    bay,
    status: 'idle',
    orderId: null,
    stageId: null,
    operatorId: null,
    note: '',
    updatedAt: nowIso(),
    ...extra,
  })

  return [
    mk('NEST-01', 'Nesting router', 'Nesting', 'CNC cell', { status: 'idle' }),
    mk('BORE-01', 'Boring machine', 'Boring', 'Bay A', { status: 'idle' }),
    mk('EDGE-01', 'Edge banding', 'Edge bending', 'Bay B', { status: 'idle' }),
    mk('PAINT-01', 'Paint booth 1', 'Paint booth', 'Paint booth', {
      status: 'idle',
      orderId: o2?.id ?? null,
      stageId: 'painting',
      operatorId: painter?.id ?? null,
      note: 'Queued for fluted TV panel after design',
    }),
    mk('PAINT-02', 'Paint booth 2', 'Paint booth', 'Paint booth', { status: 'idle' }),
    mk('PAINT-03', 'Paint booth 3', 'Paint booth', 'Paint booth', { status: 'idle' }),
    mk('CNC-01', 'CNC machine 1', 'CNC', 'CNC cell', {
      status: 'running',
      orderId: o1?.id ?? null,
      stageId: 'cutting',
      operatorId: o1Cutting?.workerId ?? cutter?.id ?? null,
      note: 'Running carcass panels — 6/8 done',
    }),
    mk('CNC-02', 'CNC machine 2', 'CNC', 'CNC cell', { status: 'idle' }),
    mk('LASER-01', 'CO2 Laser', 'CO2 Laser', 'CNC cell', { status: 'idle' }),
    mk('STITCH-01', 'Stitching machine 1', 'Stitching', 'Assembly', { status: 'idle' }),
    mk('STITCH-02', 'Stitching machine 2', 'Stitching', 'Assembly', { status: 'idle' }),
    mk('STITCH-03', 'Stitching machine 3', 'Stitching', 'Assembly', { status: 'idle' }),
  ]
}

function normalizeStage(
  raw: Partial<OrderStage> & { stageId: WorkStageId },
  orderNo: string,
): OrderStage {
  return {
    stageId: raw.stageId,
    status: raw.status || 'pending',
    workerId: raw.workerId ?? null,
    startedAt: raw.startedAt ?? null,
    completedAt: raw.completedAt ?? null,
    statement: raw.statement || '',
    updates: Array.isArray(raw.updates) ? raw.updates : [],
    managerNote: raw.managerNote || '',
    barcode: raw.barcode || makeStageBarcode(orderNo, raw.stageId),
  }
}

function normalizeOrder(raw: WorkshopOrder & { floorType?: string; stages?: Array<Partial<OrderStage> & { stageId: string }> }): WorkshopOrder {
  const src = Array.isArray(raw.stages) ? raw.stages : []
  const byNormalized = new Map<WorkStageId, Partial<OrderStage> & { stageId: string }>()
  for (const s of src) {
    const nid = normalizeStageId(s.stageId)
    if (nid && !byNormalized.has(nid)) byNormalized.set(nid, s)
  }
  const stages = emptyStages(raw.orderNo || 'TEMP').map((blank) => {
    const found = byNormalized.get(blank.stageId)
    return found
      ? normalizeStage({ ...found, stageId: blank.stageId }, raw.orderNo)
      : { ...blank, barcode: makeStageBarcode(raw.orderNo, blank.stageId) }
  })
  return {
    id: raw.id,
    orderNo: raw.orderNo,
    customerName: raw.customerName,
    productLabel: raw.productLabel,
    notes: raw.notes || '',
    createdAt: raw.createdAt,
    closedAt: raw.closedAt ?? null,
    status: raw.status,
    priority: raw.priority || 'normal',
    quantity: typeof raw.quantity === 'number' ? raw.quantity : 1,
    material: raw.material || '',
    finish: raw.finish || '',
    bay: raw.bay || '',
    dueDate: raw.dueDate ?? null,
    stages,
  }
}

function normalizeMachine(raw: Partial<Machine> & { code: string }): Machine {
  const stageId = raw.stageId ? normalizeStageId(raw.stageId) : null
  return {
    id: raw.id || uid('mach'),
    code: raw.code,
    name: raw.name || raw.code,
    type: raw.type || '',
    bay: raw.bay || '',
    status: raw.status || 'idle',
    orderId: raw.orderId ?? null,
    stageId,
    operatorId: raw.operatorId ?? null,
    note: raw.note || '',
    updatedAt: raw.updatedAt || nowIso(),
  }
}

function ensureStore(): StoreFile {
  if (!storeAccess) throw new Error('Workshop store is not configured')
  return storeAccess.load()
}

function saveStore(store: StoreFile) {
  if (!storeAccess) throw new Error('Workshop store is not configured')
  store.updatedAt = nowIso()
  storeAccess.save(store)
}

function pushEvent(store: StoreFile, partial: Omit<StatusEvent, 'id' | 'at'> & { at?: string }) {
  store.events.unshift({
    id: uid('evt'),
    at: partial.at || nowIso(),
    orderId: partial.orderId,
    workerId: partial.workerId,
    stageId: partial.stageId,
    kind: partial.kind,
    message: partial.message,
  })
  if (store.events.length > 500) store.events.length = 500
}

function recomputeOrderStatus(order: WorkshopOrder) {
  if (order.closedAt) {
    order.status = 'closed'
    return
  }
  if (order.stages.every((s) => s.status === 'done')) {
    order.status = 'closed'
    order.closedAt = nowIso()
    return
  }
  order.status = order.stages.some((s) => s.status !== 'pending') ? 'in_progress' : 'open'
}

export function getManagerPin(): string {
  const fromProcess =
    typeof process !== 'undefined' && process.env?.WORKSHOP_MANAGER_PIN
      ? process.env.WORKSHOP_MANAGER_PIN
      : ''
  const fromGlobal =
    typeof globalThis !== 'undefined'
      ? (globalThis as { WORKSHOP_MANAGER_PIN?: string }).WORKSHOP_MANAGER_PIN || ''
      : ''
  return (fromProcess || fromGlobal || '2468').trim()
}

export function assertManager(pin: string | undefined | null) {
  if (!pin || pin !== getManagerPin()) throw new Error('Manager PIN incorrect')
}

export function snapshot(): WorkshopSnapshot {
  const store = ensureStore()
  return {
    workers: store.workers,
    orders: store.orders,
    events: store.events.slice(0, 120),
    machines: store.machines,
    updatedAt: store.updatedAt,
  }
}

export function loginWorker(code: string, pin: string): Worker {
  const store = ensureStore()
  const worker = store.workers.find(
    (w) => w.code.toUpperCase() === code.trim().toUpperCase() && w.active,
  )
  if (!worker || worker.pin !== pin.trim()) throw new Error('Worker code or PIN incorrect')
  return worker
}

export function createOrder(input: {
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
  assignments?: Array<{ stageId: WorkStageId; workerId: string; managerNote?: string }>
}): WorkshopOrder {
  const store = ensureStore()
  const orderNo = input.orderNo.trim() || `PBH-${Date.now().toString().slice(-4)}`
  if (store.orders.some((o) => o.orderNo === orderNo && !o.closedAt)) {
    throw new Error(`Open order ${orderNo} already exists`)
  }
  const stages = emptyStages(orderNo)
  const order: WorkshopOrder = {
    id: uid('ord'),
    orderNo,
    customerName: input.customerName.trim() || 'Customer',
    productLabel: input.productLabel.trim() || 'Custom piece',
    notes: (input.notes || '').trim(),
    createdAt: nowIso(),
    closedAt: null,
    status: 'open',
    priority: input.priority || 'normal',
    quantity: input.quantity && input.quantity > 0 ? input.quantity : 1,
    material: (input.material || '').trim(),
    finish: (input.finish || '').trim(),
    bay: (input.bay || '').trim(),
    dueDate: input.dueDate || null,
    stages,
  }
  store.orders.unshift(order)
  pushEvent(store, {
    orderId: order.id,
    workerId: 'manager',
    stageId: 'designing',
    kind: 'assigned',
    message: `Manager posted order ${order.orderNo} — ${order.productLabel}`,
  })

  const allowed = new Set(WORK_STAGES.map((s) => s.id))
  for (const assignment of input.assignments || []) {
    if (!allowed.has(assignment.stageId)) {
      throw new Error(`${stageLabel(assignment.stageId)} is not a valid process stage`)
    }
    const worker = store.workers.find((w) => w.id === assignment.workerId && w.active)
    if (!worker) throw new Error('Worker not found for assignment')
    const stage = order.stages.find((s) => s.stageId === assignment.stageId)
    if (!stage) throw new Error('Stage not found')
    stage.workerId = worker.id
    stage.status = 'assigned'
    stage.managerNote = (assignment.managerNote || '').trim()
    pushEvent(store, {
      orderId: order.id,
      workerId: worker.id,
      stageId: assignment.stageId,
      kind: 'assigned',
      message: `${worker.name} joined ${stageLabel(assignment.stageId)} on ${order.orderNo}${
        stage.managerNote ? ` — ${stage.managerNote}` : ''
      }`,
    })
  }

  recomputeOrderStatus(order)
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
  stage.managerNote = (input.managerNote || '').trim()
  if (!stage.barcode) stage.barcode = makeStageBarcode(order.orderNo, stage.stageId)
  recomputeOrderStatus(order)

  pushEvent(store, {
    orderId: order.id,
    workerId: worker.id,
    stageId: input.stageId,
    kind: 'assigned',
    message: `${worker.name} assigned to ${stageLabel(input.stageId)} on ${order.orderNo}${
      stage.managerNote ? ` — ${stage.managerNote}` : ''
    }`,
  })
  saveStore(store)
  return order
}

/** Resolve a scanned barcode and claim the stage for the worker. */
export function scanBarcode(input: {
  barcode: string
  workerId: string
}): { order: WorkshopOrder; stage: OrderStage; claimed: boolean; message: string } {
  const store = ensureStore()
  const code = input.barcode.trim().toUpperCase()
  if (!code) throw new Error('Scan or type a barcode')

  const worker = store.workers.find((w) => w.id === input.workerId && w.active)
  if (!worker) throw new Error('Worker not found')

  let found: { order: WorkshopOrder; stage: OrderStage } | null = null
  for (const order of store.orders) {
    if (order.status === 'closed') continue
    for (const stage of order.stages) {
      const bc = (stage.barcode || makeStageBarcode(order.orderNo, stage.stageId)).toUpperCase()
      if (bc === code) {
        found = { order, stage }
        break
      }
    }
    if (found) break
  }

  if (!found) throw new Error('Barcode not found — check the label')
  const { order, stage } = found

  if (stage.status === 'done') {
    throw new Error(`${stageLabel(stage.stageId)} on ${order.orderNo} is already complete`)
  }

  if (stage.workerId === worker.id) {
    return {
      order,
      stage,
      claimed: false,
      message: `Already your job — ${stageLabel(stage.stageId)} on ${order.orderNo}`,
    }
  }

  // Claim / reassign to the scanner
  stage.workerId = worker.id
  if (stage.status === 'pending' || stage.status === 'assigned') {
    stage.status = 'assigned'
    stage.startedAt = null
    stage.completedAt = null
  }
  if (!stage.barcode) stage.barcode = makeStageBarcode(order.orderNo, stage.stageId)
  recomputeOrderStatus(order)
  pushEvent(store, {
    orderId: order.id,
    workerId: worker.id,
    stageId: stage.stageId,
    kind: 'assigned',
    message: `${worker.name} scanned barcode and claimed ${stageLabel(stage.stageId)} on ${order.orderNo}`,
  })
  saveStore(store)
  return {
    order,
    stage,
    claimed: true,
    message: `Claimed ${stageLabel(stage.stageId)} on ${order.orderNo}`,
  }
}

export function unassignStage(orderId: string, stageId: WorkStageId): WorkshopOrder {
  const store = ensureStore()
  const order = store.orders.find((o) => o.id === orderId)
  if (!order) throw new Error('Order not found')
  const stage = order.stages.find((s) => s.stageId === stageId)
  if (!stage) throw new Error('Stage not found')
  if (stage.status === 'done') throw new Error('Cannot unassign completed stage')
  const prev = stage.workerId
  stage.workerId = null
  stage.status = 'pending'
  stage.statement = ''
  stage.startedAt = null
  stage.managerNote = ''
  recomputeOrderStatus(order)
  if (prev) {
    pushEvent(store, {
      orderId: order.id,
      workerId: prev,
      stageId,
      kind: 'unassigned',
      message: `${stageLabel(stageId)} unassigned on ${order.orderNo}`,
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
  if (stage.workerId !== worker.id) throw new Error('This job is not assigned to you')

  if (input.action === 'start') {
    if (stage.status === 'done') throw new Error('Already completed')
    stage.status = 'in_progress'
    stage.startedAt = stage.startedAt || nowIso()
    const msg = (input.statement || '').trim() || `Started ${stageLabel(input.stageId)}`
    stage.statement = msg
    pushUpdate(stage, worker.id, msg, 'started')
    pushEvent(store, {
      orderId: order.id,
      workerId: worker.id,
      stageId: input.stageId,
      kind: 'started',
      message: `${worker.name} started ${stageLabel(input.stageId)} on ${order.orderNo}: ${msg}`,
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
    pushUpdate(stage, worker.id, msg, 'statement')
    pushEvent(store, {
      orderId: order.id,
      workerId: worker.id,
      stageId: input.stageId,
      kind: 'statement',
      message: `${worker.name} on ${order.orderNo} (${stageLabel(input.stageId)}): ${msg}`,
    })
  } else if (input.action === 'complete') {
    if (stage.status === 'done') throw new Error('Already completed')
    const msg = (input.statement || '').trim() || stage.statement || 'Stage completed'
    stage.statement = msg
    stage.status = 'done'
    stage.startedAt = stage.startedAt || nowIso()
    stage.completedAt = nowIso()
    pushUpdate(stage, worker.id, msg, 'completed')
    pushEvent(store, {
      orderId: order.id,
      workerId: worker.id,
      stageId: input.stageId,
      kind: 'completed',
      message: `${worker.name} completed ${stageLabel(input.stageId)} on ${order.orderNo}: ${msg}`,
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
      message: `Order ${order.orderNo} closed — all process stages done`,
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
  pushEvent(store, {
    orderId: order.id,
    workerId: 'manager',
    stageId: 'oxidisation',
    kind: 'closed',
    message: `${managerName} closed order ${order.orderNo}`,
  })
  saveStore(store)
  return order
}

export function resetDemoData(): WorkshopSnapshot {
  if (storeAccess?.reset) {
    storeAccess.reset()
  } else {
    const store = createSeedStore()
    saveStore(store)
  }
  return snapshot()
}

export function listMachines(): Machine[] {
  const store = ensureStore()
  return store.machines
}

export function updateMachine(input: {
  machineId: string
  status?: MachineStatus
  orderId?: string | null
  stageId?: WorkStageId | null
  operatorId?: string | null
  note?: string
}): Machine {
  const store = ensureStore()
  const machine = store.machines.find((m) => m.id === input.machineId)
  if (!machine) throw new Error('Machine not found')
  if (input.status !== undefined) machine.status = input.status
  if (input.orderId !== undefined) machine.orderId = input.orderId
  if (input.stageId !== undefined) machine.stageId = input.stageId
  if (input.operatorId !== undefined) machine.operatorId = input.operatorId
  if (input.note !== undefined) machine.note = input.note
  machine.updatedAt = nowIso()
  saveStore(store)
  return machine
}

export function processBoard(_floorIgnored?: string) {
  const store = ensureStore()
  const open = store.orders.filter((o) => o.status !== 'closed')
  const workerMap = new Map(store.workers.map((w) => [w.id, w]))

  const columns = WORK_STAGES.map((stage) => {
    const active: {
      order: WorkshopOrder
      stage: OrderStage
      worker: Worker | null
    }[] = []
    const pending: { order: WorkshopOrder; stage: OrderStage }[] = []

    for (const order of open) {
      const s = order.stages.find((x) => x.stageId === stage.id)
      if (!s) continue
      if (s.status === 'assigned' || s.status === 'in_progress') {
        active.push({
          order,
          stage: s,
          worker: s.workerId ? workerMap.get(s.workerId) ?? null : null,
        })
      } else if (s.status === 'pending') {
        const idx = order.stages.findIndex((x) => x.stageId === stage.id)
        const prevDone = order.stages.slice(0, idx).every((x) => x.status === 'done')
        if (prevDone || idx === 0) pending.push({ order, stage: s })
      }
    }

    return {
      stageId: stage.id,
      label: stage.label,
      short: stage.short,
      active,
      pending,
    }
  })

  return {
    columns,
    orders: open,
    workers: store.workers.map(({ pin: _p, ...rest }) => rest),
    updatedAt: store.updatedAt,
  }
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

export function workerHistory(workerId: string) {
  const store = ensureStore()
  const completed = store.orders.flatMap((order) =>
    order.stages
      .filter((s) => s.workerId === workerId && s.status === 'done')
      .map((stage) => ({ order, stage })),
  )
  const events = store.events.filter((e) => e.workerId === workerId).slice(0, 40)
  return { completed, events }
}

export function liveBoard() {
  const store = ensureStore()
  const open = store.orders.filter((o) => o.status !== 'closed')
  const closed = store.orders.filter((o) => o.status === 'closed')
  const byWorker = new Map<
    string,
    { worker: Worker; jobs: { order: WorkshopOrder; stage: OrderStage }[] }
  >()
  for (const w of store.workers) byWorker.set(w.id, { worker: w, jobs: [] })
  for (const order of open) {
    for (const stage of order.stages) {
      if (!stage.workerId || stage.status === 'done' || stage.status === 'pending') continue
      byWorker.get(stage.workerId)?.jobs.push({ order, stage })
    }
  }
  const workingNow = [...byWorker.values()].filter((r) => r.jobs.length > 0)
  const stageStats = WORK_STAGES.map((s) => ({
    stageId: s.id,
    label: s.label,
    pending: open.filter((o) => o.stages.find((x) => x.stageId === s.id)?.status === 'pending').length,
    assigned: open.filter((o) => o.stages.find((x) => x.stageId === s.id)?.status === 'assigned').length,
    inProgress: open.filter((o) => o.stages.find((x) => x.stageId === s.id)?.status === 'in_progress')
      .length,
    done: open.filter((o) => o.stages.find((x) => x.stageId === s.id)?.status === 'done').length,
  }))

  return {
    orders: open,
    closedOrders: closed.slice(0, 20),
    workingNow,
    idleCount: [...byWorker.values()].filter((r) => r.jobs.length === 0 && r.worker.active).length,
    events: store.events.slice(0, 60),
    stageStats,
    totals: {
      open: open.length,
      closed: closed.length,
      urgent: open.filter((o) => o.priority !== 'normal').length,
      avgProgress: open.length
        ? Math.round(open.reduce((sum, o) => sum + orderProgress(o).percent, 0) / open.length)
        : 0,
    },
    updatedAt: store.updatedAt,
  }
}

export function orderDetail(orderId: string) {
  const store = ensureStore()
  const order = store.orders.find((o) => o.id === orderId)
  if (!order) throw new Error('Order not found')
  return {
    order,
    events: store.events.filter((e) => e.orderId === orderId),
    workers: store.workers.map(({ pin: _p, ...rest }) => rest),
    progress: orderProgress(order),
  }
}

export function workerDetail(workerId: string) {
  const store = ensureStore()
  const worker = store.workers.find((w) => w.id === workerId)
  if (!worker) throw new Error('Worker not found')
  const history = workerHistory(workerId)
  return {
    worker,
    activeJobs: workerJobs(workerId),
    completedJobs: history.completed.slice(0, 20),
    events: history.events,
  }
}

export function updateWorker(input: {
  workerId: string
  name?: string
  code?: string
  role?: Worker['role']
  bay?: string
  phone?: string
  pin?: string
  active?: boolean
}): Worker {
  const store = ensureStore()
  const worker = store.workers.find((w) => w.id === input.workerId)
  if (!worker) throw new Error('Worker not found')

  if (input.name !== undefined) {
    const name = input.name.trim()
    if (!name) throw new Error('Name is required')
    worker.name = name
  }
  if (input.code !== undefined) {
    const code = input.code.trim().toUpperCase()
    if (!code) throw new Error('Worker code is required')
    if (store.workers.some((w) => w.id !== worker.id && w.code.toUpperCase() === code)) {
      throw new Error(`Worker code ${code} is already in use`)
    }
    worker.code = code
  }
  if (input.role !== undefined) {
    const allowed = new Set<Worker['role']>([...WORK_STAGES.map((s) => s.id), 'multi'])
    if (!allowed.has(input.role)) throw new Error('Invalid worker role')
    worker.role = input.role
  }
  if (input.bay !== undefined) worker.bay = input.bay.trim()
  if (input.phone !== undefined) worker.phone = input.phone.trim()
  if (input.pin !== undefined) {
    const pin = input.pin.trim()
    if (!/^\d{4}$/.test(pin)) throw new Error('PIN must be 4 digits')
    worker.pin = pin
  }
  if (input.active !== undefined) worker.active = input.active

  saveStore(store)
  return worker
}
