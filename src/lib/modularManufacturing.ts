/**
 * Modular manufacturing takeoff for Priyabadal workshop supervisors.
 * Easy box-module math: plywood, inner laminate, outer laminate, hardware.
 */

export type ModuleKind =
  | 'wardrobe'
  | 'kitchen-base'
  | 'kitchen-wall'
  | 'kitchen-tall'
  | 'tv-unit'
  | 'vanity'
  | 'storage'

export type PlywoodThicknessMm = 12 | 16 | 18 | 25

export type ModularInput = {
  jobName: string
  moduleKind: ModuleKind
  widthMm: number
  heightMm: number
  depthMm: number
  qty: number
  plywoodMm: PlywoodThicknessMm
  shutters: number
  shelves: number
  drawers: number
  includeBack: boolean
  wastePercent: number
  notes?: string
}

export type PanelLine = {
  name: string
  qty: number
  widthMm: number
  heightMm: number
  areaSqft: number
  material: 'plywood' | 'back'
}

export type HardwareLine = {
  name: string
  qty: number
  unit: string
  note?: string
}

export type ModularTakeoff = {
  input: ModularInput
  panels: PanelLine[]
  plywoodSqft: number
  plywoodSqftWithWaste: number
  plywoodSheets: number
  innerLaminateSqft: number
  outerLaminateSqft: number
  edgeBandingRm: number
  hardware: HardwareLine[]
  summaryLines: string[]
}

const SHEET_SQFT = 32
const MM2_TO_SQFT = 1 / 92903.04

export const MODULE_PRESETS: {
  id: ModuleKind
  label: string
  hint: string
  defaults: Partial<ModularInput>
}[] = [
  {
    id: 'wardrobe',
    label: 'Wardrobe',
    hint: 'Floor wardrobe carcass + shutters',
    defaults: {
      widthMm: 900,
      heightMm: 2100,
      depthMm: 550,
      shutters: 2,
      shelves: 3,
      drawers: 0,
      plywoodMm: 18,
      includeBack: true,
    },
  },
  {
    id: 'kitchen-base',
    label: 'Kitchen base',
    hint: 'Below counter cabinet',
    defaults: {
      widthMm: 600,
      heightMm: 720,
      depthMm: 560,
      shutters: 1,
      shelves: 1,
      drawers: 0,
      plywoodMm: 18,
      includeBack: true,
    },
  },
  {
    id: 'kitchen-wall',
    label: 'Kitchen wall',
    hint: 'Wall unit above counter',
    defaults: {
      widthMm: 600,
      heightMm: 700,
      depthMm: 320,
      shutters: 1,
      shelves: 1,
      drawers: 0,
      plywoodMm: 18,
      includeBack: true,
    },
  },
  {
    id: 'kitchen-tall',
    label: 'Kitchen tall',
    hint: 'Pantry / appliance tall unit',
    defaults: {
      widthMm: 600,
      heightMm: 2100,
      depthMm: 560,
      shutters: 2,
      shelves: 4,
      drawers: 0,
      plywoodMm: 18,
      includeBack: true,
    },
  },
  {
    id: 'tv-unit',
    label: 'TV unit',
    hint: 'Low storage + shutters',
    defaults: {
      widthMm: 1500,
      heightMm: 450,
      depthMm: 400,
      shutters: 2,
      shelves: 0,
      drawers: 2,
      plywoodMm: 18,
      includeBack: true,
    },
  },
  {
    id: 'vanity',
    label: 'Vanity',
    hint: 'Bathroom vanity carcass',
    defaults: {
      widthMm: 750,
      heightMm: 700,
      depthMm: 450,
      shutters: 2,
      shelves: 0,
      drawers: 0,
      plywoodMm: 18,
      includeBack: true,
    },
  },
  {
    id: 'storage',
    label: 'Storage box',
    hint: 'Generic modular box',
    defaults: {
      widthMm: 800,
      heightMm: 1800,
      depthMm: 450,
      shutters: 2,
      shelves: 3,
      drawers: 0,
      plywoodMm: 18,
      includeBack: true,
    },
  },
]

