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
    title: 'Certified boards',
    body: 'Engineered cores chosen for strength, moisture resistance, and clean machining — sized for made-to-measure work.',
  },
  {
    id: 'finishes',
    title: 'Premium finishes',
    body: 'PU, laminate, and designer surfaces from trusted Indian brands for colour depth and everyday durability.',
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
