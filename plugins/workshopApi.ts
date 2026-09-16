import type { Connect, Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  assertManager,
  assignStage,
  closeOrder,
  createOrder,
  getManagerPin,
  listMachines,
  liveBoard,
  loginWorker,
  orderDetail,
  processBoard,
  resetDemoData,
  scanBarcode,
  snapshot,
  unassignStage,
  updateMachine,
  updateWorker,
  workerDetail,
  workerUpdate,
} from './workshopStore.ts'
import type { MachineStatus, OrderPriority, WorkStageId, WorkerRole } from '../src/lib/workshopTypes.ts'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const raw = await readBody(req)
  if (!raw) return {} as T
  return JSON.parse(raw) as T
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

function managerPin(req: IncomingMessage) {
  const h = req.headers['x-workshop-manager']
  return typeof h === 'string' ? h : Array.isArray(h) ? h[0] : ''
}

async function handleSnapshot(_req: IncomingMessage, res: ServerResponse) {
  send(res, 200, snapshot())
}

async function handleLogin(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' })
  try {
    const body = await readJson<{ role?: 'worker' | 'manager'; code?: string; pin?: string }>(req)
    if (body.role === 'manager') {
      assertManager(body.pin)
      return send(res, 200, {
        role: 'manager',
        name: 'Floor manager',
        pinOk: true,
        hint:
          getManagerPin() === '2468'
            ? 'Default PIN is 2468 (change with WORKSHOP_MANAGER_PIN)'
            : undefined,
      })
    }
    const worker = loginWorker(body.code || '', body.pin || '')
    return send(res, 200, {
      role: 'worker',
      workerId: worker.id,
      code: worker.code,
      name: worker.name,
      workerRole: worker.role,
      bay: worker.bay,
      phone: worker.phone,
    })
  } catch (err) {
    return send(res, 401, { error: err instanceof Error ? err.message : 'Login failed' })
  }
}

async function handleWorkerJobs(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '/', 'http://local')
  const workerId = url.searchParams.get('workerId') || ''
  if (!workerId) return send(res, 400, { error: 'workerId required' })
  try {
    const detail = workerDetail(workerId)
    send(res, 200, {
      jobs: detail.activeJobs,
      completedJobs: detail.completedJobs,
      events: detail.events,
      worker: {
        id: detail.worker.id,
        code: detail.worker.code,
        name: detail.worker.name,
        role: detail.worker.role,
        bay: detail.worker.bay,
        phone: detail.worker.phone,
      },
      updatedAt: snapshot().updatedAt,
    })
  } catch (err) {
    send(res, 400, { error: err instanceof Error ? err.message : 'Load failed' })
  }
}

async function handleWorkerAction(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' })
  try {
    const body = await readJson<{
      workerId: string
      orderId: string
      stageId: WorkStageId
      action: 'start' | 'statement' | 'complete'
      statement?: string
    }>(req)
    const order = workerUpdate(body)
    send(res, 200, { order, snapshot: snapshot() })
  } catch (err) {
    send(res, 400, { error: err instanceof Error ? err.message : 'Update failed' })
  }
}

async function handleScanBarcode(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' })
  try {
    const body = await readJson<{ barcode?: string; workerId?: string }>(req)
    if (!body.barcode || !body.workerId) {
      return send(res, 400, { error: 'barcode and workerId required' })
    }
    const result = scanBarcode({ barcode: body.barcode, workerId: body.workerId })
    send(res, 200, result)
  } catch (err) {
    send(res, 400, { error: err instanceof Error ? err.message : 'Scan failed' })
  }
}

async function handleBoard(req: IncomingMessage, res: ServerResponse) {
  try {
    assertManager(managerPin(req))
    send(res, 200, liveBoard())
  } catch (err) {
    send(res, 401, { error: err instanceof Error ? err.message : 'Unauthorized' })
  }
}

async function handleCreateOrder(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' })
  try {
    assertManager(managerPin(req))
    const body = await readJson<{
      orderNo?: string
      customerName?: string
      productLabel?: string
      notes?: string
      priority?: OrderPriority
      quantity?: number
      material?: string
      finish?: string
      bay?: string
      dueDate?: string | null
      assignments?: Array<{ stageId: WorkStageId; workerId: string; managerNote?: string }>
    }>(req)
    const order = createOrder({
      orderNo: body.orderNo || '',
      customerName: body.customerName || '',
      productLabel: body.productLabel || '',
      notes: body.notes,
      priority: body.priority,
      quantity: body.quantity,
      material: body.material,
      finish: body.finish,
      bay: body.bay,
      dueDate: body.dueDate,
      assignments: body.assignments,
    })
    send(res, 200, { order, snapshot: snapshot() })
  } catch (err) {
    send(res, 400, { error: err instanceof Error ? err.message : 'Create failed' })
  }
}

