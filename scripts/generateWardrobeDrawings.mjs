/**
 * Detailed carcass shop drawings for Priyabadal wardrobe products.
 * Layouts mapped from each product's carcass photo.
 * Run: node scripts/generateWardrobeDrawings.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve('public/products/wardrobe')
const VW = 980
const VH = 1280

/**
 * Parts use y as fraction of inner carcass height (0 = top, 1 = bottom).
 * @typedef {{ kind: string, y?: number, count?: number, rows?: number, cols?: number, left?: string, right?: string, glass?: boolean, label?: string, h?: number }} Part
 */

/** @type {Array<{folder:string,name:string,sku:string,finish:string,doors:string,doorCount:number,ref:{w:number,h:number,d:number},bays:Array<{label:string,widthShare:number,parts:Part[]}>}>} */
const WARDROBES = [
  {
    folder: 'wardrobe-1',
    name: 'Taupe Panel Hinged Wardrobe',
    sku: 'PBH-WR-01',
    finish: 'Matte taupe façade · dark walnut carcass interior',
    doors: 'hinged',
    doorCount: 4,
    ref: { w: 8, h: 7, d: 2 },
    bays: [
      {
        label: 'Shelves + LED',
        widthShare: 1,
        parts: [
          { kind: 'shelf', y: 0.1, label: 'top shelf' },
          { kind: 'led', y: 0.1 },
          { kind: 'shelf', y: 0.24 },
          { kind: 'led', y: 0.24 },
          { kind: 'shelf', y: 0.38 },
          { kind: 'led', y: 0.38 },
          { kind: 'shelf', y: 0.52 },
          { kind: 'led', y: 0.52 },
          { kind: 'shelf', y: 0.66 },
          { kind: 'led', y: 0.66 },
          { kind: 'shelf', y: 0.8 },
          { kind: 'led', y: 0.8 },
        ],
      },
      {
        label: 'Hang + shelves',
        widthShare: 1,
        parts: [
          { kind: 'shelf', y: 0.1 },
          { kind: 'led', y: 0.1 },
          { kind: 'rod', y: 0.2, label: 'hanging rod' },
          { kind: 'shelf', y: 0.52 },
          { kind: 'shelf', y: 0.68 },
          { kind: 'shelf', y: 0.84, label: 'shoe shelf' },
        ],
      },
      {
        label: 'Hang + shoe pull-outs',
        widthShare: 1,
        parts: [
          { kind: 'shelf', y: 0.1 },
          { kind: 'led', y: 0.1 },
          { kind: 'rod', y: 0.2, label: 'hanging rod' },
          { kind: 'shelf', y: 0.48 },
          { kind: 'shoe', y: 0.58, count: 4 },
        ],
      },
      {
        label: 'Hang + glass drawers',
        widthShare: 1,
        parts: [
          { kind: 'shelf', y: 0.1 },
          { kind: 'led', y: 0.1 },
          { kind: 'rod', y: 0.2, label: 'hang / pull-down' },
          { kind: 'drawer', y: 0.55, count: 3, glass: true },
        ],
      },
    ],
  },
  {
    folder: 'wardrobe-2',
    name: 'Light Oak Open Wardrobe',
    sku: 'PBH-WR-02',
    finish: 'Light oak laminate carcass (open façade)',
    doors: 'open',
    doorCount: 0,
    ref: { w: 8, h: 7, d: 2 },
    bays: [
      {
        label: 'Shelves + trouser pull-out',
        widthShare: 1.05,
        parts: [
          { kind: 'shelf', y: 0.1 },
          { kind: 'shelf', y: 0.22 },
          { kind: 'split', y: 0.3, left: 'shelves', right: 'trousers', h: 0.52 },
          { kind: 'shelf', y: 0.9 },
        ],
      },
      {
        label: 'Long hang + drawer',
        widthShare: 1.25,
        parts: [
          { kind: 'shelf', y: 0.1 },
          { kind: 'rod', y: 0.2, label: 'long hang' },
          { kind: 'drawer', y: 0.68, count: 1 },
          { kind: 'shelf', y: 0.9 },
        ],
      },
      {
        label: 'Hang + cubbies + drawers',
        widthShare: 1.1,
        parts: [
          { kind: 'shelf', y: 0.1 },
          { kind: 'split', y: 0.18, left: 'short-hang', right: 'cubbies', h: 0.4 },
          { kind: 'drawer', y: 0.62, count: 2 },
          { kind: 'shelf', y: 0.9 },
        ],
      },
      {
        label: 'Twin shelf columns',
        widthShare: 0.95,
        parts: [
          { kind: 'shelf', y: 0.1 },
          { kind: 'split', y: 0.18, left: 'shelves', right: 'shelves-stagger', h: 0.7 },
          { kind: 'shelf', y: 0.92 },
        ],
      },
    ],
  },
  {
    folder: 'wardrobe-3',
    name: 'LED Oak Dressing Wardrobe',
    sku: 'PBH-WR-03',
    finish: 'Warm oak laminate · integrated LED · leather pulls',
    doors: 'open',
    doorCount: 0,
    ref: { w: 7, h: 7.5, d: 2 },
    bays: [
      {
        label: 'Lit shelf column',
        widthShare: 0.85,
        parts: [
          { kind: 'shelf', y: 0.1 },
          { kind: 'led', y: 0.1 },
          { kind: 'shelf', y: 0.26 },
          { kind: 'led', y: 0.26 },
          { kind: 'shelf', y: 0.42 },
          { kind: 'led', y: 0.42 },
          { kind: 'shelf', y: 0.58 },
          { kind: 'led', y: 0.58 },
          { kind: 'shelf', y: 0.74 },
          { kind: 'led', y: 0.74 },
          { kind: 'shelf', y: 0.9 },
          { kind: 'led', y: 0.9 },
        ],
      },
      {
        label: 'Hang + leather drawers',
        widthShare: 1,
        parts: [
          { kind: 'shelf', y: 0.1 },
          { kind: 'led', y: 0.1 },
          { kind: 'rod', y: 0.2, label: 'short hang' },
          { kind: 'drawer', y: 0.52, count: 2, label: 'leather tab' },
          { kind: 'shelf', y: 0.88 },
        ],
      },
      {
        label: 'Loft + hang + accessory',
        widthShare: 1.55,
        parts: [
          { kind: 'loft', y: 0.02, h: 0.16, count: 2 },
          { kind: 'rod', y: 0.24, label: 'long hang' },
          { kind: 'led', y: 0.2 },
          { kind: 'cubby', y: 0.52, rows: 2, cols: 3, label: 'glass accessory' },
          { kind: 'drawer', y: 0.72, count: 2, label: 'leather tab' },
        ],
      },
    ],
  },
  {
    folder: 'wardrobe-4',
    name: 'Walnut LED Open Wardrobe',
    sku: 'PBH-WR-04',
    finish: 'Dark walnut · LED cove lighting',
    doors: 'open',
    doorCount: 0,
    ref: { w: 10, h: 8, d: 2 },
    bays: [
      {
        label: 'Shelves + 5 drawers',
        widthShare: 1.35,
        parts: [
          { kind: 'shelf', y: 0.08 },
          { kind: 'led', y: 0.08 },
          { kind: 'shelf', y: 0.2 },
          { kind: 'led', y: 0.2 },
          { kind: 'shelf', y: 0.34, label: 'shoe display' },
          { kind: 'drawer', y: 0.44, count: 5, glass: true },
        ],
      },
      {
        label: 'Hang + trays + trousers',
        widthShare: 1.15,
        parts: [
          { kind: 'shelf', y: 0.08 },
          { kind: 'led', y: 0.08 },
          { kind: 'rod', y: 0.18, label: 'jacket hang' },
          { kind: 'drawer', y: 0.52, count: 2, label: 'pull-out trays' },
          { kind: 'rod', y: 0.72, label: 'trouser hang' },
        ],
      },
      {
        label: 'Shelf column',
        widthShare: 0.85,
        parts: [
          { kind: 'shelf', y: 0.1 },
          { kind: 'led', y: 0.1 },
          { kind: 'shelf', y: 0.26 },
          { kind: 'shelf', y: 0.42 },
          { kind: 'shelf', y: 0.58 },
          { kind: 'shelf', y: 0.74 },
          { kind: 'shelf', y: 0.9 },
        ],
      },
      {
        label: 'Shelf column',
        widthShare: 0.85,
        parts: [
          { kind: 'shelf', y: 0.1 },
          { kind: 'led', y: 0.1 },
          { kind: 'shelf', y: 0.26 },
          { kind: 'shelf', y: 0.42 },
          { kind: 'shelf', y: 0.58 },
          { kind: 'shelf', y: 0.74 },
          { kind: 'shelf', y: 0.9 },
        ],
      },
    ],
  },
  {
    folder: 'wardrobe-5',
    name: 'Cream Bifold Accent Wardrobe',
    sku: 'PBH-WR-05',
    finish: 'Cream bifold façade · light oak carcass',
    doors: 'bifold',
    doorCount: 4,
    ref: { w: 8, h: 7, d: 2 },
    bays: [
      {
        label: 'Shelf + mid drawer',
        widthShare: 0.8,
        parts: [
          { kind: 'shelf', y: 0.1 },
          { kind: 'shelf', y: 0.24 },
          { kind: 'shelf', y: 0.36 },
          { kind: 'shelf', y: 0.48 },
          { kind: 'drawer', y: 0.54, count: 1 },
          { kind: 'shelf', y: 0.72 },
          { kind: 'shelf', y: 0.86 },
        ],
      },
      {
        label: 'Double hang',
        widthShare: 1.05,
        parts: [
          { kind: 'shelf', y: 0.1 },
          { kind: 'rod', y: 0.2, label: 'short hang' },
          { kind: 'rod', y: 0.52, label: 'lower hang' },
          { kind: 'shelf', y: 0.9 },
        ],
      },
      {
        label: 'Long hang + drawer',
        widthShare: 1.2,
        parts: [
          { kind: 'shelf', y: 0.1 },
          { kind: 'rod', y: 0.2, label: 'long hang' },
          { kind: 'drawer', y: 0.62, count: 1 },
          { kind: 'shelf', y: 0.88 },
        ],
      },
      {
        label: 'Cubbies + drawers + shoes',
        widthShare: 1.35,
        parts: [
          { kind: 'shelf', y: 0.08 },
          { kind: 'cubby', y: 0.14, rows: 4, cols: 2, label: 'accessory shelves' },
          { kind: 'drawer', y: 0.52, count: 3, cols: 2, label: '2-col drawers ×3' },
          { kind: 'shoe', y: 0.8, count: 2 },
        ],
      },
    ],
  },
  {
    folder: 'wardrobe-6',
    name: 'Dark Wood Walk-in Wardrobe',
    sku: 'PBH-WR-06',
    finish: 'Dark wood carcass · cream arched doors · gold hardware',
    doors: 'hinged',
    doorCount: 4,
    ref: { w: 12, h: 8, d: 2 },
    bays: [
      {
        label: 'Lit shelf column',
        widthShare: 0.85,
        parts: [
          { kind: 'shelf', y: 0.1 },
          { kind: 'led', y: 0.1 },
          { kind: 'shelf', y: 0.26 },
          { kind: 'shelf', y: 0.42 },
          { kind: 'shelf', y: 0.58 },
          { kind: 'shelf', y: 0.74 },
          { kind: 'shelf', y: 0.9 },
        ],
      },
      {
        label: 'Shelves + gold drawers',
        widthShare: 1.15,
        parts: [
          { kind: 'shelf', y: 0.08 },
          { kind: 'led', y: 0.08 },
          { kind: 'shelf', y: 0.2 },
          { kind: 'led', y: 0.2 },
          { kind: 'shelf', y: 0.34 },
          { kind: 'led', y: 0.34 },
          { kind: 'shelf', y: 0.46 },
          { kind: 'drawer', y: 0.54, count: 4, label: 'gold pulls' },
        ],
      },
      {
        label: 'Double hang',
        widthShare: 1.1,
        parts: [
          { kind: 'shelf', y: 0.08 },
          { kind: 'led', y: 0.08 },
          { kind: 'rod', y: 0.18, label: 'upper hang' },
          { kind: 'rod', y: 0.55, label: 'trouser hang' },
        ],
      },
      {
        label: 'Hang + cubbies',
        widthShare: 1.2,
        parts: [
          { kind: 'shelf', y: 0.08 },
          { kind: 'led', y: 0.08 },
          { kind: 'rod', y: 0.18, label: 'long hang' },
          { kind: 'cubby', y: 0.55, rows: 2, cols: 2, label: 'open cubbies' },
        ],
      },
      {
        label: 'Mirror / dress bay',
        widthShare: 0.95,
        parts: [
          { kind: 'shelf', y: 0.08 },
          { kind: 'led', y: 0.08 },
          { kind: 'mirror', y: 0.14 },
          { kind: 'shelf', y: 0.9 },
        ],
      },
    ],
  },
]

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
}

