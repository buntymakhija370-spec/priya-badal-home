import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'

type JobStatus = 'queued' | 'assigned' | 'in_progress' | 'done' | 'blocked'
type DepartmentId =
  | 'cutting'
  | 'cnc'
  | 'carcass'
  | 'finishing'
  | 'hardware'
  | 'qc'
  | 'packing'
  | 'dispatch'

type OrderLine = {
  id: string
  productName: string
  sku?: string
  category?: string
  qty: number
  unitPrice: number
  notes?: string
  widthFt?: number
  heightFt?: number
  depthFt?: number
  finish?: string
}

type WorkshopOrder = {
  id: string
  orderNo: string
  createdAt: string
  updatedAt: string
  source: string
  status: string
  customerName: string
  customerPhone: string
  customerCity?: string
  partnerId?: string
  partnerName?: string
  lines: OrderLine[]
  advancePaid: number
  totalAmount: number
  dueDate?: string
  productionNotes?: string
  dispatchNotes?: string
  vehicleNo?: string
  dispatchedAt?: string
  jobs: Record<string, JobStatus>
}

type Partner = {
  id: string
  name: string
  phone: string
  city: string
  active: boolean
  notes?: string
}

type DepartmentReport = {
  id: string
  departmentId: DepartmentId
  orderId: string
  status: JobStatus
  assignee?: string
  note: string
  at: string
}

type ClientAccount = {
  id: string
  loginId: string
  pin: string
  name: string
  phone: string
  active: boolean
}

type WorkshopDb = {
  version: 1
  partners: Partner[]
  clients?: ClientAccount[]
  orders: WorkshopOrder[]
  reports: DepartmentReport[]
  nextOrderSeq: number
}

const emptyJobs = (): Record<string, JobStatus> => ({
  cutting: 'queued',
  cnc: 'queued',
  carcass: 'queued',
  finishing: 'queued',
  hardware: 'queued',
  qc: 'queued',
  packing: 'queued',
  dispatch: 'queued',
})

function dbPath() {
  return path.resolve(process.cwd(), 'data/workshop-db.json')
}

function readDb(): WorkshopDb {
  const file = dbPath()
  if (!fs.existsSync(file)) {
    const seed: WorkshopDb = {
      version: 1,
      partners: [],
      clients: [],
      orders: [],
      reports: [],
      nextOrderSeq: 1001,
    }
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(seed, null, 2))
    return seed
  }
  return JSON.parse(fs.readFileSync(file, 'utf8')) as WorkshopDb
}

function writeDb(db: WorkshopDb) {
  fs.mkdirSync(path.dirname(dbPath()), { recursive: true })
  fs.writeFileSync(dbPath(), JSON.stringify(db, null, 2))
}

function readBody(req: Connect.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.from(c)))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function normalizePhone(phone: string) {
  return String(phone || '').replace(/\D/g, '').slice(-10)
}

function findClient(db: WorkshopDb, loginId: string, pin: string) {
  const id = loginId.trim().toUpperCase()
  const clients = db.clients || []
  return clients.find(
    (c) => c.active !== false && c.loginId.toUpperCase() === id && c.pin === pin,
  )
}

function ordersForClient(db: WorkshopDb, client: ClientAccount) {
  const phone = normalizePhone(client.phone)
  return db.orders.filter((o) => normalizePhone(o.customerPhone) === phone)
}

