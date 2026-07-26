/**
 * Kitchen carcass + elevation shop drawings.
 * Run: node scripts/generateKitchenDrawings.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve('public/products/kitchen')
const VW = 1100
const VH = 1280

const KITCHENS = [
  {
    folder: 'lattice-grey',
    name: 'Light Grey Lattice Kitchen',
    sku: 'PBH-KIT-06',
    finish: 'Light grey PU / laminate shutters · light oak carcass · marble counter look',
    ref: { w: 10, h: 9, d: 2 },
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

function latticeDoor(x, y, w, h) {
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#e8ebe9" stroke="#3d5646" stroke-width="1.4"/>`
  out += `<rect x="${x + 6}" y="${y + 8}" width="${w - 12}" height="${h - 16}" fill="#dfe4e1" stroke="#9a7340" stroke-width="1"/>`
  // simplified lattice motif
  const cx = x + w / 2
  const cy = y + h / 2
  out += `<path d="M${cx} ${y + 18} Q${x + 14} ${cy} ${cx} ${y + h - 18} Q${x + w - 14} ${cy} ${cx} ${y + 18}" fill="none" stroke="#5c6b62" stroke-width="1.4"/>`
  out += `<circle cx="${cx}" cy="${cy}" r="6" fill="none" stroke="#9a7340" stroke-width="1.2"/>`
  return out
}

function carcassDrawing(k) {
  const { w: W, h: H, d: D } = k.ref
  // Open wall-cabinet carcass focus (as in photo) + base/tall context
  const fx = 80
  const fy = 160
  const fw = 720
  const fh = 820

  // Zones: tall L | wall uppers + loft | tall R ; base below counter
  const tallW = 90
  const midX = fx + tallW
  const midW = fw - tallW * 2
  const counterY = fy + 480
  const baseH = fh - 480 - 20
  const loftH = 90
  const wallH = 280
  const wallY = fy + loftH + 20

  let svg = ''
  // tall flanks
  svg += `<rect x="${fx}" y="${fy}" width="${tallW}" height="${fh - 20}" fill="#f3f6f4" stroke="#3d5646" stroke-width="1.5"/>`
  svg += `<text x="${fx + tallW / 2}" y="${fy + fh / 2}" text-anchor="middle" font-size="11" fill="#5c6b62" transform="rotate(-90 ${fx + tallW / 2} ${fy + fh / 2})">Tall unit L</text>`
  svg += `<rect x="${fx + fw - tallW}" y="${fy}" width="${tallW}" height="${fh - 20}" fill="#f3f6f4" stroke="#3d5646" stroke-width="1.5"/>`
  svg += `<text x="${fx + fw - tallW / 2}" y="${fy + fh / 2}" text-anchor="middle" font-size="11" fill="#5c6b62" transform="rotate(90 ${fx + fw - tallW / 2} ${fy + fh / 2})">Tall unit R</text>`

  // loft cabinets
  const loftDoorW = midW / 4
  for (let i = 0; i < 4; i++) {
    const x = midX + i * loftDoorW
    if (i === 0 || i === 3) svg += latticeDoor(x + 2, fy + 8, loftDoorW - 4, loftH - 10)
    else svg += `<rect x="${x + 2}" y="${fy + 8}" width="${loftDoorW - 4}" height="${loftH - 10}" rx="2" fill="#e8ebe9" stroke="#3d5646" stroke-width="1.3"/>`
  }
  svg += `<text x="${midX + midW / 2}" y="${fy - 6}" text-anchor="middle" font-size="12" font-weight="700" fill="#152019">Loft / top cabinets</text>`

  // wall cabinets — 4 bays; bay 2 open carcass with 2 shelves
  const wallDoorW = midW / 4
  for (let i = 0; i < 4; i++) {
    const x = midX + i * wallDoorW
    if (i === 1) {
      // open carcass — light oak interior, 2 shelves
      svg += hatch(x + 2, wallY, wallDoorW - 4, wallH)
      svg += `<rect x="${x + 8}" y="${wallY + 8}" width="${wallDoorW - 16}" height="${wallH - 16}" fill="#f4ebe0" stroke="#3d5646" stroke-width="1.3"/>`
      const s1 = wallY + wallH * 0.33
      const s2 = wallY + wallH * 0.66
      svg += `<rect x="${x + 12}" y="${s1 - 4}" width="${wallDoorW - 24}" height="8" fill="#e0d2c0" stroke="#3d5646"/>`
      svg += `<rect x="${x + 12}" y="${s2 - 4}" width="${wallDoorW - 24}" height="8" fill="#e0d2c0" stroke="#3d5646"/>`
      svg += `<text x="${x + wallDoorW / 2}" y="${wallY + 22}" text-anchor="middle" font-size="10" font-weight="700" fill="#152019">OPEN</text>`
      svg += `<text x="${x + wallDoorW / 2}" y="${wallY + wallH - 10}" text-anchor="middle" font-size="9" fill="#5c6b62">2 shelves · 3 bays</text>`
    } else {
      svg += latticeDoor(x + 2, wallY, wallDoorW - 4, wallH)
    }
  }
  svg += `<text x="${midX + midW / 2}" y="${wallY - 8}" text-anchor="middle" font-size="12" font-weight="700" fill="#152019">Wall cabinets · lattice shutters</text>`

  // undercabinet LED
  svg += `<rect x="${midX + 8}" y="${wallY + wallH + 4}" width="${midW - 16}" height="4" rx="1" fill="#f0d9a0"/>`
  svg += `<text x="${midX + midW - 8}" y="${wallY + wallH + 20}" text-anchor="end" font-size="10" fill="#9a7340">under-cabinet LED</text>`

  // backsplash + counter
  svg += `<rect x="${midX}" y="${wallY + wallH + 24}" width="${midW}" height="${counterY - (wallY + wallH + 24)}" fill="#f0f2f1" stroke="#c5d2cb"/>`
  svg += `<text x="${midX + midW / 2}" y="${(wallY + wallH + 24 + counterY) / 2}" text-anchor="middle" font-size="11" fill="#8a9690">marble backsplash</text>`
  svg += `<rect x="${midX}" y="${counterY}" width="${midW}" height="22" fill="#eef1f0" stroke="#3d5646" stroke-width="1.4"/>`
  svg += `<text x="${midX + midW / 2}" y="${counterY + 16}" text-anchor="middle" font-size="11" font-weight="600" fill="#152019">counter · sink zone</text>`
  // sink hint
  svg += `<rect x="${midX + midW / 2 - 50}" y="${counterY + 28}" width="100" height="36" rx="4" fill="#f7faf8" stroke="#8aa0aa" stroke-dasharray="4 3"/>`
  svg += `<text x="${midX + midW / 2}" y="${counterY + 50}" text-anchor="middle" font-size="9" fill="#5c6b62">sink</text>`

  // base cabinets
  const baseY = counterY + 70
  const baseDoorW = midW / 4
  for (let i = 0; i < 4; i++) {
    const x = midX + i * baseDoorW
    svg += `<rect x="${x + 2}" y="${baseY}" width="${baseDoorW - 4}" height="${baseH - 60}" rx="2" fill="#e8ebe9" stroke="#3d5646" stroke-width="1.3"/>`
    svg += `<rect x="${x + 10}" y="${baseY + 12}" width="${baseDoorW - 20}" height="${baseH - 84}" fill="none" stroke="#9a7340" stroke-width="1"/>`
  }
  svg += `<text x="${midX + midW / 2}" y="${baseY - 8}" text-anchor="middle" font-size="12" font-weight="700" fill="#152019">Base cabinets (shaker)</text>`
  svg += hatch(midX, fy + fh - 28, midW, 18)
  svg += `<text x="${midX + midW / 2}" y="${fy + fh - 14}" text-anchor="middle" font-size="10" fill="#3d5646">plinth</text>`

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}" preserveAspectRatio="xMidYMid meet" role="img">
  <title>${esc(k.name)} — detailed kitchen carcass shop drawing</title>
  <rect width="${VW}" height="${VH}" fill="#ffffff"/>
  <rect x="20" y="20" width="${VW - 40}" height="${VH - 40}" rx="8" fill="none" stroke="#c5d2cb" stroke-width="2"/>

  <text x="44" y="54" font-family="Georgia, 'Times New Roman', serif" font-size="26" fill="#152019">Kitchen carcass shop drawing</text>
  <text x="44" y="78" font-family="system-ui,sans-serif" font-size="15" fill="#5c6b62">${esc(k.name)}</text>
  <text x="44" y="98" font-family="system-ui,sans-serif" font-size="12" fill="#8a9690">SKU ${esc(k.sku)} · Open wall-cabinet carcass + full run elevation</text>
  <text x="44" y="116" font-family="system-ui,sans-serif" font-size="12" fill="#8a9690">${esc(k.finish)}</text>

  <rect x="${VW - 250}" y="36" width="206" height="90" rx="6" fill="#f7faf8" stroke="#c5d2cb"/>
  <text x="${VW - 238}" y="58" font-size="11" font-weight="700" fill="#152019">OVERALL (reference)</text>
  <text x="${VW - 238}" y="80" font-size="14" fill="#152019">W ${W}′ · H ${H}′ · D ${D}′</text>
  <text x="${VW - 238}" y="100" font-size="11" fill="#5c6b62">${Math.round(W * 304.8)} × ${Math.round(H * 304.8)} mm</text>
  <text x="${VW - 238}" y="116" font-size="11" fill="#5c6b62">18 mm BWP carcass</text>

  ${svg}

  ${dimLine(fx, fy + fh + 10, fx + fw, fy + fh + 10, `Overall W = ${W} ft (${Math.round(W * 304.8)} mm)`)}
  ${dimLine(fx + fw + 18, fy, fx + fw + 18, fy + fh - 20, `H = ${H} ft`, { offset: 14 })}

  <g transform="translate(820, 180)">
    <text x="0" y="0" font-size="13" font-weight="700" fill="#152019">Zone schedule</text>
    <text x="0" y="20" font-size="11" fill="#5c6b62">1. Tall flank units</text>
    <text x="0" y="36" font-size="11" fill="#5c6b62">2. Loft / top cabinets</text>
    <text x="0" y="52" font-size="11" fill="#5c6b62">3. Wall cabinets (lattice)</text>
    <text x="0" y="68" font-size="11" fill="#5c6b62">4. Open bay: 2 shelves</text>
    <text x="0" y="84" font-size="11" fill="#5c6b62">5. Under-cabinet LED</text>
    <text x="0" y="100" font-size="11" fill="#5c6b62">6. Counter + sink</text>
    <text x="0" y="116" font-size="11" fill="#5c6b62">7. Base shaker cabinets</text>
    <text x="0" y="140" font-size="11" font-weight="700" fill="#152019">Carcass interior</text>
    <text x="0" y="156" font-size="11" fill="#5c6b62">Light oak laminate</text>
    <text x="0" y="172" font-size="11" fill="#5c6b62">both-side 1 mm</text>
    <text x="0" y="188" font-size="11" fill="#5c6b62">2 mm edge banding</text>
  </g>

  <rect x="40" y="${VH - 120}" width="${VW - 80}" height="80" rx="8" fill="#fff9f0" stroke="#9a7340"/>
  <text x="56" y="${VH - 94}" font-size="13" font-weight="700" fill="#152019">Carcass construction (Priyabadal standard)</text>
  <text x="56" y="${VH - 74}" font-size="12" fill="#5c6b62">Core: BWP plywood 18 mm · Surfaces: 1 mm laminate both sides · Edges: 2 mm edge banding</text>
  <text x="56" y="${VH - 56}" font-size="12" fill="#5c6b62">Wall cabinet open bay as photographed — 2 fixed shelves / 3 storage levels · Layout scales to live wall</text>
  <text x="56" y="${VH - 38}" font-size="12" fill="#5c6b62">Assembly: /guides/carcass-assembly · Confirm plan on WhatsApp · 10-year warranty</text>
</svg>
`
}

function elevationDrawing(k) {
  const { w: W, h: H, d: D } = k.ref
  const fx = 140
  const fy = 160
  const fw = 700
  const fh = 820
  const tallW = 85
  const midX = fx + tallW
  const midW = fw - tallW * 2
  const loftH = 85
  const wallH = 260
  const wallY = fy + loftH + 16
  const counterY = fy + 450

  let doors = ''
  doors += `<rect x="${fx}" y="${fy}" width="${tallW}" height="${fh - 16}" fill="#e8ebe9" stroke="#3d5646" stroke-width="1.5"/>`
  doors += `<rect x="${fx + fw - tallW}" y="${fy}" width="${tallW}" height="${fh - 16}" fill="#e8ebe9" stroke="#3d5646" stroke-width="1.5"/>`

  const loftW = midW / 4
  for (let i = 0; i < 4; i++) {
    const x = midX + i * loftW
    doors += i === 0 || i === 3
      ? latticeDoor(x + 2, fy + 6, loftW - 4, loftH - 8)
      : `<rect x="${x + 2}" y="${fy + 6}" width="${loftW - 4}" height="${loftH - 8}" rx="2" fill="#e8ebe9" stroke="#3d5646"/>`
  }
  const wallW = midW / 4
  for (let i = 0; i < 4; i++) {
    doors += latticeDoor(midX + i * wallW + 2, wallY, wallW - 4, wallH)
  }
  doors += `<rect x="${midX + 6}" y="${wallY + wallH + 3}" width="${midW - 12}" height="3" fill="#f0d9a0"/>`
  doors += `<rect x="${midX}" y="${counterY}" width="${midW}" height="20" fill="#eef1f0" stroke="#3d5646"/>`
  const baseY = counterY + 28
  const baseH = fy + fh - 30 - baseY
  const baseW = midW / 4
  for (let i = 0; i < 4; i++) {
    doors += `<rect x="${midX + i * baseW + 2}" y="${baseY}" width="${baseW - 4}" height="${baseH}" rx="2" fill="#e8ebe9" stroke="#3d5646"/>`
    doors += `<rect x="${midX + i * baseW + 10}" y="${baseY + 10}" width="${baseW - 20}" height="${baseH - 20}" fill="none" stroke="#9a7340"/>`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}" preserveAspectRatio="xMidYMid meet" role="img">
  <title>${esc(k.name)} — kitchen exterior elevation</title>
  <rect width="${VW}" height="${VH}" fill="#ffffff"/>
  <rect x="20" y="20" width="${VW - 40}" height="${VH - 40}" rx="8" fill="none" stroke="#c5d2cb" stroke-width="2"/>

  <text x="44" y="54" font-family="Georgia, 'Times New Roman', serif" font-size="26" fill="#152019">Kitchen exterior elevation</text>
  <text x="44" y="78" font-family="system-ui,sans-serif" font-size="15" fill="#5c6b62">${esc(k.name)}</text>
  <text x="44" y="98" font-family="system-ui,sans-serif" font-size="12" fill="#8a9690">SKU ${esc(k.sku)} · Front elevation · lattice shutters + tall flanks</text>
  <text x="44" y="116" font-family="system-ui,sans-serif" font-size="12" fill="#8a9690">${esc(k.finish)}</text>

  <rect x="${VW - 250}" y="36" width="206" height="90" rx="6" fill="#f7faf8" stroke="#c5d2cb"/>
  <text x="${VW - 238}" y="58" font-size="11" font-weight="700" fill="#152019">OVERALL (reference)</text>
  <text x="${VW - 238}" y="80" font-size="14" fill="#152019">W ${W}′ · H ${H}′ · D ${D}′</text>
  <text x="${VW - 238}" y="100" font-size="11" fill="#5c6b62">Confirm on site measure</text>

  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="#f7faf8" stroke="#3d5646" stroke-width="2"/>
  ${doors}

  ${dimLine(fx, fy + fh + 24, fx + fw, fy + fh + 24, `Overall width = ${W} ft (${Math.round(W * 304.8)} mm)`)}
  ${dimLine(fx + fw + 22, fy, fx + fw + 22, fy + fh, `Height = ${H} ft`, { offset: 14 })}

  <g transform="translate(48, ${fy + 40})">
    <polygon points="0,40 36,20 36,150 0,170" fill="#f3f6f4" stroke="#3d5646" stroke-width="1.2"/>
    <text x="44" y="95" font-size="12" fill="#5c6b62">Depth</text>
    <text x="44" y="114" font-size="13" font-weight="700" fill="#152019">D = ${D} ft</text>
  </g>

  <rect x="40" y="${VH - 120}" width="${VW - 80}" height="80" rx="8" fill="#f7faf8" stroke="#c5d2cb"/>
  <text x="56" y="${VH - 94}" font-size="13" font-weight="700" fill="#152019">Notes</text>
  <text x="56" y="${VH - 74}" font-size="12" fill="#5c6b62">Drawing 1 — façade · Drawing 2 — carcass (open wall bay with 2 shelves, base, tall units, LED)</text>
  <text x="56" y="${VH - 56}" font-size="12" fill="#5c6b62">Carcass: BWP plywood · both-side 1 mm laminate · 2 mm edge banding · 18 mm panels</text>
  <text x="56" y="${VH - 38}" font-size="12" fill="#5c6b62">Handle-less shutters · counter/sink for representation · 10-year manufacturing warranty</text>
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
console.log('done')
