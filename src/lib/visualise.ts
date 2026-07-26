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
  /** Made-to-measure size in feet — improves AI scale accuracy */
  widthFt?: number
  heightFt?: number
  depthFt?: number
  finishLabel?: string
  scopeLabel?: string
  /** Room photo vs architect drawing / plan / elevation */
  inputKind?: 'photo' | 'drawing'
  /** Previous AI image to edit for follow-up change commands */
  refineImageUrl?: string
  changeRequest?: string
}

/** Prefer closed exterior first; add carcass/detail as extra refs for fidelity */
export function productReferencePaths(product: Product): {
  primary: string
  extras: string[]
} {
  const images = product.images?.length
    ? product.images
    : product.image
      ? [product.image]
      : []
  const primary = images[0] || product.image
  const extras: string[] = []
  if (images.length > 1) {
    const last = images[images.length - 1]!
    if (last !== primary) extras.push(last)
  }
  if (images.length > 2) {
    const mid = images[1]!
    if (mid !== primary && !extras.includes(mid)) extras.push(mid)
  }
  return { primary, extras: extras.slice(0, 2) }
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

/** Compress / resize room photo for upload + AI (higher res = better room fidelity) */
export async function fileToDataUrl(
  file: File,
  maxSide = 2048,
  quality = 0.9,
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
    const refs = productReferencePaths(input.product)
    const [productDataUrl, ...extraDataUrls] = await Promise.all([
      urlToDataUrl(refs.primary),
      ...refs.extras.map((src) => urlToDataUrl(src)),
    ])

    const res = await fetch('/api/visualise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomDataUrl: input.roomDataUrl,
        productImageUrl: productDataUrl,
        productImageUrls: extraDataUrls,
        productName: input.product.name,
        categoryName: input.categoryName,
        colour: input.colour.hex,
        colourLabel: input.colour.label,
        notes: input.notes,
        widthFt: input.widthFt,
        heightFt: input.heightFt,
        depthFt: input.depthFt,
        finishLabel: input.finishLabel,
        scopeLabel: input.scopeLabel,
        inputKind: input.inputKind ?? 'photo',
        refineImageUrl: input.refineImageUrl,
        changeRequest: input.changeRequest,
      }),
    })

    const data = (await res.json()) as {
      imageUrl?: string
      error?: string
      code?: string
      hint?: string
    }

    if (res.ok && data.imageUrl) {
      const sizeHint =
        input.widthFt && input.heightFt
          ? ` Furniture sized toward ${input.widthFt} × ${input.heightFt}` +
            (input.depthFt ? ` × ${input.depthFt}` : '') +
            ' ft. AI is a visual guide — final quote uses your exact measure.'
          : ' Tip: share exact feet size for a closer scale match.'
      const refineHint = input.changeRequest?.trim()
        ? ` Updated for: “${input.changeRequest.trim()}”.`
        : ''
      return {
        imageUrl: data.imageUrl,
        source: 'ai',
        message:
          (input.refineImageUrl
            ? 'Revised look from your change request, matching catalog references.'
            : 'Higher-accuracy render: your room framing kept, catalog exterior (+ detail) matched.') +
          refineHint +
          sizeHint,
      }
    }

    const raw = data.error || data.hint || ''
    const exhausted =
      /exhausted balance|top up your balance|locked/i.test(raw)
    return {
      source: 'error',
      code: exhausted ? 'FAL_BALANCE' : data.code,
      message:
        data.code === 'MISSING_FAL_KEY'
          ? 'Connect your Fal.ai key below to generate professional room renders.'
          : exhausted
            ? 'Fal.ai balance is empty. Top up credits at fal.ai/dashboard/billing, then try again.'
            : raw ||
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
  aiImageUrl?: string | null
}) {
  const lines = [
    'Hi Priyabadal Homes — Interior Visualise request:',
    '',
    `Product: ${input.product.name}`,
    `Finish colour: ${input.colour.label}`,
    `Mode: ${input.usedAi ? 'Professional AI product-referenced render' : 'Need professional mockup'}`,
    input.aiImageUrl
      ? `AI photo (open this link): ${input.aiImageUrl}`
      : input.usedAi
        ? 'AI render was created on the website (photo link missing — please resend).'
        : null,
    input.notes ? `Note: ${input.notes}` : '',
    '',
    `Product link: ${window.location.origin}/product/${input.product.id}`,
    '',
    'Please share the final look / quote. Thank you.',
  ].filter(Boolean)

  return `https://wa.me/${WHATSAPP_QUOTE_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`
}