function workshopMiddleware(): Connect.NextHandleFunction {
  return async (req: IncomingMessage, res: ServerResponse, next) => {
    const url = req.url || ''
    if (!url.startsWith('/api/workshop')) return next()

    try {
      if (req.method === 'GET' && (url === '/api/workshop' || url.startsWith('/api/workshop?'))) {
        return send(res, 200, readDb())
      }

      if (req.method === 'PUT' && url === '/api/workshop') {
        const body = (await readBody(req)) as WorkshopDb
        writeDb(body)
        return send(res, 200, body)
      }

      if (req.method === 'POST' && url === '/api/workshop/orders') {
        const body = (await readBody(req)) as Partial<WorkshopOrder> & {
          lines: Omit<OrderLine, 'id'>[]
        }
        const db = readDb()
        const now = new Date().toISOString()
        const seq = db.nextOrderSeq++
        const order: WorkshopOrder = {
          id: `ord_${seq}`,
          orderNo: `PBH-${seq}`,
          createdAt: now,
          updatedAt: now,
          source: body.source || 'offline',
          status: body.status || 'confirmed',
          customerName: body.customerName || 'Customer',
          customerPhone: body.customerPhone || '',
          customerCity: body.customerCity,
          partnerId: body.partnerId,
          partnerName: body.partnerName,
          lines: (body.lines || []).map((l) => ({
            ...l,
            id: crypto.randomUUID(),
          })),
          advancePaid: body.advancePaid || 0,
          totalAmount: body.totalAmount || 0,
          dueDate: body.dueDate,
          productionNotes: body.productionNotes,
          jobs: emptyJobs(),
        }
        db.orders.unshift(order)
        writeDb(db)
        return send(res, 201, order)
      }

      const patchMatch = url.match(/^\/api\/workshop\/orders\/([^/?]+)/)
      if (req.method === 'PATCH' && patchMatch) {
        const id = decodeURIComponent(patchMatch[1])
        const body = (await readBody(req)) as Partial<WorkshopOrder>
        const db = readDb()
        const idx = db.orders.findIndex((o) => o.id === id)
        if (idx < 0) return send(res, 404, { error: 'Order not found' })
        const prev = db.orders[idx]
        const next = {
          ...prev,
          ...body,
          id: prev.id,
          orderNo: prev.orderNo,
          createdAt: prev.createdAt,
          updatedAt: new Date().toISOString(),
          jobs: body.jobs || prev.jobs || emptyJobs(),
        }
        db.orders[idx] = next
        writeDb(db)
        return send(res, 200, next)
      }

      if (req.method === 'POST' && url === '/api/workshop/jobs') {
        const body = (await readBody(req)) as {
          orderId: string
          departmentId: DepartmentId
          status: JobStatus
          note?: string
          assignee?: string
        }
        const db = readDb()
        const order = db.orders.find((o) => o.id === body.orderId)
        if (!order) return send(res, 404, { error: 'Order not found' })
        if (!order.jobs) order.jobs = emptyJobs()
        order.jobs[body.departmentId] = body.status
        order.updatedAt = new Date().toISOString()

        // Auto-advance order status when production starts / QC / packing
        if (body.status === 'in_progress' && order.status === 'confirmed') {
          order.status = 'in_production'
        }
        if (body.departmentId === 'qc' && body.status === 'done') {
          order.status = 'ready'
        }
        if (body.departmentId === 'dispatch' && body.status === 'done') {
          order.status = 'dispatched'
          order.dispatchedAt = order.dispatchedAt || new Date().toISOString()
        }

        const report: DepartmentReport = {
          id: crypto.randomUUID(),
          departmentId: body.departmentId,
          orderId: body.orderId,
          status: body.status,
          assignee: body.assignee,
          note: body.note || '',
          at: new Date().toISOString(),
        }
        db.reports.unshift(report)
        db.reports = db.reports.slice(0, 500)
        writeDb(db)
        return send(res, 200, { order, report })
      }

      if (req.method === 'POST' && url === '/api/workshop/partners') {
        const body = (await readBody(req)) as Partner
        const db = readDb()
        const idx = db.partners.findIndex((p) => p.id === body.id)
        if (idx >= 0) db.partners[idx] = body
        else db.partners.push(body)
        writeDb(db)
        return send(res, 200, body)
      }

      if (req.method === 'POST' && url === '/api/workshop/client/login') {
        const body = (await readBody(req)) as { loginId?: string; pin?: string }
        const db = readDb()
        const client = findClient(db, body.loginId || '', body.pin || '')
        if (!client) return send(res, 401, { error: 'Invalid login ID or PIN' })
        return send(res, 200, {
          client: {
            loginId: client.loginId,
            name: client.name,
            phone: client.phone,
          },
          orders: ordersForClient(db, client),
        })
      }

      if (req.method === 'POST' && url === '/api/workshop/client/orders') {
        const body = (await readBody(req)) as { loginId?: string; pin?: string }
        const db = readDb()
        const client = findClient(db, body.loginId || '', body.pin || '')
        if (!client) return send(res, 401, { error: 'Invalid login ID or PIN' })
        return send(res, 200, { orders: ordersForClient(db, client) })
      }

      return send(res, 404, { error: 'Not found' })
    } catch (e) {
      return send(res, 500, {
        error: e instanceof Error ? e.message : 'Workshop API error',
      })
    }
  }
}

export function workshopApiPlugin(): Plugin {
  return {
    name: 'priyabadal-workshop-api',
    configureServer(server) {
      server.middlewares.use(workshopMiddleware())
    },
    configurePreviewServer(server) {
      server.middlewares.use(workshopMiddleware())
    },
  }
}
