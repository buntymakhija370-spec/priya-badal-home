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
  imageUrl: string
  source: 'ai' | 'preview'
  message?: string
}

/** Compress / resize room photo for upload + AI */
export async function fileToDataUrl(
  file: File,
  maxSide = 1280,
  quality = 0.82,
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = src
  })
}

/**
 * Instant local preview (no API key): composites product into the room
 * with a colour wash. Used until FAL_KEY is set / if AI fails.
 */
export async function composeProductPreview(
  roomDataUrl: string,
  productImageUrl: string,
  colourHex: string,
): Promise<string> {
  const [room, product] = await Promise.all([
    loadImage(roomDataUrl),
    loadImage(productImageUrl),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = room.width
  canvas.height = room.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not available')

  ctx.drawImage(room, 0, 0)

  // Place product in lower-centre "installation zone"
  const targetW = room.width * 0.55
  const scale = targetW / product.width
  const targetH = product.height * scale
  const x = (room.width - targetW) / 2
  const y = room.height * 0.58 - targetH * 0.35

  ctx.save()
  ctx.globalAlpha = 0.92
  ctx.drawImage(product, x, y, targetW, targetH)

  // Colour wash over product area
  ctx.globalCompositeOperation = 'source-atop'
  ctx.fillStyle = colourHex
  ctx.globalAlpha = 0.22
  ctx.fillRect(x, y, targetW, targetH)
  ctx.restore()

  // Soft vignette label bar
  ctx.fillStyle = 'rgba(21, 32, 25, 0.55)'
  ctx.fillRect(0, room.height - 48, room.width, 48)
  ctx.fillStyle = '#f4f8f5'
  ctx.font = '600 18px Outfit, system-ui, sans-serif'
  ctx.fillText('Preview · Priyabadal Homes product match', 16, room.height - 18)

  return canvas.toDataURL('image/jpeg', 0.88)
}

export async function fetchVisualiseStatus(): Promise<{
  configured: boolean
  mode: string
}> {
  try {
    const res = await fetch('/api/visualise-status')
    if (!res.ok) return { configured: false, mode: 'preview-fallback' }
    return (await res.json()) as { configured: boolean; mode: string }
  } catch {
    return { configured: false, mode: 'preview-fallback' }
  }
}

export async function generateVisualise(
  input: VisualiseRequest,
): Promise<VisualiseResult> {
  const absoluteProductUrl = input.product.image.startsWith('http')
    ? input.product.image
    : `${window.location.origin}${input.product.image}`

  try {
    const res = await fetch('/api/visualise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomDataUrl: input.roomDataUrl,
        productImageUrl: absoluteProductUrl,
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
    }

    if (res.ok && data.imageUrl) {
      return {
        imageUrl: data.imageUrl,
        source: 'ai',
        message: 'Generated with your selected Priyabadal Homes product as reference.',
      }
    }

    // Fall through to local preview
    const preview = await composeProductPreview(
      input.roomDataUrl,
      absoluteProductUrl,
      input.colour.hex,
    )
    return {
      imageUrl: preview,
      source: 'preview',
      message:
        data.code === 'MISSING_FAL_KEY'
          ? 'Paid AI key not set yet — showing product-matched preview. Add FAL_KEY for full AI renders.'
          : `AI unavailable (${data.error || 'error'}) — showing product-matched preview instead.`,
    }
  } catch {
    const preview = await composeProductPreview(
      input.roomDataUrl,
      absoluteProductUrl,
      input.colour.hex,
    )
    return {
      imageUrl: preview,
      source: 'preview',
      message:
        'Could not reach AI service — showing product-matched preview. WhatsApp us for a precise mockup.',
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
    `Mode: ${input.usedAi ? 'AI product-referenced render' : 'Preview + need exact mockup'}`,
    input.notes ? `Note: ${input.notes}` : '',
    '',
    `Product link: ${window.location.origin}/product/${input.product.id}`,
    '',
    'I uploaded my room photo on the Visualise page. Please share the final look / quote.',
  ].filter(Boolean)

  return `https://wa.me/${WHATSAPP_QUOTE_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`
}
