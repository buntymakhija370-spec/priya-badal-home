import { formatPrice, type Product } from '../data/catalog'
import { describeConfig, type PriceConfig } from './pricing'
import type { CartItem } from './cart'

/** India mobile without leading 0; WhatsApp needs country code */
export const WHATSAPP_QUOTE_NUMBER = '918109949649'
export const WHATSAPP_DISPLAY = '+91 81099 49649'
export const WHATSAPP_CHAT_URL = `https://wa.me/${WHATSAPP_QUOTE_NUMBER}`

export function buildWhatsAppQuoteUrl(
  product: Product,
  config: PriceConfig,
  unitPrice: number,
) {
  const lines = [
    'Hi Priyabadal Homes, I would like a custom quotation:',
    '',
    `Product: ${product.name}`,
    `Estimated price: ${formatPrice(unitPrice)}`,
    `Configuration: ${describeConfig(product.categoryId, config)}`,
  ]

  if (product.pricingMode === 'per-sqft') {
    lines.push(`Base rate: ${formatPrice(product.price)} / sq ft`)
  }

  lines.push('', 'Please share the final quote. Thank you.')

  const text = lines.join('\n')
  return `https://wa.me/${WHATSAPP_QUOTE_NUMBER}?text=${encodeURIComponent(text)}`
}

export type CartQuoteLine = {
  item: CartItem
  product: Product
}

/** Full cart → WhatsApp order / quote request */
export function buildWhatsAppCartUrl(lines: CartQuoteLine[], customerNote = '') {
  const total = lines.reduce(
    (sum, row) => sum + row.item.unitPrice * row.item.quantity,
    0,
  )

  const message = [
    'Hi Priyabadal Homes, I would like to place / confirm this order quote:',
    '',
    ...lines.flatMap(({ item, product }, index) => [
      `${index + 1}. ${product.name}`,
      `   Qty: ${item.quantity}`,
      `   Config: ${describeConfig(product.categoryId, item.config)}`,
      `   Line: ${formatPrice(item.unitPrice * item.quantity)}`,
      '',
    ]),
    `Cart total (estimate): ${formatPrice(total)}`,
    customerNote ? `\nNote: ${customerNote}` : '',
    '',
    'Please share the final quote and next steps. Thank you.',
  ]
    .filter((line) => line !== '')
    .join('\n')

  return `https://wa.me/${WHATSAPP_QUOTE_NUMBER}?text=${encodeURIComponent(message)}`
}