function dimLine(x1, y1, x2, y2, label, opts = {}) {
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  const vertical = Math.abs(x2 - x1) < 1
  const off = opts.offset ?? (vertical ? 14 : -8)
  const labelEl = vertical
    ? `<text x="${midX + off}" y="${midY}" font-size="12" font-weight="700" fill="#152019" transform="rotate(90 ${midX + off} ${midY})">${esc(label)}</text>`
    : `<text x="${midX}" y="${midY + off}" text-anchor="middle" font-size="12" font-weight="700" fill="#152019">${esc(label)}</text>`
  if (vertical) {
    return `
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#9a7340" stroke-width="1.3"/>
  <line x1="${x1 - 5}" y1="${y1}" x2="${x1 + 5}" y2="${y1}" stroke="#9a7340" stroke-width="1.3"/>
  <line x1="${x2 - 5}" y1="${y2}" x2="${x2 + 5}" y2="${y2}" stroke="#9a7340" stroke-width="1.3"/>
  ${labelEl}`
  }
  return `
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#9a7340" stroke-width="1.3"/>
  <line x1="${x1}" y1="${y1 - 5}" x2="${x1}" y2="${y1 + 5}" stroke="#9a7340" stroke-width="1.3"/>
  <line x1="${x2}" y1="${y2 - 5}" x2="${x2}" y2="${y2 + 5}" stroke="#9a7340" stroke-width="1.3"/>
  ${labelEl}`
}

