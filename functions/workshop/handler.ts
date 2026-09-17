/**
 * Shared workshop HTTP routing for Cloudflare Pages Functions (Fetch API).
 */
import {
  assertManager,
  assignStage,
  closeOrder,
  configureWorkshopStore,
  createOrder,
  createSeedStore,
  getManagerPin,
  hydrateStore,
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
  type StoreFile,
} from '../../plugins/workshopStoreCore.ts'
import type { MachineStatus, OrderPriority, WorkStageId, WorkerRole } from '../../src/lib/workshopTypes.ts'

export type WorkshopEnv = {
  WORKSHOP_KV?: KVNamespace
  WORKSHOP_MANAGER_PIN?: string
}

const KV_KEY = 'workshop:v1'

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}

async function withKvStore<T>(
  env: WorkshopEnv,
  fn: () => T | Promise<T>,
): Promise<T> {
  let memory: StoreFile
  if (env.WORKSHOP_KV) {
    const raw = await env.WORKSHOP_KV.get(KV_KEY)
    memory = hydrateStore(raw ? (JSON.parse(raw) as Partial<StoreFile>) : null)
  } else {
    memory = createSeedStore()
  }

  configureWorkshopStore({
    load: () => memory,
    save: (store) => {
      memory = store
    },
    reset: () => {
      memory = createSeedStore()
    },
  })

  if (env.WORKSHOP_MANAGER_PIN) {
    // getManagerPin reads process.env in Node; mirror via globalThis for Workers
    ;(globalThis as { WORKSHOP_MANAGER_PIN?: string }).WORKSHOP_MANAGER_PIN =
      env.WORKSHOP_MANAGER_PIN
  }

  try {
    const result = await fn()
    if (env.WORKSHOP_KV) {
      await env.WORKSHOP_KV.put(KV_KEY, JSON.stringify(memory))
    }
    return result
  } finally {
    // no-op
  }
}

function managerPin(req: Request) {
  return req.headers.get('x-workshop-manager') || ''
}

async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T
  } catch {
    return {} as T
  }
}

/** Patch getManagerPin to also check globalThis for Pages. */
export function installManagerPinBridge() {
  // workshopStoreCore getManagerPin uses process.env — Workers may not have it.
  // We overwrite via env in withKvStore; also patch process.env if available.
}

