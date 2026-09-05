/**
 * Project inventory helpers — aggregate plywood / laminate usage
 * from daily cutting-software pastes.
 */

import type { BoardLine } from './cutRecordParser'
import { parseMaterialRequisition, computeCutTotals } from './cutRecordParser'

export type InventoryBucket = Record<string, number>

export type ProjectInventory = {
  plywoodByThickness: InventoryBucket
  innerByCode: InventoryBucket
  outerByCode: InventoryBucket
  bothByCode: InventoryBucket
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
  boards: BoardLine[]
  totals: {
    totalSheets: number
    byFace: Record<'inner' | 'outer' | 'both' | 'plain', number>
    byThickness: Record<string, number>
    byMaterial: Record<string, number>
    areaSqft: number
  }
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

export function emptyInventory(): ProjectInventory {
  return {
    plywoodByThickness: {},
    innerByCode: {},
    outerByCode: {},
    bothByCode: {},
    plainSheets: 0,
    totalSheets: 0,
    totalAreaSqft: 0,
  }
}

function addBucket(bucket: InventoryBucket, key: string, qty: number) {
  const k = key.trim() || '—'
  bucket[k] = (bucket[k] || 0) + qty
}

export function inventoryFromBoards(boards: BoardLine[]): ProjectInventory {
  const inv = emptyInventory()
  for (const b of boards) {
    addBucket(inv.plywoodByThickness, `${b.thicknessMm}mm`, b.quantity)
    inv.totalSheets += b.quantity
    inv.totalAreaSqft += (b.lengthMm * b.widthMm * b.quantity) / 92903.04
    const code = b.materialCode || '—'
    if (b.face === 'inner') addBucket(inv.innerByCode, code, b.quantity)
    else if (b.face === 'outer') addBucket(inv.outerByCode, code, b.quantity)
    else if (b.face === 'both') addBucket(inv.bothByCode, code, b.quantity)
    else inv.plainSheets += b.quantity
  }
  inv.totalAreaSqft = Math.round(inv.totalAreaSqft * 100) / 100
  return inv
}

export function mergeInventory(a: ProjectInventory, b: ProjectInventory): ProjectInventory {
  const out = emptyInventory()
  out.plainSheets = a.plainSheets + b.plainSheets
  out.totalSheets = a.totalSheets + b.totalSheets
  out.totalAreaSqft = Math.round((a.totalAreaSqft + b.totalAreaSqft) * 100) / 100
  for (const src of [a, b]) {
    for (const [k, v] of Object.entries(src.plywoodByThickness)) addBucket(out.plywoodByThickness, k, v)
    for (const [k, v] of Object.entries(src.innerByCode)) addBucket(out.innerByCode, k, v)
    for (const [k, v] of Object.entries(src.outerByCode)) addBucket(out.outerByCode, k, v)
    for (const [k, v] of Object.entries(src.bothByCode)) addBucket(out.bothByCode, k, v)
  }
  return out
}

export function rebuildProjectInventory(updates: DailyCutUpdate[]): ProjectInventory {
  return updates.reduce((acc, u) => mergeInventory(acc, inventoryFromBoards(u.boards)), emptyInventory())
}

export function makeDailyUpdate(input: {
  materialText: string
  sawWidthMm: number
  utilizationPercent: number
  notes?: string
  postedBy?: string
  date?: string
}): DailyCutUpdate {
  const boards = parseMaterialRequisition(input.materialText)
  const totals = computeCutTotals(boards)
  const now = new Date()
  return {
    id: `upd_${now.getTime().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    date: input.date || now.toISOString().slice(0, 10),
    postedAt: now.toISOString(),
    postedBy: input.postedBy || 'Operator',
    materialText: input.materialText,
    sawWidthMm: input.sawWidthMm,
    utilizationPercent: input.utilizationPercent,
    notes: input.notes,
    boards,
    totals,
  }
}

export function inventoryWhatsAppText(project: WorkshopProject) {
  const inv = project.inventory
  return [
    '*Priyabadal · Project inventory*',
    `Project: ${project.name}`,
    project.clientName ? `Client: ${project.clientName}` : null,
    project.orderNo ? `Order: ${project.orderNo}` : null,
    `Status: ${project.status}`,
    `Total sheets: ${inv.totalSheets} · Area ~ ${inv.totalAreaSqft} sqft`,
    `Daily posts: ${project.dailyUpdates.length}`,
    '',
    '*Plywood by thickness*',
    ...Object.entries(inv.plywoodByThickness).map(([k, v]) => `• ${k}: ${v} sheets`),
    '',
    '*Inner laminate*',
    ...Object.entries(inv.innerByCode).map(([k, v]) => `• ${k}: ${v}`),
    '',
    '*Outer laminate*',
    ...Object.entries(inv.outerByCode).map(([k, v]) => `• ${k}: ${v}`),
    '',
    '*Both-side laminate*',
    ...Object.entries(inv.bothByCode).map(([k, v]) => `• ${k}: ${v}`),
    inv.plainSheets ? `• Plain/other: ${inv.plainSheets}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}
