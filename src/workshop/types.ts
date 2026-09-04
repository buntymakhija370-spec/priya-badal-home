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

export type DepartmentId =
  | 'cutting'
  | 'cnc'
  | 'carcass'
  | 'finishing'
  | 'hardware'
  | 'qc'
  | 'packing'
  | 'dispatch'

export type JobStatus = 'queued' | 'assigned' | 'in_progress' | 'done' | 'blocked'

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
}

export type WorkshopDb = {
  version: 1 | 2
  partners: Partner[]
  orders: WorkshopOrder[]
  reports: DepartmentReport[]
  nextOrderSeq: number
  clients?: Array<{
    id: string
    loginId: string
    name: string
    phone: string
    active: boolean
  }>
}

export const DEPARTMENTS: {
  id: DepartmentId
  name: string
  short: string
}[] = [
  { id: 'cutting', name: 'Cutting / Board', short: 'Cut' },
  { id: 'cnc', name: 'CNC / Carve', short: 'CNC' },
  { id: 'carcass', name: 'Carcass Assembly', short: 'Carcass' },
  { id: 'finishing', name: 'Shutter / Finish', short: 'Finish' },
  { id: 'hardware', name: 'Hardware Fitting', short: 'Hardware' },
  { id: 'qc', name: 'Quality Check', short: 'QC' },
  { id: 'packing', name: 'Packing', short: 'Pack' },
  { id: 'dispatch', name: 'Dispatch', short: 'Dispatch' },
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

export function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}
