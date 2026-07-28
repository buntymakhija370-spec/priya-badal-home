/**
 * Detailed carcass + elevation shop drawings for Priyabadal temple products.
 * Run: node scripts/generateTempleDrawings.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve('public/products/temple')
const VW = 980
const VH = 1280

/** @typedef {{ kind: string, y?: number, h?: number, count?: number, cols?: number, label?: string }} Part */

/**
 * Temple units with carcass (doors-only TMP-03/04/08 skipped).
 * Zones are fractions of inner height (0 = top).
 */
const TEMPLES = [
  {
    folder: null,
    filePrefix: 'temple-01',
    name: 'Pink Lotus Arched Mandir',
    sku: 'PBH-TMP-01',
    finish: 'Ivory arched shutters · pink lotus handles · BWP carcass',
    doors: 'arched-hinged',
    doorCount: 2,
    ref: { w: 3, h: 7, d: 1.5 },
    parts: [
      { kind: 'shelf', y: 0.08, label: 'top shelf' },
      { kind: 'led', y: 0.12 },
      { kind: 'niche', y: 0.14, h: 0.42, label: 'deity niche · arched back' },
      { kind: 'altar', y: 0.56, tiers: 2, label: 'stepped altar' },
      { kind: 'drawer', y: 0.78, count: 1, label: 'base storage' },
    ],
  },
  {
    folder: null,
    filePrefix: 'temple-02',
    name: 'Lotus Branch Bifold Mandir',
    sku: 'PBH-TMP-02',
    finish: 'Iron metallic CNC shutters · geometric jali crown · BWP carcass',
    doors: 'bifold',
    doorCount: 2,
    ref: { w: 2.5, h: 8, d: 1.5 },
    parts: [
      { kind: 'crown', y: 0.02, label: 'jali crown' },
      { kind: 'led', y: 0.1 },
      { kind: 'niche', y: 0.12, h: 0.48, label: 'deity niche' },
      { kind: 'altar', y: 0.6, tiers: 1, label: 'altar shelf' },
      { kind: 'shelf', y: 0.72, label: 'offering shelf' },
      { kind: 'drawer', y: 0.82, count: 1 },
    ],
  },
  {
    folder: null,
    filePrefix: 'temple-05',
    name: 'Brushed Metal Scallop Mandir',
    sku: 'PBH-TMP-05',
    finish: 'Brushed metal scallop jali doors · flush drawer base',
    doors: 'scallop',
    doorCount: 2,
    ref: { w: 3, h: 7, d: 1.5 },
    parts: [
      { kind: 'led', y: 0.08 },
      { kind: 'niche', y: 0.1, h: 0.5, label: 'deity niche' },
      { kind: 'altar', y: 0.58, tiers: 1 },
      { kind: 'tray', y: 0.68, label: 'pull-out tray' },
      { kind: 'drawer', y: 0.78, count: 2, cols: 2 },
    ],
  },
  {
    folder: null,
    filePrefix: 'temple-06',
    name: 'Hex Jali Elephant Mandir',
    sku: 'PBH-TMP-06',
    finish: 'Hex-star jali · elephant relief · ceramic HDHMR · BWP carcass',
    doors: 'jali',
    doorCount: 2,
    ref: { w: 3, h: 8, d: 1.75 },
    parts: [
      { kind: 'loft', y: 0.02, h: 0.12, label: 'top loft' },
      { kind: 'led', y: 0.16 },
      { kind: 'niche', y: 0.16, h: 0.38, label: 'lit deity niche' },
      { kind: 'altar', y: 0.54, tiers: 2, label: 'stepped altar' },
      { kind: 'tray', y: 0.68, label: 'bhog tray' },
      { kind: 'drawer', y: 0.76, count: 2, cols: 2, label: '4 drawers' },
    ],
  },
  {
    folder: null,
    filePrefix: 'temple-07',
    name: 'Arch Lattice Marble Mandir',
    sku: 'PBH-TMP-07',
    finish: 'Arch lattice shutters · marble altar · BWP carcass',
    doors: 'lattice',
    doorCount: 2,
    ref: { w: 3.5, h: 8, d: 1.75 },
    parts: [
      { kind: 'led', y: 0.08 },
      { kind: 'niche', y: 0.1, h: 0.45, label: 'vaulted niche · stone back' },
      { kind: 'altar', y: 0.55, tiers: 2, label: 'marble altar' },
      { kind: 'open', y: 0.72, h: 0.2, label: 'open base bay' },
    ],
  },
  {
    folder: null,
    filePrefix: 'temple-09',
    name: 'Ginkgo Grid Arched Mandir',
    sku: 'PBH-TMP-09',
    finish: 'Wood-grain arched shutters · gold ginkgo grid · BWP carcass',
    doors: 'arched-hinged',
    doorCount: 2,
    ref: { w: 3, h: 7, d: 1.5 },
    parts: [
      { kind: 'led', y: 0.08 },
      { kind: 'niche', y: 0.1, h: 0.35, label: 'arched lit niche' },
      { kind: 'glass', y: 0.28, label: 'glass display shelf' },
      { kind: 'altar', y: 0.52, tiers: 1, label: 'marble altar' },
      { kind: 'cupboard', y: 0.7, h: 0.22, label: 'base cupboard' },
    ],
  },
  {
    folder: null,
    filePrefix: 'temple-10',
    name: 'Pixel Jali Bifold Mandir',
    sku: 'PBH-TMP-10',
    finish: 'Pixel-jali bifold shutters · ceramic · BWP carcass',
    doors: 'bifold',
    doorCount: 4,
    ref: { w: 3, h: 8, d: 1.5 },
    parts: [
      { kind: 'valence', y: 0.06, label: 'scalloped valence' },
      { kind: 'led', y: 0.1 },
      { kind: 'niche', y: 0.12, h: 0.5, label: 'deity niche' },
      { kind: 'altar', y: 0.62, tiers: 1, label: 'dark altar shelf' },
      { kind: 'cupboard', y: 0.76, h: 0.18, label: 'base storage' },
    ],
  },
  {
    folder: null,
    filePrefix: 'temple-11',
    name: 'Gold Lotus Relief Mandir',
    sku: 'PBH-TMP-11',
    finish: 'Lotus relief shutters · dark-wood lit multi-shelf interior',
    doors: 'relief',
    doorCount: 2,
    ref: { w: 3, h: 8, d: 1.75 },
    parts: [
      { kind: 'valence', y: 0.06, label: 'scalloped valence' },
      { kind: 'led', y: 0.1 },
      { kind: 'altar', y: 0.22, tiers: 2, label: 'stepped deity platforms' },
      { kind: 'shelf', y: 0.48, label: 'puja shelf' },
      { kind: 'shelf', y: 0.62 },
      { kind: 'cupboard', y: 0.76, h: 0.18, label: 'base' },
    ],
  },
  {
    folder: null,
    filePrefix: 'temple-12',
    name: 'Tree Relief Arch Jali Mandir',
    sku: 'PBH-TMP-12',
    finish: 'Arch-jali shutters · tree-of-life relief · drawer base',
    doors: 'jali',
    doorCount: 2,
    ref: { w: 3, h: 7.5, d: 1.75 },
    parts: [
      { kind: 'crown', y: 0.02, label: 'gold frieze' },
      { kind: 'niche', y: 0.1, h: 0.4, label: 'tree-of-life niche' },
      { kind: 'shelf', y: 0.3, label: 'side floating shelf' },
      { kind: 'altar', y: 0.52, tiers: 1, label: 'marble altar' },
      { kind: 'tray', y: 0.64, label: 'pull-out tray' },
      { kind: 'drawer', y: 0.74, count: 2, cols: 2 },
    ],
  },
  {
    folder: null,
    filePrefix: 'temple-13',
    name: 'Sunburst Jali Temple Doors',
    sku: 'PBH-TMP-13',
    finish: 'Sunburst jali shutters · backlit scalloped niche · BWP carcass',
    doors: 'jali',
    doorCount: 2,
    ref: { w: 3, h: 7.5, d: 1.5 },
    parts: [
      { kind: 'crown', y: 0.02, label: 'scroll crown' },
      { kind: 'led', y: 0.1 },
      { kind: 'niche', y: 0.12, h: 0.48, label: 'backlit scalloped niche' },
      { kind: 'altar', y: 0.6, tiers: 2, label: 'stepped stone altar' },
      { kind: 'cupboard', y: 0.8, h: 0.14, label: 'base' },
    ],
  },
  {
    folder: 'temple-wall/1',
    filePrefix: 'dim',
    name: 'Gold Lotus Arch Temple Wall',
    sku: 'PBH-TMP-W01',
    finish: 'Arched niche · sunburst lining · gold lotus · marble altar',
    doors: 'open',
    doorCount: 0,
    ref: { w: 6, h: 9, d: 1.5 },
    parts: [
      { kind: 'arch', y: 0.02, h: 0.7, label: 'arched niche' },
      { kind: 'led', y: 0.08 },
      { kind: 'motif', y: 0.28, label: 'gold lotus relief' },
      { kind: 'altar', y: 0.62, tiers: 2, label: 'tiered marble altar' },
      { kind: 'drawer', y: 0.82, count: 2, cols: 2 },
    ],
  },
  {
    folder: 'temple-wall/2',
    filePrefix: 'dim',
    name: 'Bevel Panel Prayer Wall',
    sku: 'PBH-TMP-W02',
    finish: 'Cream bevelled panel grid · low marble altar · base drawers',
    doors: 'open',
    doorCount: 0,
    ref: { w: 10, h: 9, d: 1.25 },
    parts: [
      { kind: 'panels', y: 0.04, h: 0.68, cols: 5, rows: 4, label: 'bevel panel grid' },
      { kind: 'altar', y: 0.68, tiers: 1, label: 'raised marble plinth' },
      { kind: 'drawer', y: 0.82, count: 1, cols: 2, label: '2 wide drawers' },
    ],
  },
  {
    folder: 'temple-wall/3',
    filePrefix: 'dim',
    name: 'Gold Leaf Motif Temple Wall',
    sku: 'PBH-TMP-W03',
    finish: 'Leaf-motif panels · backlit gold leaves · floating drawer base',
    doors: 'open',
    doorCount: 0,
    ref: { w: 8, h: 9, d: 1.5 },
    parts: [
      { kind: 'led', y: 0.06 },
      { kind: 'panels', y: 0.08, h: 0.5, cols: 3, rows: 3, label: 'leaf motif panels' },
      { kind: 'motif', y: 0.2, label: 'backlit gold leaf niches' },
      { kind: 'altar', y: 0.62, tiers: 1, label: 'marble altar shelf' },
      { kind: 'drawer', y: 0.78, count: 1, cols: 4, label: '4 drawers' },
    ],
  },
  {
    folder: 'temple-wall/4',
    filePrefix: 'dim',
    name: 'Fluted Flame Niche Mandir',
    sku: 'PBH-TMP-W04',
    finish: 'Fluted flame backdrop · frosted glass doors · drawer base',
    doors: 'arched-glass',
    doorCount: 2,
    ref: { w: 4, h: 8, d: 1.75 },
    parts: [
      { kind: 'arch', y: 0.04, h: 0.55, label: 'fluted flame niche' },
      { kind: 'led', y: 0.08 },
      { kind: 'altar', y: 0.58, tiers: 1, label: 'marble altar' },
      { kind: 'pedestal', y: 0.52, label: 'deity pedestal' },
      { kind: 'drawer', y: 0.76, count: 2, cols: 2 },
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
  for (let i = 0; i < w + h; i += 8) {
    const x1 = x + Math.max(0, i - h)
    const y1 = y + Math.min(h, i)
    const x2 = x + Math.min(w, i)
    const y2 = y + Math.max(0, i - w)
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#4f6a58" stroke-width="0.55" opacity="0.28"/>`
  }
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e4ebe6" stroke="#3d5646" stroke-width="1.4"/>${lines}`
}

function drawParts(parts, bx, by, bw, bh) {
  let out = ''
  for (const p of parts) {
    if (p.kind === 'shelf') {
      const y = by + p.y * bh
      out += `<rect x="${bx + 6}" y="${y - 4}" width="${bw - 12}" height="8" rx="1" fill="#cfd9d3" stroke="#3d5646" stroke-width="1.2"/>`
      if (p.label) out += `<text x="${bx + bw / 2}" y="${y - 8}" text-anchor="middle" font-size="10" fill="#5c6b62">${esc(p.label)}</text>`
    } else if (p.kind === 'led') {
      const y = by + p.y * bh
      out += `<rect x="${bx + 14}" y="${y}" width="${bw - 28}" height="4" rx="1" fill="#f0d9a0"/>`
      out += `<text x="${bx + bw - 12}" y="${y + 14}" text-anchor="end" font-size="9" fill="#9a7340">LED</text>`
    } else if (p.kind === 'niche' || p.kind === 'arch' || p.kind === 'open') {
      const y = by + p.y * bh
      const h = (p.h || 0.35) * bh
      const fill = p.kind === 'open' ? '#f7faf8' : '#f3f6f4'
      out += `<rect x="${bx + 10}" y="${y}" width="${bw - 20}" height="${h}" rx="4" fill="${fill}" stroke="#3d5646" stroke-width="1.4"/>`
      if (p.kind === 'arch' || (p.label && /arch/i.test(p.label))) {
        const cx = bx + bw / 2
        const r = (bw - 28) / 2
        out += `<path d="M${bx + 14} ${y + r} A${r} ${r} 0 0 1 ${bx + bw - 14} ${y + r}" fill="none" stroke="#9a7340" stroke-width="1.5"/>`
      }
      // deity hint
      out += `<ellipse cx="${bx + bw / 2}" cy="${y + h * 0.45}" rx="18" ry="28" fill="none" stroke="#8a9690" stroke-width="1.2" stroke-dasharray="3 3"/>`
      out += `<text x="${bx + bw / 2}" y="${y + 16}" text-anchor="middle" font-size="11" font-weight="600" fill="#5c6b62">${esc(p.label || 'niche')}</text>`
    } else if (p.kind === 'altar') {
      const y = by + p.y * bh
      const tiers = p.tiers || 1
      for (let t = 0; t < tiers; t++) {
        const inset = 10 + t * 14
        const ty = y + t * 16
        out += `<rect x="${bx + inset}" y="${ty}" width="${bw - inset * 2}" height="14" rx="2" fill="#eef1f0" stroke="#3d5646" stroke-width="1.2"/>`
      }
      out += `<text x="${bx + bw / 2}" y="${y - 6}" text-anchor="middle" font-size="10" font-weight="600" fill="#5c6b62">${esc(p.label || `${tiers}-tier altar`)}</text>`
    } else if (p.kind === 'drawer') {
      const count = p.count || 1
      const cols = p.cols || 1
      const start = by + p.y * bh
      const each = Math.min(38, (bh * 0.22) / count)
      const cellW = (bw - 16) / cols
      for (let c = 0; c < cols; c++) {
        for (let i = 0; i < count; i++) {
          // when label says 4 drawers with count 2 cols 2, draw count rows × cols
          const y = start + i * each
          const x = bx + 8 + c * cellW
          out += `<rect x="${x}" y="${y}" width="${cellW - 4}" height="${each - 4}" rx="2" fill="#f7faf8" stroke="#3d5646" stroke-width="1.2"/>`
          out += `<circle cx="${x + cellW / 2 - 2}" cy="${y + (each - 4) / 2}" r="3" fill="#152019"/>`
        }
      }
      out += `<text x="${bx + bw / 2}" y="${start - 5}" text-anchor="middle" font-size="10" font-weight="600" fill="#5c6b62">${esc(p.label || `${count * cols} drawer${count * cols > 1 ? 's' : ''}`)}</text>`
    } else if (p.kind === 'tray') {
      const y = by + p.y * bh
      out += `<rect x="${bx + 10}" y="${y}" width="${bw - 20}" height="22" rx="2" fill="#eef3f0" stroke="#3d5646" stroke-width="1.2"/>`
      out += `<line x1="${bx + 18}" y1="${y + 11}" x2="${bx + bw - 18}" y2="${y + 11}" stroke="#9a7340" stroke-width="1.5" stroke-dasharray="4 3"/>`
      out += `<text x="${bx + bw / 2}" y="${y - 5}" text-anchor="middle" font-size="10" font-weight="600" fill="#5c6b62">${esc(p.label || 'pull-out tray')}</text>`
    } else if (p.kind === 'loft') {
      const y = by + (p.y || 0) * bh
      const h = (p.h || 0.12) * bh
      out += `<rect x="${bx + 8}" y="${y}" width="${bw - 16}" height="${h}" rx="2" fill="#f4f1ea" stroke="#3d5646" stroke-width="1.3"/>`
      out += `<line x1="${bx + bw / 2}" y1="${y + 8}" x2="${bx + bw / 2}" y2="${y + h - 8}" stroke="#152019" stroke-width="2"/>`
      out += `<text x="${bx + bw / 2}" y="${y - 5}" text-anchor="middle" font-size="10" font-weight="600" fill="#5c6b62">${esc(p.label || 'loft')}</text>`
    } else if (p.kind === 'cupboard') {
      const y = by + p.y * bh
      const h = (p.h || 0.18) * bh
      out += `<rect x="${bx + 8}" y="${y}" width="${bw - 16}" height="${h}" rx="2" fill="#f7faf8" stroke="#3d5646" stroke-width="1.3"/>`
      out += `<line x1="${bx + bw / 2}" y1="${y + 4}" x2="${bx + bw / 2}" y2="${y + h - 4}" stroke="#c5d2cb"/>`
      out += `<circle cx="${bx + bw / 2 - 18}" cy="${y + h / 2}" r="3" fill="#152019"/>`
      out += `<circle cx="${bx + bw / 2 + 18}" cy="${y + h / 2}" r="3" fill="#152019"/>`
      out += `<text x="${bx + bw / 2}" y="${y - 5}" text-anchor="middle" font-size="10" font-weight="600" fill="#5c6b62">${esc(p.label || 'base cupboard')}</text>`
    } else if (p.kind === 'glass') {
      const y = by + p.y * bh
      out += `<rect x="${bx + 16}" y="${y - 3}" width="${bw - 32}" height="6" rx="1" fill="#d5e4eb" stroke="#8aa0aa" stroke-width="1"/>`
      out += `<text x="${bx + bw / 2}" y="${y - 8}" text-anchor="middle" font-size="10" fill="#5c6b62">${esc(p.label || 'glass shelf')}</text>`
    } else if (p.kind === 'crown' || p.kind === 'valence') {
      const y = by + p.y * bh
      out += `<path d="M${bx + 8} ${y + 18} Q${bx + bw / 2} ${y - 6} ${bx + bw - 8} ${y + 18}" fill="#e8eeea" stroke="#3d5646" stroke-width="1.4"/>`
      out += `<text x="${bx + bw / 2}" y="${y + 32}" text-anchor="middle" font-size="10" font-weight="600" fill="#5c6b62">${esc(p.label || p.kind)}</text>`
    } else if (p.kind === 'motif') {
      const y = by + p.y * bh
      out += `<circle cx="${bx + bw / 2}" cy="${y + 40}" r="36" fill="#f7f1e4" stroke="#9a7340" stroke-width="1.5"/>`
      out += `<circle cx="${bx + bw / 2}" cy="${y + 40}" r="18" fill="none" stroke="#c4a574" stroke-width="2"/>`
      out += `<text x="${bx + bw / 2}" y="${y + 90}" text-anchor="middle" font-size="10" font-weight="600" fill="#5c6b62">${esc(p.label || 'motif')}</text>`
    } else if (p.kind === 'pedestal') {
      const y = by + p.y * bh
      out += `<rect x="${bx + bw / 2 - 28}" y="${y}" width="56" height="28" rx="2" fill="#eef1f0" stroke="#3d5646"/>`
      out += `<text x="${bx + bw / 2}" y="${y - 5}" text-anchor="middle" font-size="9" fill="#5c6b62">${esc(p.label || 'pedestal')}</text>`
    } else if (p.kind === 'panels') {
      const y = by + p.y * bh
      const h = (p.h || 0.5) * bh
      const cols = p.cols || 3
      const rows = p.rows || 3
      const cw = (bw - 16) / cols
      const rh = h / rows
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          out += `<rect x="${bx + 8 + c * cw + 2}" y="${y + r * rh + 2}" width="${cw - 6}" height="${rh - 6}" fill="#f7f4ec" stroke="#3d5646" stroke-width="1"/>`
          out += `<rect x="${bx + 8 + c * cw + 8}" y="${y + r * rh + 8}" width="${cw - 18}" height="${rh - 18}" fill="none" stroke="#c5d2cb" stroke-width="1"/>`
        }
      }
      out += `<text x="${bx + bw / 2}" y="${y - 6}" text-anchor="middle" font-size="10" font-weight="600" fill="#5c6b62">${esc(p.label || 'wall panels')}</text>`
    }
  }
  return out
}

