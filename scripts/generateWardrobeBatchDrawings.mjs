/**
 * Shop drawings for Drive wardrobe batch (wardrobe-1..N).
 * Run: node scripts/generateWardrobeBatchDrawings.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve('public/products/wardrobe')
const VW = 980
const VH = 1280
const meta = JSON.parse(fs.readFileSync('/tmp/wardrobe27-meta.json', 'utf8'))

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function elevation(w) {
  const W = 8, H = 7, D = 2
  const frameX = 120, frameY = 160, frameW = 740, frameH = 920
  const n = 4
  const doorW = frameW / n
  let doors = ''
  for (let i = 0; i < n; i++) {
    const x = frameX + i * doorW
    doors += `<rect x="${x + 4}" y="${frameY + 8}" width="${doorW - 8}" height="${frameH - 16}" rx="3" fill="#f4f1ea" stroke="#3d5646" stroke-width="1.7"/>`
    doors += `<rect x="${x + 14}" y="${frameY + 28}" width="${doorW - 28}" height="${frameH * 0.55}" rx="2" fill="none" stroke="#9a7340" stroke-width="1.2"/>`
    doors += `<line x1="${x + doorW * 0.72}" y1="${frameY + frameH * 0.38}" x2="${x + doorW * 0.72}" y2="${frameY + frameH * 0.55}" stroke="#152019" stroke-width="3.5" stroke-linecap="round"/>`
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}">
  <rect width="${VW}" height="${VH}" fill="#fff"/>
  <text x="44" y="54" font-family="Georgia,serif" font-size="26" fill="#152019">Exterior elevation — full wardrobe / shutter</text>
  <text x="44" y="78" font-family="system-ui,sans-serif" font-size="15" fill="#5c6b62">${esc(w.name)}</text>
  <text x="44" y="98" font-family="system-ui,sans-serif" font-size="12" fill="#8a9690">SKU ${esc(w.sku)} · hinged shutters · ref W ${W}′ × H ${H}′ × D ${D}′</text>
  <text x="44" y="116" font-family="system-ui,sans-serif" font-size="12" fill="#8a9690">${esc(w.finish)}</text>
  <rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" fill="#e8eeea" stroke="#3d5646" stroke-width="2.4"/>
  ${doors}
  <text x="44" y="${VH - 48}" font-size="12" fill="#5c6b62">Full wardrobe façade drawing · confirm live wall size on WhatsApp · BWP carcass · 10-year warranty</text>
</svg>`
}

function carcass(w) {
  const W = 8, H = 7, D = 2
  const frameX = 100, frameY = 150, frameW = 780, frameH = 940
  const bays = 3
  const bayW = frameW / bays
  let inner = ''
  for (let i = 0; i < bays; i++) {
    const x = frameX + i * bayW
    inner += `<rect x="${x + 6}" y="${frameY + 6}" width="${bayW - 12}" height="${frameH - 12}" fill="#f7f1e8" stroke="#3d5646" stroke-width="1.4"/>`
    for (const fy of [0.12, 0.24, 0.36]) {
      const y = frameY + frameH * fy
      inner += `<line x1="${x + 14}" y1="${y}" x2="${x + bayW - 14}" y2="${y}" stroke="#7d5c30" stroke-width="2"/>`
    }
    const ry = frameY + frameH * 0.48
    inner += `<line x1="${x + 18}" y1="${ry}" x2="${x + bayW - 18}" y2="${ry}" stroke="#152019" stroke-width="3" stroke-linecap="round"/>`
    for (let d = 0; d < 3; d++) {
      const y = frameY + frameH * 0.62 + d * (frameH * 0.1)
      inner += `<rect x="${x + 16}" y="${y}" width="${bayW - 32}" height="${frameH * 0.08}" rx="2" fill="#efe6d8" stroke="#3d5646"/>`
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}">
  <rect width="${VW}" height="${VH}" fill="#fff"/>
  <text x="44" y="54" font-family="Georgia,serif" font-size="26" fill="#152019">Open carcass elevation</text>
  <text x="44" y="78" font-family="system-ui,sans-serif" font-size="15" fill="#5c6b62">${esc(w.name)}</text>
  <text x="44" y="98" font-family="system-ui,sans-serif" font-size="12" fill="#8a9690">SKU ${esc(w.sku)} · BWP · both-side 1 mm laminate · 2 mm edge banding · ref ${W}′ × ${H}′ × ${D}′</text>
  <rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" fill="#e8eeea" stroke="#3d5646" stroke-width="2.4"/>
  ${inner}
  <text x="44" y="${VH - 48}" font-size="12" fill="#5c6b62">Internal layout representative — final shelves, rods, drawers confirmed on WhatsApp</text>
</svg>`
}

for (const w of meta) {
  const dir = path.join(ROOT, w.folder)
  fs.mkdirSync(dir, { recursive: true })
  const payload = { name: w.name, sku: w.sku, finish: w.finish }
  fs.writeFileSync(path.join(dir, 'dim-elevation.svg'), elevation(payload))
  fs.writeFileSync(path.join(dir, 'dim-carcass.svg'), carcass(payload))
  console.log('drawings →', w.folder)
}
console.log('done', meta.length)
