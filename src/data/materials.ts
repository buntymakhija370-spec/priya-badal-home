export const MATERIALS_HEADLINE = 'Premium Materials,\nZero Compromise'

export const MATERIALS_LEDE =
  "Every product uses certified, top-grade raw materials sourced from India's most trusted brands."

/** Site-wide product warranty (shown on every PDP / specs) */
export const PRODUCT_WARRANTY_YEARS = 10
export const PRODUCT_WARRANTY =
  "10 Years' warranty on manufacturing defects"

export type MaterialPoint = {
  id: string
  title: string
  body: string
}

export const MATERIAL_POINTS: MaterialPoint[] = [
  {
    id: 'boards',
    title: 'BWP carcass plywood',
    body: 'Carcass boxes use BWP (boiling water proof) plywood — made to your confirmed size for wardrobes, kitchens, and temple units.',
  },
  {
    id: 'laminate',
    title: 'Both-side 1 mm laminate',
    body: 'Carcass panels are laminated on both sides with 1 mm laminate for a clean, wipeable interior and durable box finish.',
  },
  {
    id: 'edge',
    title: '2 mm edge banding',
    body: 'Exposed carcass edges get 2 mm edge banding for a neat factory finish and everyday knock resistance.',
  },
  {
    id: 'finishes',
    title: 'Premium shutter finishes',
    body: 'PU, laminate, and designer surfaces from trusted Indian brands for colour depth and everyday durability on shutters and doors.',
  },
  {
    id: 'hardware',
    title: 'Reliable hardware',
    body: 'Soft-close hinges, slides, and fittings selected for quiet use and long service in real homes.',
  },
  {
    id: 'warranty',
    title: '10-year warranty',
    body: "Every Priyabadal Homes product carries a 10 Years' warranty on manufacturing defects — quality-checked before dispatch.",
  },
]
