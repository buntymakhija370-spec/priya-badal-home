import { getMinOrderQuantity, type Product } from '../data/catalog'
import { formatPrice } from './currency'
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
  const minQty = getMinOrderQuantity(product)
  const lines = [
    'Hi Priyabadal Homes, I would like a custom quotation:',
    '',
    `Product: ${product.name}`,
    `Estimated price: ${formatPrice(unitPrice, 'INR')}${minQty > 1 ? ' / pack' : ''}`,
    `Configuration: ${describeConfig(product.categoryId, config)}`,
  ]

  if (product.pricingMode === 'per-sqft') {
    lines.push(`Base rate: ${formatPrice(product.price, 'INR')} / sq ft`)
  }

  if (minQty > 1) {
    lines.push(
      `Bulk commercial order — minimum ${minQty} identical packs`,
      `Requested quantity: ${minQty}+`,
    )
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
      `   Line: ${formatPrice(item.unitPrice * item.quantity, 'INR')}`,
      '',
    ]),
    `Cart total (estimate): ${formatPrice(total, 'INR')}`,
    customerNote ? `\nNote: ${customerNote}` : '',
    '',
    'Please share the final quote in INR and next steps. Thank you.',
  ]
    .filter((line) => line !== '')
    .join('\n')

  return `https://wa.me/${WHATSAPP_QUOTE_NUMBER}?text=${encodeURIComponent(message)}`
}