function hatchPanel(x, y, w, h) {
  let lines = ''
  for (let i = 0; i < w + h; i += 7) {
    const x1 = x + Math.max(0, i - h)
    const y1 = y + Math.min(h, i)
    const x2 = x + Math.min(w, i)
    const y2 = y + Math.max(0, i - w)
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#4f6a58" stroke-width="0.6" opacity="0.25"/>`
  }
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e4ebe6" stroke="#4f6a58" stroke-width="1.5"/>${lines}`
}

function drawParts(parts, bx, by, bw, bh) {
  let out = ''
  for (const p of parts) {
    if (p.kind === 'shelf') {
      const y = by + p.y * bh
      out += `<rect x="${bx + 3}" y="${y - 4}" width="${bw - 6}" height="8" rx="1" fill="#cfd9d3" stroke="#3d5646" stroke-width="1.2"/>`
      out += `<line x1="${bx + 3}" y1="${y}" x2="${bx + bw - 3}" y2="${y}" stroke="#fff" stroke-width="0.8" opacity="0.5"/>`
      if (p.label) {
        out += `<text x="${bx + bw / 2}" y="${y - 7}" text-anchor="middle" font-size="9" fill="#5c6b62">${esc(p.label)}</text>`
      }
    } else if (p.kind === 'led') {
      const y = by + p.y * bh
      out += `<rect x="${bx + 10}" y="${y + 5}" width="${bw - 20}" height="3.5" rx="1" fill="#f0d9a0"/>`
      out += `<rect x="${bx + 10}" y="${y + 5}" width="${bw - 20}" height="3.5" rx="1" fill="none" stroke="#c9a45a" stroke-width="0.6"/>`
    } else if (p.kind === 'rod') {
      const y = by + p.y * bh
      out += `<rect x="${bx + 12}" y="${y - 3}" width="${bw - 24}" height="6" rx="3" fill="#2a332c"/>`
      out += `<rect x="${bx + 8}" y="${y - 6}" width="7" height="12" rx="1" fill="#4f6a58"/>`
      out += `<rect x="${bx + bw - 15}" y="${y - 6}" width="7" height="12" rx="1" fill="#4f6a58"/>`
      // hangers hint
      for (let i = 0; i < 3; i++) {
        const hx = bx + bw * (0.28 + i * 0.2)
        out += `<path d="M${hx} ${y + 4} L${hx - 8} ${y + 18} L${hx + 8} ${y + 18} Z" fill="none" stroke="#8a9690" stroke-width="1"/>`
        out += `<line x1="${hx}" y1="${y + 18}" x2="${hx}" y2="${y + 55}" stroke="#8a9690" stroke-width="1" stroke-dasharray="2 2"/>`
      }
      out += `<text x="${bx + bw / 2}" y="${y - 10}" text-anchor="middle" font-size="10" font-weight="600" fill="#5c6b62">${esc(p.label || 'hanging rod')}</text>`
    } else if (p.kind === 'drawer') {
      const count = p.count || 1
      const cols = p.cols || 1
      const start = by + p.y * bh
      const each = Math.min(40, (bh * 0.4) / count)
      const cellW = (bw - 14) / cols
      for (let c = 0; c < cols; c++) {
        for (let i = 0; i < count; i++) {
          const y = start + i * each
          const x = bx + 7 + c * cellW
          const fill = p.glass && i === 0 ? '#e8f0f4' : '#f7faf8'
          out += `<rect x="${x}" y="${y}" width="${cellW - 4}" height="${each - 4}" rx="2" fill="${fill}" stroke="#3d5646" stroke-width="1.2"/>`
          if (p.glass && i === 0) {
            out += `<rect x="${x + 5}" y="${y + 4}" width="${cellW - 14}" height="${each - 12}" fill="#dce8ee" stroke="#8aa0aa" stroke-width="0.8"/>`
            out += `<text x="${x + cellW / 2 - 2}" y="${y + each / 2}" text-anchor="middle" font-size="8" fill="#5c6b62">glass</text>`
          } else {
            out += `<line x1="${x + cellW * 0.28}" y1="${y + (each - 4) / 2}" x2="${x + cellW * 0.72 - 4}" y2="${y + (each - 4) / 2}" stroke="#152019" stroke-width="2.2" stroke-linecap="round"/>`
          }
          // soft-close slide hint
          out += `<line x1="${x + 2}" y1="${y + 3}" x2="${x + 2}" y2="${y + each - 7}" stroke="#9a7340" stroke-width="1.2" opacity="0.5"/>`
        }
      }
      out += `<text x="${bx + bw / 2}" y="${start - 5}" text-anchor="middle" font-size="10" font-weight="600" fill="#5c6b62">${esc(p.label || `${count * cols} drawer${count * cols > 1 ? 's' : ''}`)}</text>`
    } else if (p.kind === 'shoe') {
      const count = p.count || 2
      const start = by + p.y * bh
      const each = Math.min(34, (bh * 0.32) / count)
      for (let i = 0; i < count; i++) {
        const y = start + i * each
        out += `<rect x="${bx + 7}" y="${y}" width="${bw - 14}" height="${each - 5}" rx="2" fill="#eef3f0" stroke="#3d5646" stroke-width="1.1"/>`
        for (let s = 0; s < 5; s++) {
          const sx = bx + 14 + s * ((bw - 28) / 5)
          out += `<line x1="${sx}" y1="${y + 3}" x2="${sx}" y2="${y + each - 8}" stroke="#9a7340" stroke-width="1.4" opacity="0.65"/>`
        }
        out += `<line x1="${bx + 10}" y1="${y + each - 10}" x2="${bx + bw - 10}" y2="${y + each - 10}" stroke="#4f6a58" stroke-width="1" opacity="0.4"/>`
      }
      out += `<text x="${bx + bw / 2}" y="${start - 5}" text-anchor="middle" font-size="10" font-weight="600" fill="#5c6b62">shoe pull-out ×${count}</text>`
    } else if (p.kind === 'cubby') {
      const rows = p.rows || 2
      const cols = p.cols || 2
      const start = by + p.y * bh
      const gridH = Math.min(bh * 0.3, rows * 42)
      const cellW = (bw - 14) / cols
      const cellH = gridH / rows
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          out += `<rect x="${bx + 7 + c * cellW}" y="${start + r * cellH}" width="${cellW - 3}" height="${cellH - 3}" fill="#fff" stroke="#3d5646" stroke-width="1.1"/>`
          out += `<circle cx="${bx + 7 + c * cellW + cellW / 2}" cy="${start + r * cellH + cellH / 2}" r="2" fill="#c5d2cb"/>`
        }
      }
      out += `<text x="${bx + bw / 2}" y="${start - 5}" text-anchor="middle" font-size="10" font-weight="600" fill="#5c6b62">${esc(p.label || `cubby ${rows}×${cols}`)}</text>`
    } else if (p.kind === 'loft') {
      const y = by + (p.y || 0) * bh
      const h = (p.h || 0.14) * bh
      const n = p.count || 2
      const dw = (bw - 12) / n
      for (let i = 0; i < n; i++) {
        out += `<rect x="${bx + 6 + i * dw}" y="${y}" width="${dw - 3}" height="${h}" rx="2" fill="#f4f1ea" stroke="#3d5646" stroke-width="1.3"/>`
        out += `<line x1="${bx + 6 + i * dw + dw / 2}" y1="${y + h * 0.35}" x2="${bx + 6 + i * dw + dw / 2}" y2="${y + h * 0.65}" stroke="#152019" stroke-width="2.5" stroke-linecap="round"/>`
      }
      out += `<text x="${bx + bw / 2}" y="${y - 5}" text-anchor="middle" font-size="10" font-weight="600" fill="#5c6b62">loft shutters</text>`
    } else if (p.kind === 'mirror') {
      const y = by + p.y * bh
      const mh = bh * 0.7
      out += `<rect x="${bx + 10}" y="${y}" width="${bw - 20}" height="${mh}" rx="3" fill="#e4eef3" stroke="#3d5646" stroke-width="1.5"/>`
      out += `<rect x="${bx + 16}" y="${y + 8}" width="${bw - 32}" height="${mh - 16}" fill="#d5e4eb" stroke="#8aa0aa" stroke-width="1" stroke-dasharray="5 3"/>`
      out += `<text x="${bx + bw / 2}" y="${y + mh / 2}" text-anchor="middle" font-size="13" font-weight="700" fill="#4f6a58">FULL MIRROR</text>`
      out += `<line x1="${bx + 14}" y1="${y + 12}" x2="${bx + 14}" y2="${y + mh - 12}" stroke="#f0d9a0" stroke-width="4"/>`
      out += `<line x1="${bx + bw - 14}" y1="${y + 12}" x2="${bx + bw - 14}" y2="${y + mh - 12}" stroke="#f0d9a0" stroke-width="4"/>`
    } else if (p.kind === 'split') {
      const y = by + p.y * bh
      const span = (p.h || 0.5) * bh
      const mid = bx + bw / 2
      out += `<rect x="${mid - 3}" y="${y}" width="6" height="${span}" fill="#cfd9d3" stroke="#3d5646" stroke-width="1"/>`
      const leftW = mid - bx - 8
      const rightW = bx + bw - mid - 8

      if (p.left === 'long-hang' || p.left === 'short-hang' || p.left === 'shelves') {
        if (p.left.includes('hang')) {
          out += `<rect x="${bx + 10}" y="${y + 18}" width="${leftW - 4}" height="5" rx="2" fill="#2a332c"/>`
          out += `<text x="${bx + 8 + leftW / 2}" y="${y + 12}" text-anchor="middle" font-size="9" fill="#5c6b62">${p.left === 'long-hang' ? 'long hang' : 'short hang'}</text>`
        } else {
          for (let i = 0; i < 4; i++) {
            const sy = y + 20 + i * (span * 0.2)
            out += `<rect x="${bx + 8}" y="${sy}" width="${leftW}" height="6" fill="#cfd9d3" stroke="#3d5646" stroke-width="0.9"/>`
          }
          out += `<text x="${bx + 8 + leftW / 2}" y="${y + 12}" text-anchor="middle" font-size="9" fill="#5c6b62">shelves</text>`
        }
      }

      if (p.right === 'trousers' || p.right === 'short-hang' || p.right === 'cubbies' || p.right === 'shelves' || p.right === 'shelves-stagger') {
        if (p.right === 'trousers') {
          out += `<text x="${mid + 4 + rightW / 2}" y="${y + 12}" text-anchor="middle" font-size="9" fill="#5c6b62">trouser pull-out</text>`
          out += `<rect x="${mid + 8}" y="${y + 20}" width="${rightW - 4}" height="10" rx="1" fill="#eef3f0" stroke="#3d5646"/>`
          for (let i = 0; i < 6; i++) {
            const tx = mid + 14 + i * ((rightW - 16) / 6)
            out += `<line x1="${tx}" y1="${y + 34}" x2="${tx}" y2="${y + span * 0.7}" stroke="#9a7340" stroke-width="1.6"/>`
            out += `<circle cx="${tx}" cy="${y + 34}" r="2" fill="#4f6a58"/>`
          }
        } else if (p.right === 'cubbies') {
          const rows = 6
          const cellH = (span - 16) / rows
          for (let r = 0; r < rows; r++) {
            out += `<rect x="${mid + 8}" y="${y + 14 + r * cellH}" width="${rightW - 4}" height="${cellH - 3}" fill="#fff" stroke="#3d5646" stroke-width="0.9"/>`
          }
          out += `<text x="${mid + 4 + rightW / 2}" y="${y + 10}" text-anchor="middle" font-size="9" fill="#5c6b62">cubbies 6×1</text>`
        } else if (p.right === 'short-hang') {
          out += `<rect x="${mid + 10}" y="${y + 18}" width="${rightW - 6}" height="5" rx="2" fill="#2a332c"/>`
          out += `<text x="${mid + 4 + rightW / 2}" y="${y + 12}" text-anchor="middle" font-size="9" fill="#5c6b62">short hang</text>`
        } else {
          const stagger = p.right === 'shelves-stagger'
          for (let i = 0; i < 5; i++) {
            const sy = y + 18 + i * (span * 0.16) + (stagger ? 10 : 0)
            out += `<rect x="${mid + 8}" y="${sy}" width="${rightW - 4}" height="6" fill="#cfd9d3" stroke="#3d5646" stroke-width="0.9"/>`
          }
          out += `<text x="${mid + 4 + rightW / 2}" y="${y + 12}" text-anchor="middle" font-size="9" fill="#5c6b62">${stagger ? 'staggered shelves' : 'shelves'}</text>`
        }
      }
    }
  }
  return out
}

