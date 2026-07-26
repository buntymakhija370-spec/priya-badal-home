export const MATERIALS_HEADLINE = 'Premium Materials,\nZero Compromise'

export const MATERIALS_LEDE =
  "Every product uses certified, top-grade raw materials sourced from India's most trusted brands."

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
    id: 'assembly',
    title: 'Install drawing + QR',
    body: 'Every carcass order includes an installation drawing and QR code so carpenters can assemble the box easily on site.',
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
    title: 'Built to last',
    body: 'Quality-checked before dispatch, with manufacturing warranty support on confirmed custom orders.',
  },
]