function round1(n: number) {
  return Math.round(n * 10) / 10
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function makePanel(
  name: string,
  qty: number,
  widthMm: number,
  heightMm: number,
  material: PanelLine['material'] = 'plywood',
): PanelLine {
  return {
    name,
    qty,
    widthMm: Math.round(widthMm),
    heightMm: Math.round(heightMm),
    areaSqft: round2(qty * widthMm * heightMm * MM2_TO_SQFT),
    material,
  }
}

export function defaultModularInput(kind: ModuleKind = 'wardrobe'): ModularInput {
  const preset = MODULE_PRESETS.find((p) => p.id === kind) || MODULE_PRESETS[0]
  return {
    jobName: 'Modular job',
    widthMm: 900,
    heightMm: 2100,
    depthMm: 550,
    qty: 1,
    plywoodMm: 18,
    shutters: 2,
    shelves: 3,
    drawers: 0,
    includeBack: true,
    wastePercent: 12,
    notes: '',
    ...preset.defaults,
    moduleKind: preset.id,
  }
}

export function calculateModularTakeoff(input: ModularInput): ModularTakeoff {
  const W = Math.max(200, Number(input.widthMm) || 0)
  const H = Math.max(200, Number(input.heightMm) || 0)
  const D = Math.max(150, Number(input.depthMm) || 0)
  const t = (input.plywoodMm || 18) as PlywoodThicknessMm
  const qty = Math.max(1, Math.floor(Number(input.qty) || 1))
  const shutters = Math.max(0, Math.floor(Number(input.shutters) || 0))
  const shelves = Math.max(0, Math.floor(Number(input.shelves) || 0))
  const drawers = Math.max(0, Math.floor(Number(input.drawers) || 0))
  const wastePct = Math.max(0, Number(input.wastePercent) || 0)

  const innerW = Math.max(50, W - 2 * t)
  const innerD = Math.max(50, D - t)

  const one: PanelLine[] = [
    makePanel('Side (LH / RH)', 2, H, D),
    makePanel('Top', 1, innerW, D),
    makePanel('Bottom', 1, innerW, D),
  ]

  if (shelves > 0) {
    one.push(makePanel(`Shelf × ${shelves}`, shelves, innerW, Math.max(50, innerD - 10)))
  }
  if (input.includeBack) {
    one.push(makePanel('Back (6–8 mm)', 1, W, H, 'back'))
  }
  if (shutters > 0) {
    const shutterW = Math.max(80, W / shutters - 3)
    one.push(makePanel(`Shutter × ${shutters}`, shutters, shutterW, Math.max(80, H - 4)))
  }
  if (drawers > 0) {
    const dw = Math.max(80, innerW - 30)
    const dd = Math.max(80, Math.min(innerD - 20, D - 80))
    const dh = 150
    one.push(makePanel(`Drawer front × ${drawers}`, drawers, dw, dh))
    one.push(makePanel(`Drawer side × ${drawers * 2}`, drawers * 2, dd, dh))
    one.push(makePanel(`Drawer back × ${drawers}`, drawers, Math.max(50, dw - 2 * t), dh))
    one.push(makePanel(`Drawer bottom × ${drawers}`, drawers, dw, dd, 'back'))
  }

  const panels = one.map((p) => ({
    ...p,
    qty: p.qty * qty,
    areaSqft: round2(p.areaSqft * qty),
  }))

  const plywoodSqft = round2(panels.reduce((s, p) => s + p.areaSqft, 0))
  const plywoodSqftWithWaste = round2(plywoodSqft * (1 + wastePct / 100))
  const plywoodSheets = Math.max(1, Math.ceil(plywoodSqftWithWaste / SHEET_SQFT))

  const innerLaminateSqft = round2(
    panels
      .filter((p) => /Side|Top|Bottom|Shelf/i.test(p.name))
      .reduce((s, p) => s + p.areaSqft * 2, 0),
  )

  const shutterArea = panels
    .filter((p) => /Shutter|Drawer front/i.test(p.name))
    .reduce((s, p) => s + p.areaSqft, 0)
  const outerLaminateSqft = round2(shutterArea + 2 * H * D * MM2_TO_SQFT * qty)

  const edgeBandingRm = round1(
    (shutters > 0 ? shutters * qty * (2 * (W / shutters + H)) * 0.001 : 0) +
      shelves * qty * innerW * 0.001,
  )

  const hardware: HardwareLine[] = []
  if (shutters > 0) {
    const hingesPerDoor = H >= 1800 ? 3 : 2
    hardware.push({
      name: 'Hinges (auto / soft-close)',
      qty: shutters * qty * hingesPerDoor,
      unit: 'pcs',
      note: `${hingesPerDoor} per shutter`,
    })
    hardware.push({
      name: 'Handles / knobs (shutters)',
      qty: shutters * qty,
      unit: 'pcs',
    })
  }
  if (drawers > 0) {
    hardware.push({
      name: 'Drawer channels (pair)',
      qty: drawers * qty,
      unit: 'pairs',
      note: 'Telescopic / soft-close',
    })
    hardware.push({
      name: 'Handles (drawers)',
      qty: drawers * qty,
      unit: 'pcs',
    })
  }
  if (shelves > 0) {
    hardware.push({
      name: 'Shelf pins',
      qty: shelves * qty * 4,
      unit: 'pcs',
    })
  }
  hardware.push({
    name: 'Minifix / dowels set',
    qty,
    unit: 'sets',
    note: 'Carcass assembly pack',
  })
  hardware.push({
    name: 'Screws assortment',
    qty,
    unit: 'packs',
  })
  if (input.moduleKind === 'kitchen-base' || input.moduleKind === 'vanity') {
    hardware.push({
      name: 'Adjustable legs',
      qty: qty * 4,
      unit: 'pcs',
    })
  }

  const kindLabel =
    MODULE_PRESETS.find((p) => p.id === input.moduleKind)?.label || input.moduleKind

  const normalized: ModularInput = {
    ...input,
    widthMm: W,
    heightMm: H,
    depthMm: D,
    plywoodMm: t,
    qty,
    shutters,
    shelves,
    drawers,
    wastePercent: wastePct,
  }

  return {
    input: normalized,
    panels,
    plywoodSqft,
    plywoodSqftWithWaste,
    plywoodSheets,
    innerLaminateSqft,
    outerLaminateSqft,
    edgeBandingRm,
    hardware,
    summaryLines: [
      `${normalized.jobName || 'Modular job'} · ${kindLabel} × ${qty}`,
      `Size: ${W} × ${H} × ${D} mm · Plywood ${t} mm`,
      `Plywood: ${plywoodSqftWithWaste} sqft (with ${wastePct}% waste) ≈ ${plywoodSheets} sheet(s) of 8×4`,
      `Inner laminate: ${innerLaminateSqft} sqft`,
      `Outer laminate: ${outerLaminateSqft} sqft`,
      `Edge banding: ${edgeBandingRm} m`,
      `Hardware: ${shutters * qty} shutters, ${drawers * qty} drawers, ${shelves * qty} shelves`,
    ],
  }
}

export function takeoffWhatsAppText(t: ModularTakeoff) {
  const lines = [
    '*Priyabadal · Modular manufacturing sheet*',
    ...t.summaryLines.map((l) => `• ${l}`),
    '',
    '*Hardware*',
    ...t.hardware.map((h) => `• ${h.name}: ${h.qty} ${h.unit}${h.note ? ` (${h.note})` : ''}`),
  ]
  if (t.input.notes?.trim()) lines.push('', `Notes: ${t.input.notes.trim()}`)
  return lines.join('\n')
}
