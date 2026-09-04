import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'
import {
  createSession,
  emptyJobs,
  findClientByLogin,
  ordersForClient,
  publicDbView,
  readDb,
  requireClient,
  requireStaff,
  type DepartmentId,
  type DepartmentReport,
  type JobStatus,
  type OrderLine,
  type Partner,
  type WorkshopOrder,
  verifyClientPin,
  verifyStaffPin,
  writeDb,
  clientPublic,
} from './workshopStore.ts'

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
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(data))
}

function authHeader(req: IncomingMessage) {
  const h = req.headers.authorization
  return Array.isArray(h) ? h[0] : h
}

function workshopMiddleware(): Connect.NextHandleFunction {
  return async (req: IncomingMessage, res: ServerResponse, next) => {
    const url = req.url || ''
    if (!url.startsWith('/api/workshop')) return next()

    try {
      // --- Auth (public) ---
      if (req.method === 'POST' && url === '/api/workshop/staff/login') {
        const body = (await readBody(req)) as { pin?: string }
        const db = readDb()
        if (!verifyStaffPin(db, String(body.pin || ''))) {
          return send(res, 401, { error: 'Invalid staff PIN' })
        }
        const session = createSession(db, 'staff')
        return send(res, 200, {
          token: session.token,
          role: 'staff',
          expiresAt: session.expiresAt,
        })
      }

      if (req.method === 'POST' && url === '/api/workshop/client/login') {
        const body = (await readBody(req)) as { loginId?: string; pin?: string }
        const db = readDb()
        const client = findClientByLogin(db, body.loginId || '')
        if (!client || !verifyClientPin(client, String(body.pin || ''))) {
          return send(res, 401, { error: 'Invalid login ID or PIN' })
        }
        const session = createSession(db, 'client', client.id)
        return send(res, 200, {
          token: session.token,
          role: 'client',
          expiresAt: session.expiresAt,
          client: clientPublic(client),
          orders: ordersForClient(db, client),
        })
      }

      if (req.method === 'POST' && url === '/api/workshop/logout') {
        const db = readDb()
        const header = authHeader(req)
        if (header?.startsWith('Bearer ')) {
          const token = header.slice(7).trim()
          db.sessions = (db.sessions || []).filter((s) => s.token !== token)
          writeDb(db)
        }
        return send(res, 200, { ok: true })
      }

      // --- Client (token) ---
      if (req.method === 'GET' && (url === '/api/workshop/client/orders' || url.startsWith('/api/workshop/client/orders?'))) {
        const db = readDb()
        const auth = requireClient(db, authHeader(req))
        if (!auth) return send(res, 401, { error: 'Client login required' })
        return send(res, 200, {
          client: clientPublic(auth.client),
          orders: ordersForClient(db, auth.client),
        })
      }

      // Legacy POST client/orders still accepted only with Bearer token (pin ignored)
      if (req.method === 'POST' && url === '/api/workshop/client/orders') {
        const db = readDb()
        const auth = requireClient(db, authHeader(req))
        if (!auth) return send(res, 401, { error: 'Client login required' })
        return send(res, 200, { orders: ordersForClient(db, auth.client) })
      }

      // --- Staff-only from here ---
      if (req.method === 'GET' && (url === '/api/workshop' || url.startsWith('/api/workshop?'))) {
        const db = readDb()
        if (!requireStaff(db, authHeader(req))) {
          return send(res, 401, { error: 'Staff login required' })
        }
        return send(res, 200, publicDbView(db))
      }

      if (req.method === 'PUT' && url === '/api/workshop') {
        return send(res, 403, {
          error: 'Full DB overwrite disabled. Use order/job/partner endpoints.',
        })
      }

      if (req.method === 'POST' && url === '/api/workshop/orders') {
        const db = readDb()
        if (!requireStaff(db, authHeader(req))) {
          return send(res, 401, { error: 'Staff login required' })
        }
        const body = (await readBody(req)) as Partial<WorkshopOrder> & {
          lines: Omit<OrderLine, 'id'>[]
        }
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
        const db = readDb()
        if (!requireStaff(db, authHeader(req))) {
          return send(res, 401, { error: 'Staff login required' })
        }
        const id = decodeURIComponent(patchMatch[1])
        const body = (await readBody(req)) as Partial<WorkshopOrder>
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
        const db = readDb()
        if (!requireStaff(db, authHeader(req))) {
          return send(res, 401, { error: 'Staff login required' })
        }
        const body = (await readBody(req)) as {
          orderId: string
          departmentId: DepartmentId
          status: JobStatus
          note?: string
          assignee?: string
        }
        const order = db.orders.find((o) => o.id === body.orderId)
        if (!order) return send(res, 404, { error: 'Order not found' })
        if (!order.jobs) order.jobs = emptyJobs()
        order.jobs[body.departmentId] = body.status
        order.updatedAt = new Date().toISOString()

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
        const db = readDb()
        if (!requireStaff(db, authHeader(req))) {
          return send(res, 401, { error: 'Staff login required' })
        }
        const body = (await readBody(req)) as Partner
        const idx = db.partners.findIndex((p) => p.id === body.id)
        if (idx >= 0) db.partners[idx] = body
        else db.partners.push(body)
        writeDb(db)
        return send(res, 200, body)
      }

      // Block old unauthenticated client login pin-replay path was replaced above
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
