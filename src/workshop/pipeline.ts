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
      { id: 'order_ok', label: 'Final OK — send to designing' },
    ],
  },
  {
    id: 'design',
    name: 'Designing',
    short: 'Design',
    description: 'Designer opens product details from the job sheet and ticks each design task done.',
    checklist: [
      { id: 'read_job_sheet', label: 'Read full product / job sheet details' },
      { id: 'layout_drawing', label: 'Layout / drawing prepared' },
      { id: 'cut_list_ready', label: 'Cut list / nesting ready for cutting' },
      { id: 'edge_band_plan', label: 'Edge banding / laminate plan noted' },
      { id: 'hardware_plan', label: 'Hardware plan noted' },
      { id: 'design_signed', label: 'Design signed off for cutting' },
    ],
  },
  {
    id: 'cutting',
    name: 'Cutting',
    short: 'Cut',
    description: 'Cutting department works from the approved design / cut list.',
    checklist: [
      { id: 'boards_issued', label: 'Plywood / boards issued as per list' },
      { id: 'laminate_issued', label: 'Inner / outer laminate issued' },
      { id: 'cut_complete', label: 'All panels cut as per nesting' },
      { id: 'edge_banding', label: 'Edge banding done (if required here)' },
      { id: 'parts_labelled', label: 'Parts labelled for Phase 2' },
      { id: 'cut_handover', label: 'Handover to Phase 2 finishing' },
    ],
  },
  {
    id: 'phase2_finishing',
    name: 'Phase 2 — Finishing',
    short: 'Phase 2',
    description: 'Proper finishing department — paint, polish, shutters, assembly finish options.',
    checklist: [
      { id: 'carcass_assy', label: 'Carcass / box assembly done' },
      { id: 'shutter_fit', label: 'Shutters / doors fitted' },
      { id: 'surface_finish', label: 'Paint / polish / laminate finish done' },
      { id: 'hardware_fit', label: 'Hardware fitted (hinges, channels, handles)' },
      { id: 'glass_mirror', label: 'Glass / mirror / special finish (if any)' },
      { id: 'phase2_clean', label: 'Cleaned & ready for QC' },
    ],
  },
  {
    id: 'qc',
    name: 'QC — Quality Check',
    short: 'QC',
    description: 'Quality check against job sheet before dispatch.',
    checklist: [
      { id: 'size_check', label: 'Sizes match job sheet' },
      { id: 'finish_check', label: 'Finish / colour match approved' },
      { id: 'hardware_check', label: 'Hardware working & complete' },
      { id: 'damage_check', label: 'No damage / scratches' },
      { id: 'packing_check', label: 'Packed / protected for transport' },
      { id: 'qc_pass', label: 'QC PASS — release to dispatch' },
    ],
  },
  {
    id: 'dispatch',
    name: 'Dispatch',
    short: 'Dispatch',
    description: 'Prepare finished product for handover / loading.',
    checklist: [
      { id: 'items_listed', label: 'Dispatch list vs job sheet matched' },
      { id: 'loaded', label: 'Loaded on vehicle' },
      { id: 'photos', label: 'Loading photos taken (optional)' },
      { id: 'docs_ready', label: 'Invoice / challan / papers ready' },
      { id: 'dispatch_ok', label: 'Dispatch cleared' },
    ],
  },
  {
    id: 'transport',
    name: 'Transport & handover',
    short: 'Transport',
    description: 'Transport details after finished product is handed over.',
    checklist: [
      { id: 'vehicle_entered', label: 'Vehicle number entered' },
      { id: 'driver_entered', label: 'Driver name & phone entered' },
      { id: 'lr_entered', label: 'LR / bilty / reference entered (if any)' },
      { id: 'site_handover', label: 'Handed over at site / client received' },
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