async function handleAssign(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' })
  try {
    assertManager(managerPin(req))
    const body = await readJson<{
      orderId: string
      stageId: WorkStageId
      workerId: string
      managerNote?: string
    }>(req)
    const order = assignStage(body)
    send(res, 200, { order, snapshot: snapshot() })
  } catch (err) {
    send(res, 400, { error: err instanceof Error ? err.message : 'Assign failed' })
  }
}

async function handleUnassign(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' })
  try {
    assertManager(managerPin(req))
    const body = await readJson<{ orderId: string; stageId: WorkStageId }>(req)
    const order = unassignStage(body.orderId, body.stageId)
    send(res, 200, { order, snapshot: snapshot() })
  } catch (err) {
    send(res, 400, { error: err instanceof Error ? err.message : 'Unassign failed' })
  }
}

async function handleClose(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' })
  try {
    assertManager(managerPin(req))
    const body = await readJson<{ orderId: string }>(req)
    const order = closeOrder(body.orderId)
    send(res, 200, { order, snapshot: snapshot() })
  } catch (err) {
    send(res, 400, { error: err instanceof Error ? err.message : 'Close failed' })
  }
}

async function handleReset(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' })
  try {
    assertManager(managerPin(req))
    send(res, 200, resetDemoData())
  } catch (err) {
    send(res, 401, { error: err instanceof Error ? err.message : 'Unauthorized' })
  }
}

async function handleWorkers(req: IncomingMessage, res: ServerResponse) {
  try {
    assertManager(managerPin(req))
    const snap = snapshot()
    const board = liveBoard()
    const busyIds = new Set(board.workingNow.map((r) => r.worker.id))
    send(res, 200, {
      workers: snap.workers.map(({ pin: _p, ...rest }) => ({
        ...rest,
        busy: busyIds.has(rest.id),
        activeJobCount: board.workingNow.find((r) => r.worker.id === rest.id)?.jobs.length || 0,
      })),
      pins: Object.fromEntries(snap.workers.map((w) => [w.id, w.pin])),
      updatedAt: snap.updatedAt,
    })
  } catch (err) {
    send(res, 401, { error: err instanceof Error ? err.message : 'Unauthorized' })
  }
}

async function handleOrderDetail(req: IncomingMessage, res: ServerResponse) {
  try {
    assertManager(managerPin(req))
    const url = new URL(req.url || '/', 'http://local')
    const orderId = url.searchParams.get('orderId') || ''
    if (!orderId) return send(res, 400, { error: 'orderId required' })
    send(res, 200, orderDetail(orderId))
  } catch (err) {
    send(res, 400, { error: err instanceof Error ? err.message : 'Load failed' })
  }
}

async function handleWorkerDetail(req: IncomingMessage, res: ServerResponse) {
  try {
    assertManager(managerPin(req))
    const url = new URL(req.url || '/', 'http://local')
    const workerId = url.searchParams.get('workerId') || ''
    if (!workerId) return send(res, 400, { error: 'workerId required' })
    const detail = workerDetail(workerId)
    send(res, 200, detail)
  } catch (err) {
    send(res, 400, { error: err instanceof Error ? err.message : 'Load failed' })
  }
}

async function handleWorkerUpdate(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' })
  try {
    assertManager(managerPin(req))
    const body = await readJson<{
      workerId: string
      name?: string
      code?: string
      role?: WorkerRole
      bay?: string
      phone?: string
      pin?: string
      active?: boolean
    }>(req)
    if (!body.workerId) return send(res, 400, { error: 'workerId required' })
    const worker = updateWorker(body)
    send(res, 200, { worker, snapshot: snapshot() })
  } catch (err) {
    send(res, 400, { error: err instanceof Error ? err.message : 'Update failed' })
  }
}

