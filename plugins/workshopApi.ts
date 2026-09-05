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
  type CutRecord,
  type DailyCutUpdate,
  type DepartmentId,
  type DepartmentReport,
  type JobStatus,
  type OrderLine,
  type Partner,
  type WorkshopOrder,
  type WorkshopProject,
  verifyClientPin,
  verifyStaffPin,
  writeDb,
  clientPublic,
} from './workshopStore.ts'

function emptyInv() {
  return {
    plywoodByThickness: {} as Record<string, number>,
    innerByCode: {} as Record<string, number>,
    outerByCode: {} as Record<string, number>,
    bothByCode: {} as Record<string, number>,
    plainSheets: 0,
    totalSheets: 0,
    totalAreaSqft: 0,
  }
}

function rebuildInventoryFromUpdates(updates: DailyCutUpdate[]) {
  const inv = emptyInv()
  for (const u of updates) {
    for (const b of u.boards || []) {
      const th = `${b.thicknessMm}mm`
      inv.plywoodByThickness[th] = (inv.plywoodByThickness[th] || 0) + b.quantity
      inv.totalSheets += b.quantity
      inv.totalAreaSqft += (b.lengthMm * b.widthMm * b.quantity) / 92903.04
      const code = b.materialCode || '—'
      if (b.face === 'inner') inv.innerByCode[code] = (inv.innerByCode[code] || 0) + b.quantity
      else if (b.face === 'outer') inv.outerByCode[code] = (inv.outerByCode[code] || 0) + b.quantity
      else if (b.face === 'both') inv.bothByCode[code] = (inv.bothByCode[code] || 0) + b.quantity
      else inv.plainSheets += b.quantity
    }
  }
  inv.totalAreaSqft = Math.round(inv.totalAreaSqft * 100) / 100
  return inv
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

      if (req.method === 'GET' && (url === '/api/workshop/cut-records' || url.startsWith('/api/workshop/cut-records?'))) {
        const db = readDb()
        if (!requireStaff(db, authHeader(req))) {
          return send(res, 401, { error: 'Staff login required' })
        }
        return send(res, 200, { cutRecords: db.cutRecords || [] })
      }

      if (req.method === 'POST' && url === '/api/workshop/cut-records') {
        const db = readDb()
        if (!requireStaff(db, authHeader(req))) {
          return send(res, 401, { error: 'Staff login required' })
        }
        const body = (await readBody(req)) as {
          jobName?: string
          materialText?: string
          sawWidthMm?: number
          utilizationPercent?: number
          notes?: string
          orderNo?: string
          customerName?: string
          boards?: CutRecord['boards']
          totals?: CutRecord['totals']
        }
        const now = new Date().toISOString()
        const record: CutRecord = {
          id: `cut_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
          jobName: body.jobName || 'Cut job',
          materialText: body.materialText || '',
          sawWidthMm: Number(body.sawWidthMm) || 0,
          utilizationPercent: Number(body.utilizationPercent) || 0,
          notes: body.notes,
          orderNo: body.orderNo,
          customerName: body.customerName,
          createdAt: now,
          updatedAt: now,
          boards: body.boards || [],
          totals: body.totals || {
            totalSheets: 0,
            byFace: { inner: 0, outer: 0, both: 0, plain: 0 },
            byThickness: {},
            byMaterial: {},
            areaSqft: 0,
          },
        }
        if (!db.cutRecords) db.cutRecords = []
        db.cutRecords.unshift(record)
        writeDb(db)
        return send(res, 201, record)
      }

      const cutDelete = url.match(/^\/api\/workshop\/cut-records\/([^/?]+)/)
      if (req.method === 'DELETE' && cutDelete) {
        const db = readDb()
        if (!requireStaff(db, authHeader(req))) {
          return send(res, 401, { error: 'Staff login required' })
        }
        const id = decodeURIComponent(cutDelete[1])
        db.cutRecords = (db.cutRecords || []).filter((r) => r.id !== id)
        writeDb(db)
        return send(res, 200, { ok: true })
      }

      // --- Projects (daily cutting + inventory) ---
      if (req.method === 'GET' && (url === '/api/workshop/projects' || url.startsWith('/api/workshop/projects?'))) {
        const db = readDb()
        if (!requireStaff(db, authHeader(req))) {
          return send(res, 401, { error: 'Staff login required' })
        }
        if (!db.projects) db.projects = []
        return send(res, 200, { projects: db.projects })
      }

      if (req.method === 'POST' && url === '/api/workshop/projects') {
        const db = readDb()
        if (!requireStaff(db, authHeader(req))) {
          return send(res, 401, { error: 'Staff login required' })
        }
        const body = (await readBody(req)) as {
          name?: string
          clientName?: string
          orderNo?: string
          notes?: string
        }
        const now = new Date().toISOString()
        const project: WorkshopProject = {
          id: `prj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          name: (body.name || 'New project').trim(),
          clientName: (body.clientName || '').trim(),
          orderNo: body.orderNo?.trim() || undefined,
          status: 'open',
          createdAt: now,
          updatedAt: now,
          notes: body.notes,
          inventory: {
            plywoodByThickness: {},
            innerByCode: {},
            outerByCode: {},
            bothByCode: {},
            plainSheets: 0,
            totalSheets: 0,
            totalAreaSqft: 0,
          },
          dailyUpdates: [],
        }
        if (!db.projects) db.projects = []
        db.projects.unshift(project)
        writeDb(db)
        return send(res, 201, project)
      }

      const projectMatch = url.match(/^\/api\/workshop\/projects\/([^/?]+)$/)
      if (req.method === 'GET' && projectMatch) {
        const db = readDb()
        if (!requireStaff(db, authHeader(req))) {
          return send(res, 401, { error: 'Staff login required' })
        }
        const id = decodeURIComponent(projectMatch[1])
        const project = (db.projects || []).find((p) => p.id === id)
        if (!project) return send(res, 404, { error: 'Project not found' })
        return send(res, 200, project)
      }

      if (req.method === 'PATCH' && projectMatch) {
        const db = readDb()
        if (!requireStaff(db, authHeader(req))) {
          return send(res, 401, { error: 'Staff login required' })
        }
        const id = decodeURIComponent(projectMatch[1])
        const idx = (db.projects || []).findIndex((p) => p.id === id)
        if (idx < 0) return send(res, 404, { error: 'Project not found' })
        const body = (await readBody(req)) as Partial<WorkshopProject>
        const prev = db.projects[idx]
        db.projects[idx] = {
          ...prev,
          name: body.name ?? prev.name,
          clientName: body.clientName ?? prev.clientName,
          orderNo: body.orderNo !== undefined ? body.orderNo : prev.orderNo,
          status: body.status ?? prev.status,
          notes: body.notes !== undefined ? body.notes : prev.notes,
          updatedAt: new Date().toISOString(),
          inventory: prev.inventory,
          dailyUpdates: prev.dailyUpdates,
        }
        writeDb(db)
        return send(res, 200, db.projects[idx])
      }

      if (req.method === 'DELETE' && projectMatch) {
        const db = readDb()
        if (!requireStaff(db, authHeader(req))) {
          return send(res, 401, { error: 'Staff login required' })
        }
        const id = decodeURIComponent(projectMatch[1])
        db.projects = (db.projects || []).filter((p) => p.id !== id)
        writeDb(db)
        return send(res, 200, { ok: true })
      }

      const projectUpdateMatch = url.match(/^\/api\/workshop\/projects\/([^/?]+)\/updates$/)
      if (req.method === 'POST' && projectUpdateMatch) {
        const db = readDb()
        if (!requireStaff(db, authHeader(req))) {
          return send(res, 401, { error: 'Staff login required' })
        }
        const id = decodeURIComponent(projectUpdateMatch[1])
        const idx = (db.projects || []).findIndex((p) => p.id === id)
        if (idx < 0) return send(res, 404, { error: 'Project not found' })
        const body = (await readBody(req)) as {
          materialText?: string
          sawWidthMm?: number
          utilizationPercent?: number
          notes?: string
          postedBy?: string
          date?: string
          boards?: DailyCutUpdate['boards']
          totals?: DailyCutUpdate['totals']
        }
        if (!body.materialText?.trim()) {
          return send(res, 400, { error: 'Paste cutting list material text' })
        }
        const now = new Date()
        const update: DailyCutUpdate = {
          id: `upd_${now.getTime().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          date: body.date || now.toISOString().slice(0, 10),
          postedAt: now.toISOString(),
          postedBy: body.postedBy || 'Operator',
          materialText: body.materialText,
          sawWidthMm: Number(body.sawWidthMm) || 0,
          utilizationPercent: Number(body.utilizationPercent) || 0,
          notes: body.notes,
          boards: body.boards || [],
          totals: body.totals || {
            totalSheets: 0,
            byFace: { inner: 0, outer: 0, both: 0, plain: 0 },
            byThickness: {},
            byMaterial: {},
            areaSqft: 0,
          },
        }
        const project = db.projects[idx]
        project.dailyUpdates = [update, ...(project.dailyUpdates || [])]
        project.inventory = rebuildInventoryFromUpdates(project.dailyUpdates)
        project.status = project.status === 'open' ? 'in_progress' : project.status
        project.updatedAt = now.toISOString()
        writeDb(db)
        return send(res, 201, { project, update })
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
