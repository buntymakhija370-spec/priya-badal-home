/** Brand & contact — matches www.priyabadalhomes.com */
export const SITE = {
  name: 'Priyabadal Homes',
  shortName: 'Priyabadal',
  tagline: 'Custom Handcrafted Furniture',
  domain: 'www.priyabadalhomes.com',
  url: 'https://www.priyabadalhomes.com',
  phoneDisplay: '+91 81099 49649',
  phoneTel: '+918109949649',
  whatsapp: '918109949649',
  email: 'info@priyabadalhomes.com',
  ordersEmail: 'orders@priyabadalhomes.com',
  description:
    'Custom-sized handcrafted furniture — Wall Panels, Doors, Wardrobe Shutters, Kitchen Shutters & more. Made to your exact measurements by Indian artisans.',
} as const

export function whatsappUrl(message?: string) {
  const base = `https://wa.me/${SITE.whatsapp}`
  if (!message) return base
  return `${base}?text=${encodeURIComponent(message)}`
}