export async function handleWorkshopRequest(
  request: Request,
  env: WorkshopEnv,
): Promise<Response> {
  if (env.WORKSHOP_MANAGER_PIN && typeof process !== 'undefined' && process.env) {
    process.env.WORKSHOP_MANAGER_PIN = env.WORKSHOP_MANAGER_PIN
  }

  const url = new URL(request.url)
  const parts = url.pathname.replace(/^\/api\/workshop\/?/, '').split('/').filter(Boolean)
  const head = parts[0] || ''
  const method = request.method.toUpperCase()

  return withKvStore(env, async () => {
    try {
      if (head === 'snapshot' && method === 'GET') {
        return json(200, snapshot())
      }

      if (head === 'login' && method === 'POST') {
        const body = await readJson<{ role?: 'worker' | 'manager'; code?: string; pin?: string }>(
          request,
        )
        if (body.role === 'manager') {
          assertManager(body.pin)
          return json(200, {
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
        return json(200, {
          role: 'worker',
          workerId: worker.id,
          code: worker.code,
          name: worker.name,
          workerRole: worker.role,
          bay: worker.bay,
          phone: worker.phone,
        })
      }

      if (head === 'worker-jobs' && method === 'GET') {
        const workerId = url.searchParams.get('workerId') || ''
        if (!workerId) return json(400, { error: 'workerId required' })
        const detail = workerDetail(workerId)
        return json(200, {
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
      }

      if (head === 'worker-action' && method === 'POST') {
        const body = await readJson<{
          workerId: string
          orderId: string
          stageId: WorkStageId
          action: 'start' | 'statement' | 'complete'
          statement?: string
        }>(request)
        const order = workerUpdate(body)
        return json(200, { order, snapshot: snapshot() })
      }

      if (head === 'scan' && method === 'POST') {
        const body = await readJson<{ barcode?: string; workerId?: string }>(request)
        if (!body.barcode || !body.workerId) {
          return json(400, { error: 'barcode and workerId required' })
        }
        return json(200, scanBarcode({ barcode: body.barcode, workerId: body.workerId }))
      }

      if (head === 'board' && method === 'GET') {
        assertManager(managerPin(request))
        return json(200, liveBoard())
      }

      if (head === 'orders' && method === 'POST') {
        assertManager(managerPin(request))
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
        }>(request)
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
        return json(200, { order, snapshot: snapshot() })
      }

      if (head === 'assign' && method === 'POST') {
        assertManager(managerPin(request))
        const body = await readJson<{
          orderId: string
          stageId: WorkStageId
          workerId: string
          managerNote?: string
        }>(request)
        return json(200, { order: assignStage(body), snapshot: snapshot() })
      }

      if (head === 'unassign' && method === 'POST') {
        assertManager(managerPin(request))
        const body = await readJson<{ orderId: string; stageId: WorkStageId }>(request)
        return json(200, {
          order: unassignStage(body.orderId, body.stageId),
          snapshot: snapshot(),
        })
      }

      if (head === 'close' && method === 'POST') {
        assertManager(managerPin(request))
        const body = await readJson<{ orderId: string }>(request)
        return json(200, { order: closeOrder(body.orderId), snapshot: snapshot() })
      }

      if (head === 'reset' && method === 'POST') {
        assertManager(managerPin(request))
        return json(200, resetDemoData())
      }

      if (head === 'workers' && parts[1] === 'update' && method === 'POST') {
        assertManager(managerPin(request))
        const body = await readJson<{
          workerId: string
          name?: string
          code?: string
          role?: WorkerRole
          bay?: string
          phone?: string
          pin?: string
          active?: boolean
        }>(request)
        return json(200, { worker: updateWorker(body), snapshot: snapshot() })
      }

      if (head === 'workers' && method === 'GET') {
        assertManager(managerPin(request))
        const snap = snapshot()
        const board = liveBoard()
        return json(200, {
          workers: snap.workers.map(({ pin: _p, ...rest }) => ({
            ...rest,
            busy: !!board.workingNow.find((r) => r.worker.id === rest.id),
            activeJobCount:
              board.workingNow.find((r) => r.worker.id === rest.id)?.jobs.length || 0,
          })),
          pins: Object.fromEntries(snap.workers.map((w) => [w.id, w.pin])),
          updatedAt: snap.updatedAt,
        })
      }

      if (head === 'order-detail' && method === 'GET') {
        assertManager(managerPin(request))
        const orderId = url.searchParams.get('orderId') || ''
        return json(200, orderDetail(orderId))
      }

      if (head === 'worker-detail' && method === 'GET') {
        assertManager(managerPin(request))
        const workerId = url.searchParams.get('workerId') || ''
        return json(200, workerDetail(workerId))
      }

      if (head === 'job-detail' && method === 'GET') {
        const orderId = url.searchParams.get('orderId') || ''
        const stageId = url.searchParams.get('stageId') as WorkStageId
        const detail = orderDetail(orderId)
        const stage = detail.order.stages.find((s) => s.stageId === stageId)
        if (!stage) return json(404, { error: 'Stage not found' })
        const snap = snapshot()
        return json(200, {
          order: detail.order,
          stage,
          events: snap.events.filter((e) => e.orderId === orderId),
          workers: snap.workers.map(({ pin: _p, ...rest }) => rest),
          updatedAt: snap.updatedAt,
        })
      }

      if (head === 'machines' && parts[1] === 'update' && method === 'POST') {
        assertManager(managerPin(request))
        const body = await readJson<{
          machineId: string
          status?: MachineStatus
          orderId?: string | null
          stageId?: WorkStageId | null
          operatorId?: string | null
          note?: string
        }>(request)
        return json(200, { machine: updateMachine(body), snapshot: snapshot() })
      }

      if (head === 'machines' && method === 'GET') {
        assertManager(managerPin(request))
        const snap = snapshot()
        return json(200, {
          machines: listMachines(),
          orders: snap.orders.filter((o) => o.status !== 'closed'),
          workers: snap.workers.map(({ pin: _p, ...rest }) => rest),
          updatedAt: snap.updatedAt,
        })
      }

      if (head === 'process' && method === 'GET') {
        assertManager(managerPin(request))
        return json(200, processBoard())
      }

      return json(404, { error: `Unknown workshop route: ${head || '(root)'}` })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed'
      const status =
        message.includes('PIN') || message.includes('Unauthorized') || message.includes('incorrect')
          ? 401
          : 400
      return json(status, { error: message })
    }
  })
}
