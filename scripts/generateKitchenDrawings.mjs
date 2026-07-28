/**
 * Kitchen carcass + elevation shop drawings for Drive kitchen set.
 * Run: node scripts/generateKitchenDrawings.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve('public/products/kitchen')
const VW = 1100
const VH = 1280

const KITCHENS = [
  { folder: 'kitchen-1', name: 'Taupe Reeded Shaker Kitchen', sku: 'PBH-KIT-01', finish: 'Matte warm taupe · reeded panels · silver cup pulls', ref: { w: 12, h: 9, d: 2 }, openBay: 2 },
  { folder: 'kitchen-2', name: 'Mushroom Raised Panel Kitchen', sku: 'PBH-KIT-02', finish: 'Matte mushroom taupe · raised panels · brass hardware', ref: { w: 14, h: 9, d: 2.5 }, openBay: 1, island: true },
  { folder: 'kitchen-3', name: 'Ivory Arch Panel Kitchen', sku: 'PBH-KIT-03', finish: 'Matte ivory cream · arched-recess doors · brass knobs', ref: { w: 12, h: 9, d: 2 }, openBay: 1 },
  { folder: 'kitchen-4', name: 'Taupe Capsule Panel Kitchen', sku: 'PBH-KIT-04', finish: 'Matte warm taupe · pill-shaped recessed panels', ref: { w: 10, h: 9, d: 2 }, openBay: 2 },
  { folder: 'kitchen-5', name: 'Sand Shaker Island Kitchen', sku: 'PBH-KIT-05', finish: 'Matte sand taupe · shaker · finger pulls', ref: { w: 14, h: 9, d: 2.5 }, openBay: 1, island: true },
  { folder: 'kitchen-6', name: 'Light Grey Lattice Kitchen', sku: 'PBH-KIT-06', finish: 'Matte light grey · lattice cutout uppers · light oak carcass', ref: { w: 10, h: 9, d: 2 }, openBay: 1, lattice: true },
  { folder: 'kitchen-7', name: 'Grey Lattice Island Kitchen', sku: 'PBH-KIT-07', finish: 'Matte light grey · nested lattice · marble island', ref: { w: 14, h: 9, d: 2.5 }, openBay: 2, island: true, lattice: true },
  { folder: 'kitchen-8', name: 'Taupe Notch Frame Kitchen', sku: 'PBH-KIT-08', finish: 'Matte taupe · notched rectangular routing · dark cup pulls', ref: { w: 12, h: 9, d: 2 }, openBay: 1 },
  { folder: 'kitchen-9', name: 'Terracotta Flat Island Kitchen', sku: 'PBH-KIT-09', finish: 'Matte terracotta · flat panel · J-pulls', ref: { w: 14, h: 9, d: 2.5 }, openBay: 1, island: true },
  { folder: 'kitchen-10', name: 'Arch-Pull Taupe Kitchen', sku: 'PBH-KIT-10', finish: 'Matte taupe greige · pill-arch recessed pulls · light oak interior', ref: { w: 12, h: 9, d: 2 }, openBay: 2 },
  { folder: 'kitchen-11', name: 'Oval-Recess Taupe Kitchen', sku: 'PBH-KIT-11', finish: 'Matte taupe greige · elongated oval recessed grips', ref: { w: 10, h: 9, d: 2 }, openBay: 1 },
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

function hatch(x, y, w, h) {
  let lines = ''
  for (let i = 0; i < w + h; i += 8) {
    const x1 = x + Math.max(0, i - h)
    const y1 = y + Math.min(h, i)
    const x2 = x + Math.min(w, i)
    const y2 = y + Math.max(0, i - w)
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#4f6a58" stroke-width="0.55" opacity="0.25"/>`
  }
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e4ebe6" stroke="#3d5646" stroke-width="1.3"/>${lines}`
}

function doorFace(x, y, w, h, k) {
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#e8ebe9" stroke="#3d5646" stroke-width="1.3"/>`
  if (k.lattice) {
    const cx = x + w / 2
    const cy = y + h / 2
    out += `<rect x="${x + 6}" y="${y + 8}" width="${w - 12}" height="${h - 16}" fill="#dfe4e1" stroke="#9a7340" stroke-width="1"/>`
    out += `<path d="M${cx} ${y + 16} Q${x + 12} ${cy} ${cx} ${y + h - 16} Q${x + w - 12} ${cy} ${cx} ${y + 16}" fill="none" stroke="#5c6b62" stroke-width="1.3"/>`
  } else {
    out += `<rect x="${x + 8}" y="${y + 10}" width="${w - 16}" height="${h - 20}" fill="none" stroke="#9a7340" stroke-width="1"/>`
  }
  return out
}

function openCarcass(x, y, w, h) {
  let out = hatch(x, y, w, h)
  out += `<rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" fill="#f4ebe0" stroke="#3d5646" stroke-width="1.2"/>`
  out += `<rect x="${x + 10}" y="${y + h * 0.33 - 4}" width="${w - 20}" height="8" fill="#e0d2c0" stroke="#3d5646"/>`
  out += `<rect x="${x + 10}" y="${y + h * 0.66 - 4}" width="${w - 20}" height="8" fill="#e0d2c0" stroke="#3d5646"/>`
  out += `<text x="${x + w / 2}" y="${y + 18}" text-anchor="middle" font-size="10" font-weight="700" fill="#152019">OPEN</text>`
  out += `<text x="${x + w / 2}" y="${y + h - 8}" text-anchor="middle" font-size="9" fill="#5c6b62">2 shelves</text>`
  return out
}

function carcassDrawing(k) {
  const { w: W, h: H, d: D } = k.ref
  const fx = 70
  const fy = 150
  const fw = 740
  const fh = 820
  const tallW = 80
  const midX = fx + tallW
  const midW = fw - tallW * 2
  const loftH = 80
  const wallH = 260
  const wallY = fy + loftH + 18
  const counterY = fy + 470
  const openIdx = Math.min(Math.max((k.openBay || 1) - 1, 0), 3)

  let svg = ''
  svg += `<rect x="${fx}" y="${fy}" width="${tallW}" height="${fh - 16}" fill="#f3f6f4" stroke="#3d5646" stroke-width="1.4"/>`
  svg += `<rect x="${fx + fw - tallW}" y="${fy}" width="${tallW}" height="${fh - 16}" fill="#f3f6f4" stroke="#3d5646" stroke-width="1.4"/>`
  svg += `<text x="${fx + tallW / 2}" y="${fy + fh / 2}" text-anchor="middle" font-size="10" fill="#5c6b62" transform="rotate(-90 ${fx + tallW / 2} ${fy + fh / 2})">Tall L</text>`
  svg += `<text x="${fx + fw - tallW / 2}" y="${fy + fh / 2}" text-anchor="middle" font-size="10" fill="#5c6b62" transform="rotate(90 ${fx + fw - tallW / 2} ${fy + fh / 2})">Tall R</text>`

  const loftW = midW / 4
  for (let i = 0; i < 4; i++) svg += doorFace(midX + i * loftW + 2, fy + 6, loftW - 4, loftH - 8, k)
  svg += `<text x="${midX + midW / 2}" y="${fy - 6}" text-anchor="middle" font-size="12" font-weight="700" fill="#152019">Loft / top cabinets</text>`

  const wallW = midW / 4
  for (let i = 0; i < 4; i++) {
    const x = midX + i * wallW
    svg += i === openIdx ? openCarcass(x + 2, wallY, wallW - 4, wallH) : doorFace(x + 2, wallY, wallW - 4, wallH, k)
  }
  svg += `<text x="${midX + midW / 2}" y="${wallY - 8}" text-anchor="middle" font-size="12" font-weight="700" fill="#152019">Wall cabinets</text>`
  svg += `<rect x="${midX + 8}" y="${wallY + wallH + 4}" width="${midW - 16}" height="4" rx="1" fill="#f0d9a0"/>`
  svg += `<text x="${midX + midW - 8}" y="${wallY + wallH + 20}" text-anchor="end" font-size="10" fill="#9a7340">under-cabinet LED</text>`

  svg += `<rect x="${midX}" y="${wallY + wallH + 24}" width="${midW}" height="${counterY - (wallY + wallH + 24)}" fill="#f0f2f1" stroke="#c5d2cb"/>`
  svg += `<rect x="${midX}" y="${counterY}" width="${midW}" height="20" fill="#eef1f0" stroke="#3d5646"/>`
  svg += `<text x="${midX + midW / 2}" y="${counterY + 14}" text-anchor="middle" font-size="11" font-weight="600" fill="#152019">counter</text>`

  const baseY = counterY + 36
  const baseH = fy + fh - 40 - baseY
  const baseW = midW / 4
  for (let i = 0; i < 4; i++) svg += doorFace(midX + i * baseW + 2, baseY, baseW - 4, baseH, k)
  svg += `<text x="${midX + midW / 2}" y="${baseY - 8}" text-anchor="middle" font-size="12" font-weight="700" fill="#152019">Base cabinets</text>`
  svg += hatch(midX, fy + fh - 28, midW, 16)

  if (k.island) {
    svg += `<rect x="${fx + fw + 30}" y="${counterY - 40}" width="160" height="220" rx="4" fill="#f3f6f4" stroke="#3d5646" stroke-width="1.4"/>`
    svg += `<rect x="${fx + fw + 38}" y="${counterY - 40}" width="144" height="18" fill="#eef1f0" stroke="#3d5646"/>`
    svg += `<text x="${fx + fw + 110}" y="${counterY + 80}" text-anchor="middle" font-size="11" font-weight="700" fill="#152019">ISLAND</text>`
    svg += doorFace(fx + fw + 42, counterY - 10, 136, 160, k)
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}" preserveAspectRatio="xMidYMid meet" role="img">
  <title>${esc(k.name)} — kitchen carcass shop drawing</title>
  <rect width="${VW}" height="${VH}" fill="#ffffff"/>
  <rect x="20" y="20" width="${VW - 40}" height="${VH - 40}" rx="8" fill="none" stroke="#c5d2cb" stroke-width="2"/>
  <text x="44" y="54" font-family="Georgia, 'Times New Roman', serif" font-size="26" fill="#152019">Kitchen carcass shop drawing</text>
  <text x="44" y="78" font-family="system-ui,sans-serif" font-size="15" fill="#5c6b62">${esc(k.name)}</text>
  <text x="44" y="98" font-family="system-ui,sans-serif" font-size="12" fill="#8a9690">SKU ${esc(k.sku)} · Open wall bay + full run · Made to measure</text>
  <text x="44" y="116" font-family="system-ui,sans-serif" font-size="12" fill="#8a9690">${esc(k.finish)}</text>
  <rect x="${VW - 250}" y="36" width="206" height="90" rx="6" fill="#f7faf8" stroke="#c5d2cb"/>
  <text x="${VW - 238}" y="58" font-size="11" font-weight="700" fill="#152019">OVERALL (reference)</text>
  <text x="${VW - 238}" y="80" font-size="14" fill="#152019">W ${W}′ · H ${H}′ · D ${D}′</text>
  <text x="${VW - 238}" y="100" font-size="11" fill="#5c6b62">18 mm BWP carcass</text>
  <text x="${VW - 238}" y="116" font-size="11" fill="#5c6b62">${k.island ? 'Includes island' : 'Straight / L run'}</text>
  ${svg}
  ${dimLine(fx, fy + fh + 8, fx + fw, fy + fh + 8, `Overall W = ${W} ft (${Math.round(W * 304.8)} mm)`)}
  ${dimLine(fx + fw + 16, fy, fx + fw + 16, fy + fh - 16, `H = ${H} ft`, { offset: 14 })}
  <rect x="40" y="${VH - 120}" width="${VW - 80}" height="80" rx="8" fill="#fff9f0" stroke="#9a7340"/>
  <text x="56" y="${VH - 94}" font-size="13" font-weight="700" fill="#152019">Carcass construction (Priyabadal standard)</text>
  <text x="56" y="${VH - 74}" font-size="12" fill="#5c6b62">Core: BWP plywood 18 mm · Surfaces: 1 mm laminate both sides · Edges: 2 mm edge banding</text>
  <text x="56" y="${VH - 56}" font-size="12" fill="#5c6b62">Open wall bay as photographed — 2 fixed shelves / 3 levels · Layout scales to live wall</text>
  <text x="56" y="${VH - 38}" font-size="12" fill="#5c6b62">Assembly: /guides/carcass-assembly · Confirm plan on WhatsApp · 10-year warranty</text>
</svg>
`
}

function elevationDrawing(k) {
  const { w: W, h: H, d: D } = k.ref
  const fx = 120
  const fy = 150
  const fw = 700
  const fh = 820
  const tallW = 75
  const midX = fx + tallW
  const midW = fw - tallW * 2
  const loftH = 75
  const wallH = 250
  const wallY = fy + loftH + 14
  const counterY = fy + 450

  let doors = ''
  doors += `<rect x="${fx}" y="${fy}" width="${tallW}" height="${fh - 14}" fill="#e8ebe9" stroke="#3d5646"/>`
  doors += `<rect x="${fx + fw - tallW}" y="${fy}" width="${tallW}" height="${fh - 14}" fill="#e8ebe9" stroke="#3d5646"/>`
  const loftW = midW / 4
  for (let i = 0; i < 4; i++) doors += doorFace(midX + i * loftW + 2, fy + 6, loftW - 4, loftH - 8, k)
  const wallW = midW / 4
  for (let i = 0; i < 4; i++) doors += doorFace(midX + i * wallW + 2, wallY, wallW - 4, wallH, k)
  doors += `<rect x="${midX + 6}" y="${wallY + wallH + 3}" width="${midW - 12}" height="3" fill="#f0d9a0"/>`
  doors += `<rect x="${midX}" y="${counterY}" width="${midW}" height="18" fill="#eef1f0" stroke="#3d5646"/>`
  const baseY = counterY + 26
  const baseH = fy + fh - 28 - baseY
  const baseW = midW / 4
  for (let i = 0; i < 4; i++) doors += doorFace(midX + i * baseW + 2, baseY, baseW - 4, baseH, k)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}" preserveAspectRatio="xMidYMid meet" role="img">
  <title>${esc(k.name)} — kitchen exterior elevation</title>
  <rect width="${VW}" height="${VH}" fill="#ffffff"/>
  <rect x="20" y="20" width="${VW - 40}" height="${VH - 40}" rx="8" fill="none" stroke="#c5d2cb" stroke-width="2"/>
  <text x="44" y="54" font-family="Georgia, 'Times New Roman', serif" font-size="26" fill="#152019">Kitchen exterior elevation</text>
  <text x="44" y="78" font-family="system-ui,sans-serif" font-size="15" fill="#5c6b62">${esc(k.name)}</text>
  <text x="44" y="98" font-family="system-ui,sans-serif" font-size="12" fill="#8a9690">SKU ${esc(k.sku)} · Front elevation${k.island ? ' · island option' : ''}</text>
  <text x="44" y="116" font-family="system-ui,sans-serif" font-size="12" fill="#8a9690">${esc(k.finish)}</text>
  <rect x="${VW - 250}" y="36" width="206" height="90" rx="6" fill="#f7faf8" stroke="#c5d2cb"/>
  <text x="${VW - 238}" y="58" font-size="11" font-weight="700" fill="#152019">OVERALL (reference)</text>
  <text x="${VW - 238}" y="80" font-size="14" fill="#152019">W ${W}′ · H ${H}′ · D ${D}′</text>
  <text x="${VW - 238}" y="100" font-size="11" fill="#5c6b62">Confirm on site measure</text>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="#f7faf8" stroke="#3d5646" stroke-width="2"/>
  ${doors}
  ${dimLine(fx, fy + fh + 20, fx + fw, fy + fh + 20, `Overall width = ${W} ft`)}
  ${dimLine(fx + fw + 20, fy, fx + fw + 20, fy + fh, `Height = ${H} ft`, { offset: 14 })}
  <rect x="40" y="${VH - 120}" width="${VW - 80}" height="80" rx="8" fill="#f7faf8" stroke="#c5d2cb"/>
  <text x="56" y="${VH - 94}" font-size="13" font-weight="700" fill="#152019">Notes</text>
  <text x="56" y="${VH - 74}" font-size="12" fill="#5c6b62">Drawing 1 — façade · Drawing 2 — carcass (open bay shelves, tall units, base, LED)</text>
  <text x="56" y="${VH - 56}" font-size="12" fill="#5c6b62">Carcass: BWP plywood · both-side 1 mm laminate · 2 mm edge banding · 18 mm panels</text>
  <text x="56" y="${VH - 38}" font-size="12" fill="#5c6b62">Sizes are reference — live wall size confirmed before production · 10-year warranty</text>
</svg>
`
}

for (const k of KITCHENS) {
  const dir = path.join(ROOT, k.folder)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'dim-elevation.svg'), elevationDrawing(k))
  fs.writeFileSync(path.join(dir, 'dim-carcass.svg'), carcassDrawing(k))
  console.log('kitchen drawings →', k.folder)
}
console.log('done', KITCHENS.length)
