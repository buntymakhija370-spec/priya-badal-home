/** Priyabadal Homes — Workshop Operations data model */

export type OrderSource = 'website' | 'whatsapp' | 'offline' | 'channel_partner'

export type OrderStatus =
  | 'enquiry'
  | 'confirmed'
  | 'in_production'
  | 'qc'
  | 'ready'
  | 'dispatched'
  | 'delivered'
  | 'cancelled'

/** Workshop production pipeline (order job sheet flow) */
export type DepartmentId =
  | 'review'
  | 'design'
  | 'cutting'
  | 'phase2_finishing'
  | 'qc'
  | 'dispatch'
  | 'transport'

export type JobStatus = 'queued' | 'assigned' | 'in_progress' | 'done' | 'blocked'

export type StageChecklist = Record<string, boolean>

export type TransportDetails = {
  vehicleNo?: string
  driverName?: string
  driverPhone?: string
  lrNo?: string
  handoverAt?: string
  receivedBy?: string
  notes?: string
}

export type Partner = {
  id: string
  name: string
  phone: string
  city: string
  active: boolean
  notes?: string
}

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

export type DepartmentReport = {
  id: string
  departmentId: DepartmentId
  orderId: string
  status: JobStatus
  assignee?: string
  note: string
  at: string
}

export type WorkshopOrder = {
  id: string
  orderNo: string
  createdAt: string
  updatedAt: string
  source: OrderSource
  status: OrderStatus
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
  /** Department job board for this order */
  jobs: Record<DepartmentId, JobStatus>
  /** Tick lists per department (designing / cutting / phase2 / etc.) */
  checklists?: Partial<Record<DepartmentId, StageChecklist>>
  /** Transport handover after dispatch */
  transport?: TransportDetails
}

export type WorkshopDb = {
  version: 1 | 2
  partners: Partner[]
  orders: WorkshopOrder[]
  reports: DepartmentReport[]
  nextOrderSeq: number
  cutRecords?: CutRecord[]
  projects?: WorkshopProject[]
  clients?: Array<{
    id: string
    loginId: string
    name: string
    phone: string
    active: boolean
  }>
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
  boards: Array<{
    lengthMm: number
    widthMm: number
    thicknessMm: number
    quantity: number
    face: 'inner' | 'outer' | 'both' | 'plain'
    materialCode: string
    raw: string
  }>
  totals: {
    totalSheets: number
    byFace: Record<'inner' | 'outer' | 'both' | 'plain', number>
    byThickness: Record<string, number>
    byMaterial: Record<string, number>
    areaSqft: number
  }
}


export type ProductionStageId = 'cutting' | 'cnc' | 'paint' | 'dispatch' | 'accounts'
export type ProductionStageStatus = 'pending' | 'in_progress' | 'done'

export const PRODUCTION_STAGES: { id: ProductionStageId; label: string }[] = [
  { id: 'cutting', label: 'Cutting' },
  { id: 'cnc', label: 'CNC' },
  { id: 'paint', label: 'Paint booth' },
  { id: 'dispatch', label: 'Dispatch' },
  { id: 'accounts', label: 'Accounts' },
]

export function emptyProduction(): Record<ProductionStageId, ProductionStageStatus> {
  return {
    cutting: 'pending',
    cnc: 'pending',
    paint: 'pending',
    dispatch: 'pending',
    accounts: 'pending',
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
  boards: CutRecord['boards']
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
  production: Record<ProductionStageId, ProductionStageStatus>
}

export const DEPARTMENTS: {
  id: DepartmentId
  name: string
  short: string
}[] = [
  { id: 'review', name: 'Review — Priya & Badal', short: 'Review' },
  { id: 'design', name: 'Designing', short: 'Design' },
  { id: 'cutting', name: 'Cutting', short: 'Cut' },
  { id: 'phase2_finishing', name: 'Phase 2 — Finishing', short: 'Phase 2' },
  { id: 'qc', name: 'QC — Quality Check', short: 'QC' },
  { id: 'dispatch', name: 'Dispatch', short: 'Dispatch' },
  { id: 'transport', name: 'Transport & handover', short: 'Transport' },
]

export const ORDER_STATUSES: { id: OrderStatus; label: string }[] = [
  { id: 'enquiry', label: 'Enquiry' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'in_production', label: 'In production' },
  { id: 'qc', label: 'QC' },
  { id: 'ready', label: 'Ready' },
  { id: 'dispatched', label: 'Dispatched' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
]

export const ORDER_SOURCES: { id: OrderSource; label: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'offline', label: 'Offline / Showroom' },
  { id: 'website', label: 'Website / App' },
  { id: 'channel_partner', label: 'Channel partner' },
]

export function emptyJobs(): Record<DepartmentId, JobStatus> {
  return {
    review: 'queued',
    design: 'queued',
    cutting: 'queued',
    phase2_finishing: 'queued',
    qc: 'queued',
    dispatch: 'queued',
    transport: 'queued',
  }
}

export function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}