function carcassDrawing(w) {
  const { w: W, h: H, d: D } = w.ref
  const totalShare = w.bays.reduce((s, b) => s + b.widthShare, 0)
  const frameX = 64
  const frameY = 168
  const frameW = 700
  const frameH = 760
  const gable = 16
  const top = 20
  const bottom = 30
  const innerX = frameX + gable
  const innerY = frameY + top
  const innerW = frameW - gable * 2
  const innerH = frameH - top - bottom

  let bayX = innerX
  let baysSvg = ''
  let dimBay = ''
  let schedule = ''
  w.bays.forEach((bay, i) => {
    const bw = (bay.widthShare / totalShare) * innerW
    const bayMm = Math.round((bay.widthShare / totalShare) * W * 304.8)
    const bayFt = ((bay.widthShare / totalShare) * W).toFixed(2)
    baysSvg += `
      <rect x="${bayX}" y="${innerY}" width="${bw}" height="${innerH}" fill="${i % 2 ? '#fbfcfb' : '#f3f7f4'}" stroke="#3d5646" stroke-width="1.4"/>
      ${drawParts(bay.parts, bayX, innerY, bw, innerH)}
      <text x="${bayX + bw / 2}" y="${frameY - 22}" text-anchor="middle" font-size="13" font-weight="700" fill="#152019">BAY ${i + 1}</text>
      <text x="${bayX + bw / 2}" y="${frameY - 7}" text-anchor="middle" font-size="10" fill="#5c6b62">${esc(bay.label)}</text>
    `
    if (i < w.bays.length - 1) {
      baysSvg += hatchPanel(bayX + bw - 4, innerY, 8, innerH)
    }
    dimBay += dimLine(bayX, frameY + frameH + 28, bayX + bw, frameY + frameH + 28, `${bayMm} mm`, { offset: -5 })
    schedule += `<text x="0" y="${i * 16}" font-size="11" fill="#5c6b62"><tspan font-weight="700" fill="#152019">B${i + 1}</tspan>  ${esc(bay.label)}  ·  ~${bayFt} ft (${bayMm} mm)</text>`
    bayX += bw
  })

  const structure = `
    ${hatchPanel(frameX, frameY, frameW, top)}
    ${hatchPanel(frameX, frameY + frameH - bottom, frameW, bottom)}
    ${hatchPanel(frameX, frameY, gable, frameH)}
    ${hatchPanel(frameX + frameW - gable, frameY, gable, frameH)}
    <text x="${frameX + frameW / 2}" y="${frameY + 14}" text-anchor="middle" font-size="10" fill="#3d5646">TOP RAIL · 18 mm BWP</text>
    <text x="${frameX + frameW / 2}" y="${frameY + frameH - 10}" text-anchor="middle" font-size="10" fill="#3d5646">BOTTOM RAIL / PLINTH · 18 mm BWP</text>
    <text x="${frameX + 11}" y="${frameY + frameH / 2}" font-size="10" fill="#3d5646" transform="rotate(-90 ${frameX + 11} ${frameY + frameH / 2})">L GABLE 18 mm</text>
    <text x="${frameX + frameW - 5}" y="${frameY + frameH / 2}" font-size="10" fill="#3d5646" transform="rotate(90 ${frameX + frameW - 5} ${frameY + frameH / 2})">R GABLE 18 mm</text>
  `

  const legend = `
    <g transform="translate(64, ${frameY + frameH + 58})">
      <text x="0" y="0" font-size="13" font-weight="700" fill="#152019">Symbol legend</text>
      <rect x="0" y="12" width="26" height="7" fill="#cfd9d3" stroke="#3d5646"/>
      <text x="32" y="19" font-size="11" fill="#5c6b62">Fixed shelf (18 mm)</text>
      <rect x="0" y="30" width="26" height="5" rx="2" fill="#2a332c"/>
      <text x="32" y="35" font-size="11" fill="#5c6b62">Hanging rod + cups</text>
      <rect x="170" y="12" width="26" height="14" fill="#f7faf8" stroke="#3d5646"/>
      <text x="202" y="23" font-size="11" fill="#5c6b62">Drawer + soft-close</text>
      <rect x="170" y="34" width="26" height="3" fill="#f0d9a0"/>
      <text x="202" y="39" font-size="11" fill="#5c6b62">LED strip</text>
      <rect x="360" y="12" width="26" height="14" fill="#eef3f0" stroke="#3d5646"/>
      <line x1="365" y1="14" x2="365" y2="24" stroke="#9a7340"/>
      <text x="392" y="23" font-size="11" fill="#5c6b62">Shoe pull-out slats</text>
      <rect x="360" y="32" width="26" height="14" fill="#fff" stroke="#3d5646"/>
      <text x="392" y="43" font-size="11" fill="#5c6b62">Cubby / open cell</text>
      <rect x="560" y="12" width="26" height="14" fill="#e8f0f4" stroke="#3d5646"/>
      <text x="592" y="23" font-size="11" fill="#5c6b62">Glass / mirror bay</text>
    </g>
  `

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}" preserveAspectRatio="xMidYMid meet" role="img">
  <title>${esc(w.name)} — detailed carcass shop drawing</title>
  <rect width="${VW}" height="${VH}" fill="#ffffff"/>
  <rect x="20" y="20" width="${VW - 40}" height="${VH - 40}" rx="8" fill="none" stroke="#c5d2cb" stroke-width="2"/>

  <text x="44" y="54" font-family="Georgia, 'Times New Roman', serif" font-size="26" fill="#152019">Detailed carcass shop drawing</text>
  <text x="44" y="78" font-family="system-ui,sans-serif" font-size="15" fill="#5c6b62">${esc(w.name)}</text>
  <text x="44" y="98" font-family="system-ui,sans-serif" font-size="12" fill="#8a9690">SKU ${esc(w.sku)} · Open carcass elevation matched to product carcass photo</text>
  <text x="44" y="116" font-family="system-ui,sans-serif" font-size="12" fill="#8a9690">${esc(w.finish)}</text>

  <rect x="${VW - 250}" y="36" width="206" height="90" rx="6" fill="#f7faf8" stroke="#c5d2cb"/>
  <text x="${VW - 238}" y="58" font-size="11" font-weight="700" fill="#152019">OVERALL (reference)</text>
  <text x="${VW - 238}" y="80" font-size="14" fill="#152019">W ${W}′ · H ${H}′ · D ${D}′</text>
  <text x="${VW - 238}" y="100" font-size="11" fill="#5c6b62">${w.bays.length} bays · made to measure</text>
  <text x="${VW - 238}" y="116" font-size="11" fill="#5c6b62">18 mm BWP carcass</text>

  ${structure}
  ${baysSvg}

  ${dimLine(frameX, frameY + frameH + 12, frameX + frameW, frameY + frameH + 12, `Overall W = ${W} ft (${Math.round(W * 304.8)} mm)`)}
  ${dimLine(frameX + frameW + 20, frameY, frameX + frameW + 20, frameY + frameH, `H = ${H} ft (${Math.round(H * 304.8)} mm)`, { offset: 14 })}
  ${dimBay}

  ${legend}

  <g transform="translate(780, 180)">
    <text x="0" y="0" font-size="13" font-weight="700" fill="#152019">Bay schedule</text>
    ${schedule}
    <text x="0" y="${w.bays.length * 16 + 24}" font-size="11" fill="#5c6b62">Depth D = ${D} ft</text>
    <text x="0" y="${w.bays.length * 16 + 40}" font-size="11" fill="#5c6b62">(${Math.round(D * 304.8)} mm clear)</text>
    <text x="0" y="${w.bays.length * 16 + 64}" font-size="11" font-weight="700" fill="#152019">Hardware</text>
    <text x="0" y="${w.bays.length * 16 + 80}" font-size="11" fill="#5c6b62">Soft-close slides</text>
    <text x="0" y="${w.bays.length * 16 + 96}" font-size="11" fill="#5c6b62">Rod cups · LED drivers</text>
    <text x="0" y="${w.bays.length * 16 + 112}" font-size="11" fill="#5c6b62">Hinges per shutter plan</text>
  </g>

  <rect x="40" y="${VH - 120}" width="${VW - 80}" height="80" rx="8" fill="#fff9f0" stroke="#9a7340"/>
  <text x="56" y="${VH - 94}" font-size="13" font-weight="700" fill="#152019">Carcass construction (Priyabadal standard)</text>
  <text x="56" y="${VH - 74}" font-size="12" fill="#5c6b62">Core: BWP plywood 18 mm · Surfaces: 1 mm laminate both sides · Edges: 2 mm edge banding on all exposed edges</text>
  <text x="56" y="${VH - 56}" font-size="12" fill="#5c6b62">Gables, rails, shelves &amp; partitions as drawn from carcass photo · Bay widths scale to live wall measure</text>
  <text x="56" y="${VH - 38}" font-size="12" fill="#5c6b62">Assembly guide: /guides/carcass-assembly · Confirm layout on WhatsApp before production · 10-year warranty</text>
