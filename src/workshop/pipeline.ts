/**
 * Priyabadal Homes — workshop production pipeline.
 * Order flow:
 * Review (Priya & Badal) → Design → Cutting → Phase 2 Finishing → QC → Dispatch → Transport
 */

import type { DepartmentId } from './types'

export type ChecklistItemDef = {
  id: string
  label: string
}

export type PipelineStageDef = {
  id: DepartmentId
  name: string
  short: string
  description: string
  checklist: ChecklistItemDef[]
}

/** Tick items each department must complete against the job sheet */
export const PIPELINE_STAGES: PipelineStageDef[] = [
  {
    id: 'review',
    name: 'Review — Priya & Badal',
    short: 'Review',
    description: 'Priya and Badal check the client order / job sheet and give OK before work starts.',
    checklist: [
      { id: 'client_details', label: 'Client name, phone & site details verified' },
      { id: 'product_list', label: 'Product / job sheet items checked' },
      { id: 'sizes_finish', label: 'Sizes, finish & laminate codes confirmed' },
      { id: 'priya_ok', label: 'Priya review OK' },
      { id: 'badal_ok', label: 'Badal review OK' },
      { id: 'photo_proof', label: 'Photo proof of reviewed job sheet / products posted' },
      { id: 'order_ok', label: 'Final OK — send to designing' },
    ],
  },
  {
    id: 'design',
    name: 'Designing',
    short: 'Design',
    description: 'Designer opens product details from the job sheet and ticks each design task done. Photo proof required before confirming.',
    checklist: [
      { id: 'read_job_sheet', label: 'Read full product / job sheet details' },
      { id: 'layout_drawing', label: 'Layout / drawing prepared' },
      { id: 'cut_list_ready', label: 'Cut list / nesting ready for cutting' },
      { id: 'edge_band_plan', label: 'Edge banding / laminate plan noted' },
      { id: 'hardware_plan', label: 'Hardware plan noted' },
      { id: 'photo_proof', label: 'Design photo proof posted (drawing / layout / product view)' },
      { id: 'design_signed', label: 'Design signed off for cutting' },
    ],
  },
  {
    id: 'cutting',
    name: 'Cutting',
    short: 'Cut',
    description: 'Cutting department works from the approved design / cut list. Must post cut-product photos before confirming.',
    checklist: [
      { id: 'boards_issued', label: 'Plywood / boards issued as per list' },
      { id: 'laminate_issued', label: 'Inner / outer laminate issued' },
      { id: 'cut_complete', label: 'All panels cut as per nesting' },
      { id: 'edge_banding', label: 'Edge banding done (if required here)' },
      { id: 'parts_labelled', label: 'Parts labelled for Phase 2' },
      { id: 'photo_proof', label: 'Cutting photo proof posted (cut panels / labelled parts)' },
      { id: 'cut_handover', label: 'Handover to Phase 2 finishing' },
    ],
  },
  {
    id: 'phase2_finishing',
    name: 'Phase 2 — Finishing / Paint Booth',
    short: 'Paint Booth',
    description: 'Finishing & paint booth — paint, polish, shutters, assembly. Product photos required before confirm.',
    checklist: [
      { id: 'carcass_assy', label: 'Carcass / box assembly done' },
      { id: 'shutter_fit', label: 'Shutters / doors fitted' },
      { id: 'surface_finish', label: 'Paint booth / polish / laminate finish done' },
      { id: 'hardware_fit', label: 'Hardware fitted (hinges, channels, handles)' },
      { id: 'glass_mirror', label: 'Glass / mirror / special finish (if any)' },
      { id: 'photo_proof', label: 'Paint booth / finishing photo proof posted' },
      { id: 'phase2_clean', label: 'Cleaned & ready for QC' },
    ],
  },
  {
    id: 'qc',
    name: 'QC — Quality Check',
    short: 'QC',
    description: 'Quality check against job sheet before dispatch. Photo proof of inspected product required.',
    checklist: [
      { id: 'size_check', label: 'Sizes match job sheet' },
      { id: 'finish_check', label: 'Finish / colour match approved' },
      { id: 'hardware_check', label: 'Hardware working & complete' },
      { id: 'damage_check', label: 'No damage / scratches' },
      { id: 'packing_check', label: 'Packed / protected for transport' },
      { id: 'photo_proof', label: 'QC photo proof posted (finished product)' },
      { id: 'qc_pass', label: 'QC PASS — release to dispatch' },
    ],
  },
  {
    id: 'dispatch',
    name: 'Dispatch',
    short: 'Dispatch',
    description: 'Prepare finished product for handover / loading. Loading photo proof required.',
    checklist: [
      { id: 'items_listed', label: 'Dispatch list vs job sheet matched' },
      { id: 'loaded', label: 'Loaded on vehicle' },
      { id: 'photo_proof', label: 'Dispatch / loading photo proof posted' },
      { id: 'docs_ready', label: 'Invoice / challan / papers ready' },
      { id: 'dispatch_ok', label: 'Dispatch cleared' },
    ],
  },
  {
    id: 'transport',
    name: 'Transport & handover',
    short: 'Transport',
    description: 'Transport details after finished product is handed over. Site / handover photo proof required.',
    checklist: [
      { id: 'vehicle_entered', label: 'Vehicle number entered' },
      { id: 'driver_entered', label: 'Driver name & phone entered' },
      { id: 'lr_entered', label: 'LR / bilty / reference entered (if any)' },
      { id: 'site_handover', label: 'Handed over at site / client received' },
      { id: 'photo_proof', label: 'Handover photo proof posted at site' },
      { id: 'client_sign', label: 'Client acknowledgement / sign' },
      { id: 'transport_closed', label: 'Transport closed' },
    ],
  },
]