async function handleMachines(req: IncomingMessage, res: ServerResponse) {
  try {
    assertManager(managerPin(req))
    const store = snapshot()
    send(res, 200, {
      machines: listMachines(),
      orders: store.orders.filter((o) => o.status !== 'closed'),
      workers: store.workers.map(({ pin: _p, ...rest }) => rest),
      updatedAt: store.updatedAt,
    })
  } catch (err) {
    send(res, 401, { error: err instanceof Error ? err.message : 'Unauthorized' })
  }
}

async function handleMachineUpdate(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' })
  try {
    assertManager(managerPin(req))
    const body = await readJson<{
      machineId: string
      status?: MachineStatus
      orderId?: string | null
      stageId?: WorkStageId | null
      operatorId?: string | null
      note?: string
    }>(req)
    const machine = updateMachine(body)
    send(res, 200, { machine, snapshot: snapshot() })
  } catch (err) {
    send(res, 400, { error: err instanceof Error ? err.message : 'Update failed' })
  }
}

async function handleProcess(req: IncomingMessage, res: ServerResponse) {
  try {
    assertManager(managerPin(req))
    // Optional ?floor=… accepted for compatibility but ignored — single pipeline
    send(res, 200, processBoard())
  } catch (err) {
    send(res, 401, { error: err instanceof Error ? err.message : 'Unauthorized' })
  }
}

async function handleJobDetail(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '/', 'http://local')
  const orderId = url.searchParams.get('orderId') || ''
  const stageId = url.searchParams.get('stageId') as WorkStageId
  const workerId = url.searchParams.get('workerId') || ''
  if (!orderId || !stageId) return send(res, 400, { error: 'orderId and stageId required' })
  try {
    const snap = snapshot()
    const order = snap.orders.find((o) => o.id === orderId)
    if (!order) throw new Error('Order not found')
    const stage = order.stages.find((s) => s.stageId === stageId)
    if (!stage) throw new Error('Stage not found')
    if (workerId && stage.workerId && stage.workerId !== workerId) {
      throw new Error('This stage is not assigned to you')
    }
    const events = snap.events.filter((e) => e.orderId === orderId)
    const workers = snap.workers.map(({ pin: _p, ...rest }) => rest)
    send(res, 200, { order, stage, events, workers, updatedAt: snap.updatedAt })
  } catch (err) {
    send(res, 400, { error: err instanceof Error ? err.message : 'Load failed' })
  }
}

function attach(middlewares: Connect.Server) {
  middlewares.use('/api/workshop/snapshot', (req, res) => void handleSnapshot(req, res))
  middlewares.use('/api/workshop/login', (req, res) => void handleLogin(req, res))
  middlewares.use('/api/workshop/worker-jobs', (req, res) => void handleWorkerJobs(req, res))
  middlewares.use('/api/workshop/worker-action', (req, res) => void handleWorkerAction(req, res))
  middlewares.use('/api/workshop/scan', (req, res) => void handleScanBarcode(req, res))
  middlewares.use('/api/workshop/board', (req, res) => void handleBoard(req, res))
  middlewares.use('/api/workshop/orders', (req, res, next) => {
    if (req.method === 'POST') void handleCreateOrder(req, res)
    else next()
  })
  middlewares.use('/api/workshop/assign', (req, res) => void handleAssign(req, res))
  middlewares.use('/api/workshop/unassign', (req, res) => void handleUnassign(req, res))
  middlewares.use('/api/workshop/close', (req, res) => void handleClose(req, res))
  middlewares.use('/api/workshop/reset', (req, res) => void handleReset(req, res))
  middlewares.use('/api/workshop/workers/update', (req, res) => void handleWorkerUpdate(req, res))
  middlewares.use('/api/workshop/workers', (req, res) => void handleWorkers(req, res))
  middlewares.use('/api/workshop/order-detail', (req, res) => void handleOrderDetail(req, res))
  middlewares.use('/api/workshop/worker-detail', (req, res) => void handleWorkerDetail(req, res))
  middlewares.use('/api/workshop/job-detail', (req, res) => void handleJobDetail(req, res))
  middlewares.use('/api/workshop/machines', (req, res) => void handleMachines(req, res))
  middlewares.use('/api/workshop/machines/update', (req, res) => void handleMachineUpdate(req, res))
  middlewares.use('/api/workshop/process', (req, res) => void handleProcess(req, res))
}

export function workshopApiPlugin(): Plugin {
  return {
    name: 'workshop-api',
    configureServer(server) {
      attach(server.middlewares)
    },
    configurePreviewServer(server) {
      attach(server.middlewares)
    },
  }
}
