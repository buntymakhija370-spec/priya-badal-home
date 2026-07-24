import type { Product } from '../data/catalog'
import { WHATSAPP_QUOTE_NUMBER } from './whatsapp'

export type VisualiseColour = {
  id: string
  label: string
  hex: string
}

export const VISUALISE_COLOURS: VisualiseColour[] = [
  { id: 'ivory', label: 'Ivory White', hex: '#f4f1ea' },
  { id: 'greige', label: 'Soft Greige', hex: '#cfc6ba' },
  { id: 'walnut', label: 'Warm Walnut', hex: '#8b5a3c' },
  { id: 'charcoal', label: 'Charcoal', hex: '#3a3f44' },
  { id: 'sage', label: 'Sage Green', hex: '#7d8f7a' },
  { id: 'gloss-white', label: 'Gloss White', hex: '#ffffff' },
]

export type VisualiseRequest = {
  roomDataUrl: string
  product: Product
  colour: VisualiseColour
  notes?: string
  categoryName: string
}

export type VisualiseResult = {
  imageUrl?: string
  source: 'ai' | 'error'
  message: string
  code?: string
}

export type VisualiseStatus = {
  configured: boolean
  mode: string
  model?: string
}

/** Compress / resize room photo for upload + AI */
export async function fileToDataUrl(
  file: File,
  maxSide = 1400,
  quality = 0.85,
): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not available')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', quality)
}

/** Send product image as data URL so the server can upload it to Fal CDN */
export async function urlToDataUrl(url: string): Promise<string> {
  const absolute = url.startsWith('http') ? url : `${window.location.origin}${url}`
  const res = await fetch(absolute)
  if (!res.ok) throw new Error('Could not load product image')
  const blob = await res.blob()
  const bitmap = await createImageBitmap(blob)
  const maxSide = 1200
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not available')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.88)
}

export async function fetchVisualiseStatus(): Promise<VisualiseStatus> {
  try {
    const res = await fetch('/api/visualise-status')
    if (!res.ok) return { configured: false, mode: 'needs-key' }
    return (await res.json()) as VisualiseStatus
  } catch {
    return { configured: false, mode: 'needs-key' }
  }
}

export async function connectFalKey(key: string): Promise<VisualiseStatus> {
  const res = await fetch('/api/visualise-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  })
  const data = (await res.json()) as VisualiseStatus & { error?: string }
  if (!res.ok) throw new Error(data.error || 'Could not connect AI key')
  return {
    configured: Boolean(data.configured),
    mode: data.mode || 'paid-ai',
    model: data.model,
  }
}

export async function generateVisualise(
  input: VisualiseRequest,
): Promise<VisualiseResult> {
  try {
    const productDataUrl = await urlToDataUrl(input.product.image)

    const res = await fetch('/api/visualise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomDataUrl: input.roomDataUrl,
        productImageUrl: productDataUrl,
        productName: input.product.name,
        categoryName: input.categoryName,
        colour: input.colour.hex,
        colourLabel: input.colour.label,
        notes: input.notes,
      }),
    })

    const data = (await res.json()) as {
      imageUrl?: string
      error?: string
      code?: string
      hint?: string
    }

    if (res.ok && data.imageUrl) {
      return {
        imageUrl: data.imageUrl,
        source: 'ai',
        message:
          'Professional AI render using your Priyabadal Homes product as reference.',
      }
    }

    return {
      source: 'error',
      code: data.code,
      message:
        data.code === 'MISSING_FAL_KEY'
          ? 'Connect your Fal.ai key below to generate professional room renders.'
          : data.error ||
            data.hint ||
            'Professional AI could not generate this look. Try again or WhatsApp us.',
    }
  } catch (err) {
    return {
      source: 'error',
      message:
        err instanceof Error
          ? err.message
          : 'Could not reach professional AI. Check your key / connection.',
    }
  }
}

export function buildVisualiseWhatsAppUrl(input: {
  product: Product
  colour: VisualiseColour
  notes?: string
  usedAi: boolean
}) {
  const lines = [
    'Hi Priyabadal Homes — Interior Visualise request:',
    '',
    `Product: ${input.product.name}`,
    `Finish colour: ${input.colour.label}`,
    `Mode: ${input.usedAi ? 'Professional AI product-referenced render' : 'Need professional mockup'}`,
    input.notes ? `Note: ${input.notes}` : '',
    '',
    `Product link: ${window.location.origin}/product/${input.product.id}`,
    '',
    'I uploaded my room photo on the Visualise page. Please share the final look / quote.',
  ].filter(Boolean)

  return `https://wa.me/${WHATSAPP_QUOTE_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`
}