export function checklistFor(stageId: DepartmentId): ChecklistItemDef[] {
  return PIPELINE_STAGES.find((s) => s.id === stageId)?.checklist || []
}

export function emptyChecklistState(stageId: DepartmentId): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  for (const item of checklistFor(stageId)) out[item.id] = false
  return out
}

export function emptyAllChecklists(): Record<DepartmentId, Record<string, boolean>> {
  const out = {} as Record<DepartmentId, Record<string, boolean>>
  for (const stage of PIPELINE_STAGES) {
    out[stage.id] = emptyChecklistState(stage.id)
  }
  return out
}

export function checklistProgress(
  stageId: DepartmentId,
  state?: Record<string, boolean> | null,
): { done: number; total: number; complete: boolean } {
  const items = checklistFor(stageId)
  const total = items.length
  const done = items.filter((i) => state?.[i.id]).length
  return { done, total, complete: total > 0 && done === total }
}

/** Every department must post ≥1 product photo before stage can be marked done */
export function stagePhotoCount(
  photos: Partial<Record<DepartmentId, { id: string }[]>> | undefined,
  stageId: DepartmentId,
): number {
  return photos?.[stageId]?.length || 0
}

export function hasStagePhotoProof(
  photos: Partial<Record<DepartmentId, { id: string }[]>> | undefined,
  stageId: DepartmentId,
): boolean {
  return stagePhotoCount(photos, stageId) > 0
}

/** Pipeline order — next department unlocks only after previous is done (+ photo) */
export const PIPELINE_ORDER: DepartmentId[] = PIPELINE_STAGES.map((s) => s.id)

export function previousDepartment(stageId: DepartmentId): DepartmentId | null {
  const idx = PIPELINE_ORDER.indexOf(stageId)
  if (idx <= 0) return null
  return PIPELINE_ORDER[idx - 1] || null
}

export function stageIndex(stageId: DepartmentId): number {
  return PIPELINE_ORDER.indexOf(stageId)
}

/** Previous stage must be marked done (which itself requires photo proof). */
export function isDepartmentUnlocked(
  jobs: Partial<Record<DepartmentId, string>> | undefined,
  stageId: DepartmentId,
): boolean {
  const prev = previousDepartment(stageId)
  if (!prev) return true
  return (jobs?.[prev] || 'queued') === 'done'
}

export function departmentGate(
  order: {
    jobs?: Partial<Record<DepartmentId, string>>
    photos?: Partial<Record<DepartmentId, { id: string }[]>>
  },
  stageId: DepartmentId,
  action: 'start' | 'done',
): { ok: true } | { ok: false; reason: string } {
  const prev = previousDepartment(stageId)
  if (prev && (order.jobs?.[prev] || 'queued') !== 'done') {
    const prevName = PIPELINE_STAGES.find((s) => s.id === prev)?.name || prev
    return {
      ok: false,
      reason: `Wait for ${prevName} to finish and post photo proof before this department can ${action}`,
    }
  }
  if (action === 'done' && !hasStagePhotoProof(order.photos, stageId)) {
    return {
      ok: false,
      reason: 'Post at least one product photo proof before marking this department done',
    }
  }
  return { ok: true }
}
