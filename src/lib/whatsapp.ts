import { getMinOrderQuantity, type Product } from '../data/catalog'
import { formatPrice } from './currency'
import {
  describeConfig,
  getCncCarveHdRate,
  getThickness,
  isCncCarveHd,
  type PriceConfig,
} from './pricing'
import type { CartItem } from './cart'

/** India mobile without leading 0; WhatsApp needs country code */
export const WHATSAPP_QUOTE_NUMBER = '918109949649'
export const WHATSAPP_DISPLAY = '+91 81099 49649'
export const WHATSAPP_CHAT_URL = `https://wa.me/${WHATSAPP_QUOTE_NUMBER}`

export function buildWhatsAppQuoteUrl(
  product: Product,
  config: PriceConfig,
  unitPrice: number,
  changeNotes?: string,
) {
  const minQty = getMinOrderQuantity(product)
  const cnc = isCncCarveHd(config)
  const lines = [
    'Hi Priyabadal Homes, I would like a custom quotation:',
    '',
    `Product: ${product.name}`,
    `Estimated price: ${formatPrice(unitPrice, 'INR')}${minQty > 1 ? ' / pack' : ''}`,
    `Configuration: ${describeConfig(product.categoryId, config)}`,
  ]

  if (cnc) {
    const cncRate = formatPrice(getCncCarveHdRate(product), 'INR')
    const cncThick = product.cncThicknessId
      ? getThickness(product.cncThicknessId).label
      : 'HD board'
    lines.push(
      `CNC-Carve HD Board: ${cncRate}/sq ft · ${cncThick} · no paint / no finishing`,
    )
  } else if (product.pricingMode === 'per-sqft') {
    const shutter = formatPrice(product.price, 'INR')
    if (product.carcassPrice != null) {
      const combined = formatPrice(product.price + product.carcassPrice, 'INR')
      lines.push(
        `Rates: shutter ${shutter}/sq ft · carcass ${formatPrice(product.carcassPrice, 'INR')}/sq ft · with carcass = both (${combined}/sq ft)`,
      )
    } else {
      lines.push(`Base rate: ${shutter} / sq ft`)
    }
  }

  if (!cnc && config.includeHandlePair && product.handlePairPrice != null) {
    lines.push(
      `Handle pair: ${formatPrice(product.handlePairPrice, 'INR')} (back side laminated)`,
    )
  }

  if (product.orderNotes?.length) {
    lines.push('', 'Order notes:')
    for (const note of product.orderNotes) {
      lines.push(`• ${note}`)
    }
  }

  const change = changeNotes?.trim()
  if (change) {
    lines.push('', 'Changes / instructions from the photograph:', change)
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

/** Fixed catalog pieces (e.g. Live Edge) — no size/finish customisation */
export function buildWhatsAppProductUrl(product: Product, changeNotes?: string) {
  const isLiveEdge = product.categoryId === 'live-edge-furniture'
  const change = changeNotes?.trim()
  const lines = isLiveEdge
    ? [
        'Hi Priyabadal Homes, I am interested in this Live Edge piece:',
        '',
        `Product: ${product.name}`,
        `Price: ${formatPrice(product.price, 'INR')}`,
        '',
        'Please confirm:',
        '- Exact size of this piece',
        '- Current availability (natural teak — unique / not repeatable)',
        change ? '' : null,
        change ? `Changes / instructions from the photograph: ${change}` : null,
        '',
        'Thank you.',
      ]
    : [
        'Hi Priyabadal Homes, I am interested in this product:',
        '',
        `Product: ${product.name}`,
        `Price: ${formatPrice(product.price, 'INR')}`,
        change ? '' : null,
        change ? `Changes / instructions from the photograph: ${change}` : null,
        '',
        'Please share availability and next steps. Thank you.',
      ]
  const text = lines.filter((line) => line != null).join('\n')
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
