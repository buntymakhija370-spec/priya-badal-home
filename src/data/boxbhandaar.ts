/** Boxbhandaar — limited festive box catalogue */

export const BOXBHANDAAR_BRAND = 'Boxbhandaar'
export const BOXBHANDAAR_TAGLINE = 'Festive boxes, thoughtfully kept.'
export const BOXBHANDAAR_PARENT = 'A gifting venture of Priyabadal Homes'

export const BOXBHANDAAR_WA_NUMBER = '918109949649'
export const BOXBHANDAAR_WA_DISPLAY = '+91 81099 49649'

export type BoxProduct = {
  id: string
  name: string
  short: string
  description: string
  price: number
  serves: string
  image: string
  accent: string
}

export type BoxFilm = {
  id: string
  title: string
  caption: string
  src: string
  poster: string
}

export const BOXBHANDAAR_PRODUCTS: BoxProduct[] = [
  {
    id: 'diwali-luxe',
    name: 'Diwali Luxe',
    short: 'Lights, sweets, quiet luxury.',
    description:
      'A deep-finish festive box for Diwali hosting — curated sweets, brass accents, and a keep-worthy presentation tray.',
    price: 2499,
    serves: 'Family of 4–6',
    image: '/boxbhandaar/products/diwali.jpg',
    accent: '#1e4d7b',
  },
  {
    id: 'wedding-shagun',
    name: 'Wedding Shagun',
    short: 'For the moment that matters.',
    description:
      'A shagun box with clean kraft lines and lacquer ribbon — sized for wedding blessings, mehndi trays, and guest tokens.',
    price: 3499,
    serves: 'Couple / host gift',
    image: '/boxbhandaar/products/wedding.jpg',
    accent: '#9e2b25',
  },
  {
    id: 'corporate-festive',
    name: 'Corporate Festive',
    short: 'Bulk-ready. Brand-ready.',
    description:
      'A refined corporate festive hamper with patterned wrap and gold seal. Available as a short-run set for teams and clients.',
    price: 4999,
    serves: 'Office / client set',
    image: '/boxbhandaar/products/corporate.jpg',
    accent: '#3d5c45',
  },
  {
    id: 'celebration-mini',
    name: 'Celebration Mini',
    short: 'Small box. Full occasion.',
    description:
      'A compact celebration box for housewarmings, birthdays, and thank-yous — ready to hand over without the bulk.',
    price: 999,
    serves: '1–2 people',
    image: '/boxbhandaar/products/mini.jpg',
    accent: '#6b4f3a',
  },
]

export const BOXBHANDAAR_FILMS: BoxFilm[] = [
  {
    id: 'wrap',
    title: 'The wrap',
    caption: 'Paper, fold, pause.',
    src: '/boxbhandaar/videos/film-wrap.mp4',
    poster: '/boxbhandaar/videos/film-wrap.jpg',
  },
  {
    id: 'fold',
    title: 'The fold',
    caption: 'Edges that hold.',
    src: '/boxbhandaar/videos/film-fold.mp4',
    poster: '/boxbhandaar/videos/film-fold.jpg',
  },
  {
    id: 'detail',
    title: 'The detail',
    caption: 'Ribbon, close.',
    src: '/boxbhandaar/videos/film-detail.mp4',
    poster: '/boxbhandaar/videos/film-detail.jpg',
  },
]

export function getBoxProduct(id: string) {
  return BOXBHANDAAR_PRODUCTS.find((p) => p.id === id)
}

export function formatBoxPrice(inr: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(inr)
}

export function boxWhatsAppUrl(product?: BoxProduct) {
  const lines = product
    ? [
        `Hi Boxbhandaar — I want to order:`,
        '',
        `Box: ${product.name}`,
        `Price: ${formatBoxPrice(product.price)}`,
        '',
        'Please confirm availability and delivery.',
      ]
    : [
        'Hi Boxbhandaar — I would like to know more about your festive boxes.',
        '',
        'Please share the current collection.',
      ]
  return `https://wa.me/${BOXBHANDAAR_WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`
}
