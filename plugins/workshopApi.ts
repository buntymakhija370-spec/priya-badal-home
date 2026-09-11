import { type Connect, type Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  assertManager,
  assignStage,
  closeOrder,
  createOrder,
  getManagerPin,
  liveBoard,
  loginWorker,
  resetDemoData,
  snapshot,
  unassignStage,
  workerJobs,
  workerUpdate,
} from './workshopStore.ts'
import type { WorkStageId } from '../src/lib/workshopTypes.ts'

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
    const body = await readJson<{
      role?: 'worker' | 'manager'
      code?: string
      pin?: string
    }>(req)
    if (body.role === 'manager') {
      assertManager(body.pin)
      return send(res, 200, {
        role: 'manager',
        name: 'Floor manager',
        pinOk: true,
        hint: getManagerPin() === '2468' ? 'Default PIN is 2468 (change with WORKSHOP_MANAGER_PIN)' : undefined,
      })
    }
    const worker = loginWorker(body.code || '', body.pin || '')
    return send(res, 200, {
      role: 'worker',
      workerId: worker.id,
      code: worker.code,
      name: worker.name,
      workerRole: worker.role,
    })
  } catch (err) {
    return send(res, 401, { error: err instanceof Error ? err.message : 'Login failed' })
  }
}

async function handleWorkerJobs(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '/', 'http://local')
  const workerId = url.searchParams.get('workerId') || ''
  if (!workerId) return send(res, 400, { error: 'workerId required' })
  const jobs = workerJobs(workerId)
  send(res, 200, { jobs, updatedAt: snapshot().updatedAt })
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
    }>(req)
    const order = createOrder({
      orderNo: body.orderNo || '',
      customerName: body.customerName || '',
      productLabel: body.productLabel || '',
      notes: body.notes,
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
    send(res, 200, {
      workers: snap.workers.map(({ pin: _pin, ...rest }) => rest),
      updatedAt: snap.updatedAt,
    })
  } catch (err) {
    send(res, 401, { error: err instanceof Error ? err.message : 'Unauthorized' })
  }
}

function attach(middlewares: Connect.Server) {
  middlewares.use('/api/workshop/snapshot', (req, res) => {
    void handleSnapshot(req, res)
  })
  middlewares.use('/api/workshop/login', (req, res) => {
    void handleLogin(req, res)
  })
  middlewares.use('/api/workshop/worker-jobs', (req, res) => {
    void handleWorkerJobs(req, res)
  })
  middlewares.use('/api/workshop/worker-action', (req, res) => {
    void handleWorkerAction(req, res)
  })
  middlewares.use('/api/workshop/board', (req, res) => {
    void handleBoard(req, res)
  })
  middlewares.use('/api/workshop/orders', (req, res, next) => {
    if (req.method === 'POST') void handleCreateOrder(req, res)
    else next()
  })
  middlewares.use('/api/workshop/assign', (req, res) => {
    void handleAssign(req, res)
  })
  middlewares.use('/api/workshop/unassign', (req, res) => {
    void handleUnassign(req, res)
  })
  middlewares.use('/api/workshop/close', (req, res) => {
    void handleClose(req, res)
  })
  middlewares.use('/api/workshop/reset', (req, res) => {
    void handleReset(req, res)
  })
  middlewares.use('/api/workshop/workers', (req, res) => {
    void handleWorkers(req, res)
  })
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