function carcassDrawing(t) {
  const { w: W, h: H, d: D } = t.ref
  const frameX = 120
  const frameY = 170
  const frameW = 520
  const frameH = 780
  const gable = 16
  const top = 20
  const bottom = 28
  const innerX = frameX + gable
  const innerY = frameY + top
  const innerW = frameW - gable * 2
  const innerH = frameH - top - bottom

  const structure = `
    ${hatchPanel(frameX, frameY, frameW, top)}
    ${hatchPanel(frameX, frameY + frameH - bottom, frameW, bottom)}
    ${hatchPanel(frameX, frameY, gable, frameH)}
    ${hatchPanel(frameX + frameW - gable, frameY, gable, frameH)}
    <text x="${frameX + frameW / 2}" y="${frameY + 14}" text-anchor="middle" font-size="10" fill="#3d5646">TOP RAIL · 18 mm BWP</text>
    <text x="${frameX + frameW / 2}" y="${frameY + frameH - 10}" text-anchor="middle" font-size="10" fill="#3d5646">BOTTOM / PLINTH · 18 mm BWP</text>
  `

  const zones = `
    <rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" fill="#fbfcfb" stroke="#3d5646" stroke-width="1.4"/>
    ${drawParts(t.parts, innerX, innerY, innerW, innerH)}
  `

  const schedule = t.parts
    .map((p, i) => {
      const label = p.label || p.kind
      return `<text x="0" y="${i * 16}" font-size="11" fill="#5c6b62"><tspan font-weight="700" fill="#152019">${i + 1}.</tspan>  ${esc(label)}</text>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}" preserveAspectRatio="xMidYMid meet" role="img">
  <title>${esc(t.name)} — detailed carcass shop drawing</title>
  <rect width="${VW}" height="${VH}" fill="#ffffff"/>
  <rect x="20" y="20" width="${VW - 40}" height="${VH - 40}" rx="8" fill="none" stroke="#c5d2cb" stroke-width="2"/>

  <text x="44" y="54" font-family="Georgia, 'Times New Roman', serif" font-size="26" fill="#152019">Temple carcass shop drawing</text>
  <text x="44" y="78" font-family="system-ui,sans-serif" font-size="15" fill="#5c6b62">${esc(t.name)}</text>
  <text x="44" y="98" font-family="system-ui,sans-serif" font-size="12" fill="#8a9690">SKU ${esc(t.sku)} · Open carcass elevation · Made to measure</text>
  <text x="44" y="116" font-family="system-ui,sans-serif" font-size="12" fill="#8a9690">${esc(t.finish)}</text>

  <rect x="${VW - 250}" y="36" width="206" height="90" rx="6" fill="#f7faf8" stroke="#c5d2cb"/>
  <text x="${VW - 238}" y="58" font-size="11" font-weight="700" fill="#152019">OVERALL (reference)</text>
  <text x="${VW - 238}" y="80" font-size="14" fill="#152019">W ${W}′ · H ${H}′ · D ${D}′</text>
  <text x="${VW - 238}" y="100" font-size="11" fill="#5c6b62">${Math.round(W * 304.8)} × ${Math.round(H * 304.8)} mm</text>
  <text x="${VW - 238}" y="116" font-size="11" fill="#5c6b62">18 mm BWP carcass</text>

  ${structure}
  ${zones}

  ${dimLine(frameX, frameY + frameH + 18, frameX + frameW, frameY + frameH + 18, `Overall W = ${W} ft (${Math.round(W * 304.8)} mm)`)}
  ${dimLine(frameX + frameW + 22, frameY, frameX + frameW + 22, frameY + frameH, `H = ${H} ft (${Math.round(H * 304.8)} mm)`, { offset: 14 })}

  <g transform="translate(700, 180)">
    <text x="0" y="0" font-size="13" font-weight="700" fill="#152019">Zone schedule</text>
    ${schedule}
    <text x="0" y="${t.parts.length * 16 + 28}" font-size="11" fill="#5c6b62">Depth D = ${D} ft (${Math.round(D * 304.8)} mm)</text>
    <text x="0" y="${t.parts.length * 16 + 52}" font-size="11" font-weight="700" fill="#152019">Hardware</text>
    <text x="0" y="${t.parts.length * 16 + 68}" font-size="11" fill="#5c6b62">Soft-close slides / hinges</text>
    <text x="0" y="${t.parts.length * 16 + 84}" font-size="11" fill="#5c6b62">LED drivers as designed</text>
  </g>

  <g transform="translate(64, ${frameY + frameH + 55})">
    <text x="0" y="0" font-size="13" font-weight="700" fill="#152019">Symbol legend</text>
    <rect x="0" y="12" width="26" height="14" fill="#f3f6f4" stroke="#3d5646"/>
    <text x="32" y="23" font-size="11" fill="#5c6b62">Deity niche / open bay</text>
    <rect x="200" y="12" width="26" height="14" fill="#eef1f0" stroke="#3d5646"/>
    <text x="232" y="23" font-size="11" fill="#5c6b62">Altar / pedestal</text>
    <rect x="380" y="12" width="26" height="14" fill="#f7faf8" stroke="#3d5646"/>
    <text x="412" y="23" font-size="11" fill="#5c6b62">Drawer / cupboard</text>
    <rect x="560" y="12" width="26" height="3" fill="#f0d9a0"/>
    <text x="592" y="18" font-size="11" fill="#5c6b62">LED</text>
  </g>

  <rect x="40" y="${VH - 120}" width="${VW - 80}" height="80" rx="8" fill="#fff9f0" stroke="#9a7340"/>
  <text x="56" y="${VH - 94}" font-size="13" font-weight="700" fill="#152019">Carcass construction (Priyabadal standard)</text>
  <text x="56" y="${VH - 74}" font-size="12" fill="#5c6b62">Core: BWP plywood 18 mm · Surfaces: 1 mm laminate both sides · Edges: 2 mm edge banding on all exposed edges</text>
  <text x="56" y="${VH - 56}" font-size="12" fill="#5c6b62">Altar, shelves, drawers &amp; niche as drawn from product photos · Sizes scale to live niche / wall measure</text>
  <text x="56" y="${VH - 38}" font-size="12" fill="#5c6b62">Assembly: /guides/carcass-assembly · Confirm layout on WhatsApp before production · 10-year warranty</text>
</svg>
`
}

function elevationDrawing(t) {
  const { w: W, h: H, d: D } = t.ref
  const frameX = 180
  const frameY = 170
  const frameW = 420
  const frameH = 780
  const n = Math.max(t.doorCount || 1, 1)
  const doorW = frameW / n
  let doors = ''

  if (t.doors === 'open') {
    doors += `<rect x="${frameX + 4}" y="${frameY + 4}" width="${frameW - 8}" height="${frameH - 8}" fill="#f3f6f4" stroke="#4f6a58" stroke-width="1.2" stroke-dasharray="5 4"/>`
    doors += drawParts(t.parts, frameX + 8, frameY + 8, frameW - 16, frameH - 16)
    doors += `<text x="${frameX + frameW / 2}" y="${frameY + frameH - 18}" text-anchor="middle" font-size="11" fill="#8a9690">OPEN FAÇADE</text>`
  } else {
    for (let i = 0; i < n; i++) {
      const x = frameX + i * doorW
      const arched = t.doors.includes('arch') || t.doors === 'scallop'
      if (arched) {
        doors += `<path d="M${x + 6} ${frameY + frameH - 10} V${frameY + 70} Q${x + doorW / 2} ${frameY + 8} ${x + doorW - 6} ${frameY + 70} V${frameY + frameH - 10} Z" fill="#f4f1ea" stroke="#3d5646" stroke-width="1.6"/>`
      } else {
        doors += `<rect x="${x + 5}" y="${frameY + 10}" width="${doorW - 10}" height="${frameH - 20}" rx="3" fill="#f4f1ea" stroke="#3d5646" stroke-width="1.6"/>`
      }
      if (t.doors === 'jali' || t.doors === 'lattice' || t.doors === 'bifold') {
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 2; c++) {
            const px = x + 16 + c * ((doorW - 32) / 2)
            const py = frameY + 40 + r * ((frameH - 80) / 5)
            doors += `<rect x="${px}" y="${py}" width="${(doorW - 40) / 2}" height="${(frameH - 100) / 5}" fill="none" stroke="#9a7340" stroke-width="0.9"/>`
          }
        }
      } else if (t.doors === 'relief') {
        doors += `<circle cx="${x + doorW / 2}" cy="${frameY + frameH * 0.35}" r="${doorW * 0.22}" fill="none" stroke="#c4a574" stroke-width="2"/>`
        doors += `<circle cx="${x + doorW / 2}" cy="${frameY + frameH * 0.35}" r="${doorW * 0.12}" fill="none" stroke="#9a7340" stroke-width="1.2"/>`
      } else if (t.doors === 'arched-glass') {
        doors += `<rect x="${x + 14}" y="${frameY + 80}" width="${doorW - 28}" height="${frameH * 0.55}" fill="#e8f0f4" stroke="#8aa0aa" stroke-width="1" opacity="0.85"/>`
      } else {
        doors += `<rect x="${x + 14}" y="${frameY + 50}" width="${doorW - 28}" height="${frameH * 0.55}" fill="none" stroke="#9a7340" stroke-width="1.1"/>`
      }
      if (t.doors !== 'bifold' && t.doors !== 'open') {
        doors += `<circle cx="${x + doorW * 0.72}" cy="${frameY + frameH * 0.48}" r="3.5" fill="#152019"/>`
      }
    }
  }

  const doorLabel =
    t.doors === 'open'
      ? 'Open temple-wall façade — see Drawing 2 for carcass zones'
      : `${n} ${t.doors.replace(/-/g, ' ')} shutter leaf${n > 1 ? 's' : ''}`

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}" preserveAspectRatio="xMidYMid meet" role="img">
  <title>${esc(t.name)} — exterior elevation shop drawing</title>
  <rect width="${VW}" height="${VH}" fill="#ffffff"/>
  <rect x="20" y="20" width="${VW - 40}" height="${VH - 40}" rx="8" fill="none" stroke="#c5d2cb" stroke-width="2"/>

  <text x="44" y="54" font-family="Georgia, 'Times New Roman', serif" font-size="26" fill="#152019">Temple exterior elevation</text>
  <text x="44" y="78" font-family="system-ui,sans-serif" font-size="15" fill="#5c6b62">${esc(t.name)}</text>
  <text x="44" y="98" font-family="system-ui,sans-serif" font-size="12" fill="#8a9690">SKU ${esc(t.sku)} · Front elevation · ${esc(doorLabel)}</text>
  <text x="44" y="116" font-family="system-ui,sans-serif" font-size="12" fill="#8a9690">${esc(t.finish)}</text>

  <rect x="${VW - 250}" y="36" width="206" height="90" rx="6" fill="#f7faf8" stroke="#c5d2cb"/>
  <text x="${VW - 238}" y="58" font-size="11" font-weight="700" fill="#152019">OVERALL (reference)</text>
  <text x="${VW - 238}" y="80" font-size="14" fill="#152019">W ${W}′ · H ${H}′ · D ${D}′</text>
  <text x="${VW - 238}" y="100" font-size="11" fill="#5c6b62">${Math.round(W * 304.8)} × ${Math.round(H * 304.8)} mm</text>
  <text x="${VW - 238}" y="116" font-size="11" fill="#5c6b62">Confirm on site measure</text>

  <rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" fill="#e8eeea" stroke="#3d5646" stroke-width="2.3"/>
  ${doors}

  ${dimLine(frameX, frameY + frameH + 36, frameX + frameW, frameY + frameH + 36, `Overall width = ${W} ft (${Math.round(W * 304.8)} mm)`)}
  ${dimLine(frameX + frameW + 26, frameY, frameX + frameW + 26, frameY + frameH, `Height = ${H} ft (${Math.round(H * 304.8)} mm)`, { offset: 14 })}

  <g transform="translate(48, ${frameY + 60})">
    <polygon points="0,40 40,18 40,170 0,192" fill="#f3f6f4" stroke="#3d5646" stroke-width="1.2"/>
    <text x="48" y="100" font-size="12" fill="#5c6b62">Depth</text>
    <text x="48" y="118" font-size="13" font-weight="700" fill="#152019">D = ${D} ft</text>
  </g>

  <rect x="40" y="${VH - 120}" width="${VW - 80}" height="80" rx="8" fill="#f7faf8" stroke="#c5d2cb"/>
  <text x="56" y="${VH - 94}" font-size="13" font-weight="700" fill="#152019">Notes</text>
  <text x="56" y="${VH - 74}" font-size="12" fill="#5c6b62">Drawing 1 — façade / shutters · Drawing 2 — full carcass (niche, altar, drawers, LED) from product photos</text>
  <text x="56" y="${VH - 56}" font-size="12" fill="#5c6b62">Carcass: BWP plywood · both-side 1 mm laminate · 2 mm edge banding · 18 mm panels</text>
  <text x="56" y="${VH - 38}" font-size="12" fill="#5c6b62">Sizes are reference — live niche size confirmed before production · 10-year manufacturing warranty</text>
</svg>
`
}

for (const t of TEMPLES) {
  const dir = t.folder ? path.join(ROOT, t.folder) : ROOT
  fs.mkdirSync(dir, { recursive: true })
  const elevName = t.folder ? 'dim-elevation.svg' : `${t.filePrefix}-dim-elevation.svg`
  const carcName = t.folder ? 'dim-carcass.svg' : `${t.filePrefix}-dim-carcass.svg`
  fs.writeFileSync(path.join(dir, elevName), elevationDrawing(t))
  fs.writeFileSync(path.join(dir, carcName), carcassDrawing(t))
  console.log('temple drawings →', t.sku, elevName, carcName)
}
console.log('done', TEMPLES.length)