</svg>
`
}

function elevationDrawing(w) {
  const { w: W, h: H, d: D } = w.ref
  const frameX = 140
  const frameY = 170
  const frameW = 560
  const frameH = 740
  const n = Math.max(w.doorCount || w.bays.length, 2)
  const doorW = frameW / n
  let doors = ''

  if (w.doors === 'open') {
    // Show simplified carcass silhouette matching bay count
    const totalShare = w.bays.reduce((s, b) => s + b.widthShare, 0)
    let x = frameX
    w.bays.forEach((bay, i) => {
      const bw = (bay.widthShare / totalShare) * frameW
      doors += `<rect x="${x + 2}" y="${frameY + 2}" width="${bw - 4}" height="${frameH - 4}" fill="${i % 2 ? '#f6f8f6' : '#eef3f0'}" stroke="#4f6a58" stroke-width="1.2"/>`
      doors += `<text x="${x + bw / 2}" y="${frameY + 24}" text-anchor="middle" font-size="11" font-weight="700" fill="#152019">B${i + 1}</text>`
      // hint of internals
      doors += `<line x1="${x + 10}" y1="${frameY + frameH * 0.12}" x2="${x + bw - 10}" y2="${frameY + frameH * 0.12}" stroke="#4f6a58" stroke-width="1" opacity="0.45"/>`
      if (bay.parts.some((p) => p.kind === 'rod')) {
        doors += `<line x1="${x + 16}" y1="${frameY + frameH * 0.22}" x2="${x + bw - 16}" y2="${frameY + frameH * 0.22}" stroke="#152019" stroke-width="2"/>`
      }
      if (bay.parts.some((p) => p.kind === 'drawer')) {
        doors += `<rect x="${x + 12}" y="${frameY + frameH * 0.62}" width="${bw - 24}" height="${frameH * 0.22}" fill="none" stroke="#4f6a58" stroke-width="1" opacity="0.5"/>`
      }
      doors += `<text x="${x + bw / 2}" y="${frameY + frameH - 14}" text-anchor="middle" font-size="9" fill="#8a9690">OPEN</text>`
      x += bw
    })
  } else {
    for (let i = 0; i < n; i++) {
      const x = frameX + i * doorW
      if (w.doors === 'bifold') {
        doors += `<rect x="${x + 4}" y="${frameY + 8}" width="${doorW - 8}" height="${frameH - 16}" rx="3" fill="#f7f4ec" stroke="#3d5646" stroke-width="1.7"/>`
        doors += `<line x1="${x + doorW / 2}" y1="${frameY + 12}" x2="${x + doorW / 2}" y2="${frameY + frameH - 12}" stroke="#c5d2cb" stroke-width="1"/>`
        doors += `<rect x="${x + 12}" y="${frameY + frameH * 0.42}" width="${doorW - 24}" height="26" fill="#c4a574" opacity="0.9"/>`
        doors += `<text x="${x + doorW / 2}" y="${frameY + frameH * 0.42 + 17}" text-anchor="middle" font-size="9" fill="#fff">wood band</text>`
      } else {
        doors += `<rect x="${x + 5}" y="${frameY + 8}" width="${doorW - 10}" height="${frameH - 16}" rx="3" fill="#ebe4da" stroke="#3d5646" stroke-width="1.7"/>`
        doors += `<rect x="${x + 14}" y="${frameY + 22}" width="${doorW - 28}" height="${frameH * 0.36}" fill="none" stroke="#9a7340" stroke-width="1.2"/>`
        doors += `<rect x="${x + 14}" y="${frameY + frameH * 0.42}" width="${doorW - 28}" height="${frameH * 0.14}" fill="none" stroke="#9a7340" stroke-width="1.2"/>`
        doors += `<rect x="${x + 14}" y="${frameY + frameH * 0.6}" width="${doorW - 28}" height="${frameH * 0.28}" fill="none" stroke="#9a7340" stroke-width="1.2"/>`
        doors += `<line x1="${x + doorW * 0.78}" y1="${frameY + frameH * 0.38}" x2="${x + doorW * 0.78}" y2="${frameY + frameH * 0.58}" stroke="#152019" stroke-width="4" stroke-linecap="round"/>`
      }
    }
  }

  const doorLabel =
    w.doors === 'open'
      ? 'Open façade — carcass visible (see Drawing 2 for full internals)'
      : w.doors === 'bifold'
        ? `${n} bifold shutter leaves`
        : `${n} hinged shutter leaves`

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}" preserveAspectRatio="xMidYMid meet" role="img">
  <title>${esc(w.name)} — exterior elevation shop drawing</title>
  <rect width="${VW}" height="${VH}" fill="#ffffff"/>
  <rect x="20" y="20" width="${VW - 40}" height="${VH - 40}" rx="8" fill="none" stroke="#c5d2cb" stroke-width="2"/>

  <text x="44" y="54" font-family="Georgia, 'Times New Roman', serif" font-size="26" fill="#152019">Exterior elevation</text>
  <text x="44" y="78" font-family="system-ui,sans-serif" font-size="15" fill="#5c6b62">${esc(w.name)}</text>
  <text x="44" y="98" font-family="system-ui,sans-serif" font-size="12" fill="#8a9690">SKU ${esc(w.sku)} · Front elevation · ${esc(doorLabel)}</text>
  <text x="44" y="116" font-family="system-ui,sans-serif" font-size="12" fill="#8a9690">${esc(w.finish)}</text>

  <rect x="${VW - 250}" y="36" width="206" height="90" rx="6" fill="#f7faf8" stroke="#c5d2cb"/>
  <text x="${VW - 238}" y="58" font-size="11" font-weight="700" fill="#152019">OVERALL (reference)</text>
  <text x="${VW - 238}" y="80" font-size="14" fill="#152019">W ${W}′ · H ${H}′ · D ${D}′</text>
  <text x="${VW - 238}" y="100" font-size="11" fill="#5c6b62">${Math.round(W * 304.8)} × ${Math.round(H * 304.8)} mm</text>
  <text x="${VW - 238}" y="116" font-size="11" fill="#5c6b62">Confirm on site measure</text>

  <rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" fill="#e8eeea" stroke="#3d5646" stroke-width="2.4"/>
  ${doors}

  <line x1="${frameX - 28}" y1="${frameY}" x2="${frameX + frameW + 28}" y2="${frameY}" stroke="#c5d2cb" stroke-dasharray="4 4"/>
  <text x="${frameX - 26}" y="${frameY - 8}" font-size="11" fill="#8a9690">ceiling line</text>
  <line x1="${frameX - 28}" y1="${frameY + frameH}" x2="${frameX + frameW + 28}" y2="${frameY + frameH}" stroke="#c5d2cb" stroke-dasharray="4 4"/>
  <text x="${frameX - 26}" y="${frameY + frameH + 16}" font-size="11" fill="#8a9690">finished floor</text>

  ${dimLine(frameX, frameY + frameH + 36, frameX + frameW, frameY + frameH + 36, `Overall width = ${W} ft (${Math.round(W * 304.8)} mm)`)}
  ${dimLine(frameX + frameW + 26, frameY, frameX + frameW + 26, frameY + frameH, `Height = ${H} ft (${Math.round(H * 304.8)} mm)`, { offset: 14 })}

  <g transform="translate(48, ${frameY + 50})">
    <polygon points="0,40 40,18 40,170 0,192" fill="#f3f6f4" stroke="#3d5646" stroke-width="1.2"/>
    <text x="48" y="100" font-size="12" fill="#5c6b62">Depth</text>
    <text x="48" y="118" font-size="13" font-weight="700" fill="#152019">D = ${D} ft</text>
    <text x="48" y="136" font-size="11" fill="#5c6b62">${Math.round(D * 304.8)} mm</text>
  </g>

  <rect x="40" y="${VH - 120}" width="${VW - 80}" height="80" rx="8" fill="#f7faf8" stroke="#c5d2cb"/>
  <text x="56" y="${VH - 94}" font-size="13" font-weight="700" fill="#152019">Notes</text>
  <text x="56" y="${VH - 74}" font-size="12" fill="#5c6b62">Drawing 1 — façade / shutters · Drawing 2 — full carcass internals (shelves, rods, drawers, shoes, LED) from carcass photo</text>
  <text x="56" y="${VH - 56}" font-size="12" fill="#5c6b62">Carcass: BWP plywood · both-side 1 mm laminate · 2 mm edge banding · 18 mm panels</text>
  <text x="56" y="${VH - 38}" font-size="12" fill="#5c6b62">Sizes are reference — live wall size confirmed before production · 10-year manufacturing warranty</text>
</svg>
`
}

for (const w of WARDROBES) {
  const dir = path.join(ROOT, w.folder)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'dim-elevation.svg'), elevationDrawing(w))
  fs.writeFileSync(path.join(dir, 'dim-carcass.svg'), carcassDrawing(w))
  console.log('detailed drawings →', w.folder, `(${w.bays.length} bays)`)
}
console.log('done')
