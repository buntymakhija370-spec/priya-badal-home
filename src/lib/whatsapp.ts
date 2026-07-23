import { formatPrice, type Product } from '../data/catalog'
import { describeConfig, type PriceConfig } from './pricing'

/** India mobile without leading 0; WhatsApp needs country code */
export const WHATSAPP_QUOTE_NUMBER = '918109949649'

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
