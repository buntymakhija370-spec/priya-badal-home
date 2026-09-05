/**
 * Secure workshop data store (local Node / Vite preview).
 * - Staff + client session tokens (Bearer)
 * - PINs stored as salted SHA-256 hashes (never returned to browser)
 * - Clients only receive their own orders
 */

import fs from 'node:fs'
import path from 'node:path'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export type JobStatus = 'queued' | 'assigned' | 'in_progress' | 'done' | 'blocked'
export type DepartmentId =
  | 'cutting'
  | 'cnc'
  | 'carcass'
  | 'finishing'
  | 'hardware'
  | 'qc'
  | 'packing'
  | 'dispatch'

export type OrderLine = {
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

export type WorkshopOrder = {
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

export type Partner = {
  id: string
  name: string
  phone: string
  city: string
  active: boolean
  notes?: string
}

export type DepartmentReport = {
  id: string
  departmentId: DepartmentId
  orderId: string
  status: JobStatus
  assignee?: string
  note: string
  at: string
}

export type ClientAccount = {
  id: string
  loginId: string
  pinHash: string
  pinSalt: string
  name: string
  phone: string
  active: boolean
}

export type SessionRecord = {
  token: string
  role: 'staff' | 'client'
  clientId?: string
  createdAt: string
  expiresAt: string
}

export type CutBoardLine = {
  lengthMm: number
  widthMm: number
  thicknessMm: number
  quantity: number
  face: 'inner' | 'outer' | 'both' | 'plain'
  materialCode: string
  raw: string
}

export type CutRecord = {
  id: string
  jobName: string
  materialText: string
  sawWidthMm: number
  utilizationPercent: number
  notes?: string
  orderNo?: string
  customerName?: string
  createdAt: string
  updatedAt: string
  boards: CutBoardLine[]
  totals: {
    totalSheets: number
    byFace: Record<'inner' | 'outer' | 'both' | 'plain', number>
    byThickness: Record<string, number>
    byMaterial: Record<string, number>
    areaSqft: number
  }
}

export type ProjectInventory = {
  plywoodByThickness: Record<string, number>
  innerByCode: Record<string, number>
  outerByCode: Record<string, number>
  bothByCode: Record<string, number>
  plainSheets: number
  totalSheets: number
  totalAreaSqft: number
}

export type DailyCutUpdate = {
  id: string
  date: string
  postedAt: string
  postedBy?: string
  materialText: string
  sawWidthMm: number
  utilizationPercent: number
  notes?: string
  boards: CutBoardLine[]
  totals: CutRecord['totals']
}

export type WorkshopProject = {
  id: string
  name: string
  clientName: string
  orderNo?: string
  status: 'open' | 'in_progress' | 'completed' | 'on_hold'
  createdAt: string
  updatedAt: string
  notes?: string
  inventory: ProjectInventory
  dailyUpdates: DailyCutUpdate[]
}

export type WorkshopDb = {
  version: 2
  partners: Partner[]
  clients: ClientAccount[]
  orders: WorkshopOrder[]
  reports: DepartmentReport[]
  sessions: SessionRecord[]
  cutRecords: CutRecord[]
  projects: WorkshopProject[]
  nextOrderSeq: number
  staff: {
    pinHash: string
    pinSalt: string
  }
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 12 // 12 hours
const DEFAULT_STAFF_PIN = process.env.WORKSHOP_STAFF_PIN || '2468'

export function emptyJobs(): Record<string, JobStatus> {
  return {
    cutting: 'queued',
    cnc: 'queued',
    carcass: 'queued',
    finishing: 'queued',
    hardware: 'queued',
    qc: 'queued',
    packing: 'queued',
    dispatch: 'queued',
  }
}

export function dbPath() {
  return path.resolve(process.cwd(), 'data/workshop-db.json')
}

export function seedPath() {
  return path.resolve(process.cwd(), 'data/workshop-seed.json')
}

function hashPin(pin: string, salt: string) {
  return createHash('sha256').update(`${salt}:${pin}`).digest('hex')
}

function newSalt() {
  return randomBytes(16).toString('hex')
}

function newToken() {
  return `tok_${randomBytes(24).toString('hex')}`
}

function safeEqualHex(a: string, b: string) {
  try {
    const ba = Buffer.from(a, 'hex')
    const bb = Buffer.from(b, 'hex')
    if (ba.length !== bb.length) return false
    return timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

function normalizePhone(phone: string) {
  return String(phone || '').replace(/\D/g, '').slice(-10)
}

function makeStaff(pin = DEFAULT_STAFF_PIN) {
  const pinSalt = newSalt()
  return { pinSalt, pinHash: hashPin(pin, pinSalt) }
}

function migrateClient(raw: Record<string, unknown>): ClientAccount | null {
  const loginId = String(raw.loginId || '').trim()
  if (!loginId) return null
  if (raw.pinHash && raw.pinSalt) {
    return {
      id: String(raw.id || `cli_${loginId.toLowerCase()}`),
      loginId,
      pinHash: String(raw.pinHash),
      pinSalt: String(raw.pinSalt),
      name: String(raw.name || loginId),
      phone: String(raw.phone || ''),
      active: raw.active !== false,
    }
  }
  const pin = String(raw.pin || '1234')
  const pinSalt = newSalt()
  return {
    id: String(raw.id || `cli_${loginId.toLowerCase()}`),
    loginId,
    pinSalt,
    pinHash: hashPin(pin, pinSalt),
    name: String(raw.name || loginId),
    phone: String(raw.phone || ''),
    active: raw.active !== false,
  }
}

function defaultSeed(): WorkshopDb {
  const demoSalt = newSalt()
  const badalSalt = newSalt()
  return {
    version: 2,
    partners: [
      {
        id: 'partner-indore-01',
        name: 'Indore Homes Partner',
        phone: '919876543210',
        city: 'Indore',
        active: true,
        notes: 'Sample channel partner',
      },
    ],
    clients: [
      {
        id: 'cli_demo',
        loginId: 'DEMO01',
        pinSalt: demoSalt,
        pinHash: hashPin('1234', demoSalt),
        name: 'Riya Sharma',
        phone: '9876543210',
        active: true,
      },
      {
        id: 'cli_badal',
        loginId: 'BADAL01',
        pinSalt: badalSalt,
        pinHash: hashPin('2468', badalSalt),
        name: 'Badal',
        phone: '8109949649',
        active: true,
      },
    ],
    orders: [
      {
        id: 'ord_1002',
        orderNo: 'PBH-1002',
        createdAt: '2026-09-04T10:00:00.000Z',
        updatedAt: '2026-09-04T18:30:00.000Z',
        source: 'website',
        status: 'in_production',
        customerName: 'Riya Sharma',
        customerPhone: '9876543210',
        customerCity: 'Bhopal',
        lines: [
          {
            id: 'line-demo-1',
            productName: 'Taupe Reeded Shaker Kitchen',
            sku: 'PBH-KIT-01',
            category: 'Kitchen',
            qty: 1,
            unitPrice: 185000,
            notes: 'Island + tall units',
          },
          {
            id: 'line-demo-2',
            productName: 'Wave Leather Shutters',
            sku: 'PBH-LEENA-WAVE',
            category: 'Leather Shutters',
            qty: 4,
            unitPrice: 12000,
            finish: '25mm calibrated ply',
          },
        ],
        advancePaid: 80000,
        totalAmount: 233000,
        dueDate: '2026-09-20',
        productionNotes: 'Demo client order for live tracking',
        jobs: {
          cutting: 'done',
          cnc: 'done',
          carcass: 'done',
          finishing: 'in_progress',
          hardware: 'queued',
          qc: 'queued',
          packing: 'queued',
          dispatch: 'queued',
        },
      },
      {
        id: 'ord_1001',
        orderNo: 'PBH-1001',
        createdAt: '2026-09-04T20:37:43.648Z',
        updatedAt: '2026-09-04T20:38:03.814Z',
        source: 'whatsapp',
        status: 'in_production',
        customerName: 'Badal',
        customerPhone: '8109949649',
        customerCity: 'Indore',
        lines: [
          {
            id: 'b32fe200-197b-4812-9b55-f0e1cf625f88',
            productName: 'Blue sheet',
            sku: '2',
            category: '',
            qty: 6,
            unitPrice: 10000,
            notes: '',
          },
        ],
        advancePaid: 20000,
        totalAmount: 60000,
        jobs: {
          cutting: 'queued',
          cnc: 'in_progress',
          carcass: 'in_progress',
          finishing: 'queued',
          hardware: 'queued',
          qc: 'queued',
          packing: 'queued',
          dispatch: 'queued',
        },
      },
    ],
    reports: [],
    sessions: [],
    cutRecords: [],
    projects: [],
    nextOrderSeq: 1003,
    staff: makeStaff(),
  }
}

function publicDbView(db: WorkshopDb) {
  return {
    version: db.version,
    partners: db.partners,
    orders: db.orders,
    reports: db.reports,
    cutRecords: db.cutRecords || [],
    projects: db.projects || [],
    nextOrderSeq: db.nextOrderSeq,
    clients: db.clients.map((c) => ({
      id: c.id,
      loginId: c.loginId,
      name: c.name,
      phone: c.phone,
      active: c.active,
    })),
  }
}

export function readDb(): WorkshopDb {
  const file = dbPath()
  if (!fs.existsSync(file)) {
    const seedFile = seedPath()
    const seed = fs.existsSync(seedFile)
      ? (JSON.parse(fs.readFileSync(seedFile, 'utf8')) as Record<string, unknown>)
      : null
    const db = seed ? migrateDb(seed) : defaultSeed()
    writeDb(db)
    return db
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>
  const db = migrateDb(raw)
  // Persist migration (hash plaintext pins, add staff/sessions)
  writeDb(db)
  return db
}

function migrateDb(raw: Record<string, unknown>): WorkshopDb {
  const clientsRaw = Array.isArray(raw.clients) ? raw.clients : []
  const clients = clientsRaw
    .map((c) => migrateClient(c as Record<string, unknown>))
    .filter((c): c is ClientAccount => Boolean(c))

  let staff = raw.staff as WorkshopDb['staff'] | undefined
  if (!staff?.pinHash || !staff?.pinSalt) {
    staff = makeStaff()
  }

  return {
    version: 2,
    partners: (raw.partners as Partner[]) || [],
    clients: clients.length ? clients : defaultSeed().clients,
    orders: (raw.orders as WorkshopOrder[]) || [],
    reports: (raw.reports as DepartmentReport[]) || [],
    sessions: Array.isArray(raw.sessions) ? (raw.sessions as SessionRecord[]) : [],
    cutRecords: Array.isArray(raw.cutRecords) ? (raw.cutRecords as CutRecord[]) : [],
    projects: Array.isArray(raw.projects) ? (raw.projects as WorkshopProject[]) : [],
    nextOrderSeq: Number(raw.nextOrderSeq || 1001),
    staff,
  }
}

export function writeDb(db: WorkshopDb) {
  // prune expired sessions
  const now = Date.now()
  db.sessions = (db.sessions || []).filter((s) => new Date(s.expiresAt).getTime() > now)
  fs.mkdirSync(path.dirname(dbPath()), { recursive: true })
  fs.writeFileSync(dbPath(), JSON.stringify(db, null, 2))
}

export function createSession(db: WorkshopDb, role: 'staff' | 'client', clientId?: string) {
  const token = newToken()
  const now = Date.now()
  const session: SessionRecord = {
    token,
    role,
    clientId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
  }
  db.sessions = [session, ...(db.sessions || [])].slice(0, 500)
  writeDb(db)
  return session
}

export function getSession(db: WorkshopDb, authHeader?: string | null) {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) return null
  const session = (db.sessions || []).find((s) => s.token === token)
  if (!session) return null
  if (new Date(session.expiresAt).getTime() <= Date.now()) return null
  return session
}

export function requireStaff(db: WorkshopDb, authHeader?: string | null) {
  const session = getSession(db, authHeader)
  if (!session || session.role !== 'staff') return null
  return session
}

export function requireClient(db: WorkshopDb, authHeader?: string | null) {
  const session = getSession(db, authHeader)
  if (!session || session.role !== 'client' || !session.clientId) return null
  const client = db.clients.find((c) => c.id === session.clientId && c.active !== false)
  if (!client) return null
  return { session, client }
}

export function verifyStaffPin(db: WorkshopDb, pin: string) {
  return safeEqualHex(hashPin(pin, db.staff.pinSalt), db.staff.pinHash)
}

export function verifyClientPin(client: ClientAccount, pin: string) {
  return safeEqualHex(hashPin(pin, client.pinSalt), client.pinHash)
}

export function findClientByLogin(db: WorkshopDb, loginId: string) {
  const id = loginId.trim().toUpperCase()
  return db.clients.find((c) => c.active !== false && c.loginId.toUpperCase() === id)
}

export function ordersForClient(db: WorkshopDb, client: ClientAccount) {
  const phone = normalizePhone(client.phone)
  return db.orders.filter((o) => normalizePhone(o.customerPhone) === phone)
}

export function clientPublic(client: ClientAccount) {
  return {
    loginId: client.loginId,
    name: client.name,
    phone: client.phone,
  }
}

export { publicDbView, hashPin, newSalt, makeStaff, DEFAULT_STAFF_PIN }
