/**
 * Standard Priyabadal Homes carcass construction — used on PDP, planner,
 * assembly guide, order process, and AI chat knowledge.
 */
export const CARCASS_CONSTRUCTION_TITLE = 'Standard carcass construction'

export const CARCASS_CONSTRUCTION_SHORT =
  'BWP plywood · both-side 1 mm laminate · 2 mm edge banding'

export const CARCASS_CONSTRUCTION_DETAIL = [
  'Core: BWP (boiling water proof) plywood for carcass boxes — wardrobe, kitchen, and temple carcass where listed.',
  'Surfaces: 1 mm laminate on both sides of carcass panels for a clean, wipeable interior and exterior box finish.',
  'Edges: 2 mm PVC edge banding on all exposed carcass edges for durability and a neat factory finish.',
  'Hardware prep: hinge / slide drilling as per layout; soft-close options available on confirmed orders.',
  'Made to your confirmed size in feet — not a stock box.',
].join(' ')

export const CARCASS_SPEC_ROWS = [
  { label: 'Carcass core', value: 'BWP plywood (boiling water proof)' },
  { label: 'Carcass laminate', value: '1 mm laminate — both sides' },
  { label: 'Edge banding', value: '2 mm edge banding on exposed edges' },
  {
    label: 'Assembly guide',
    value: 'Installation drawing + QR code for easy carcass assembly',
  },
] as const

/** In-app route for the carpenter-facing assembly guide */
export const CARCASS_ASSEMBLY_PATH = '/guides/carcass-assembly'

/** Static assets (drawing + printable QR) */
export const CARCASS_ASSEMBLY_DRAWING_SRC = '/guides/carcass-install-drawing.svg'
export const CARCASS_ASSEMBLY_QR_SRC = '/guides/carcass-assembly-qr.svg'

export const CARCASS_ASSEMBLY_STEPS = [
  {
    id: 'unpack',
    title: '1. Unpack & check',
    body: 'Open the pack on a clean floor. Match panels to the packing list (sides, top, bottom, shelves, back). Keep screws and fittings in the pouch.',
  },
  {
    id: 'dry-fit',
    title: '2. Dry-fit the box',
    body: 'Stand left & right sides. Place top and bottom between them. Confirm cam/dowel holes align before tightening.',
  },
  {
    id: 'square',
    title: '3. Square & fix back',
    body: 'Tighten carcass connectors evenly. Fix the back panel so the box stays square — check with a tape on both diagonals.',
  },
  {
    id: 'shelves',
    title: '4. Shelves, rods & drawers',
    body: 'Fit shelves at marked heights, hanging rods, and drawer boxes as per your bay layout from Chat / WhatsApp drawing.',
  },
  {
    id: 'wall',
    title: '5. Wall install',
    body: 'Level the carcass on the wall or plinth. Fix with appropriate wall anchors. Then hang shutters / doors and adjust gaps.',
  },
  {
    id: 'finish',
    title: '6. Final check',
    body: 'Wipe laminate faces, check soft-close action, and confirm edge banding is seated. Note any site issue on WhatsApp with a photo.',
  },
] as const

/** Categories that use this carcass construction standard */
export function productUsesCarcassConstruction(categoryId: string, hasCarcassPrice?: boolean) {
  if (hasCarcassPrice) return true
  return (
    categoryId === 'wardrobe' ||
    categoryId === 'kitchen' ||
    categoryId === 'temple' ||
    categoryId === 'sculpted-furniture' ||
    categoryId === 'carcass-selection'
  )
}
