import type { Product } from '../data/catalog'
import { aiAuthHeaders } from './aiAccess'
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

export type VisualiseMode = 'replace' | 'install' | 'redesign'

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
  /** replace existing furniture / install / full presentable redesign */
  visualiseMode?: VisualiseMode
  /** Previous AI image to edit for follow-up change commands */
  refineImageUrl?: string
  changeRequest?: string
}

function isDimensionDrawing(src: string) {
  return /dim-(elevation|carcass)\.(svg|png|jpg|jpeg|webp)(\?|$)/i.test(src)
}

/** Prefer closed exterior first; add carcass/detail photos (skip dimension drawings) */
export function productReferencePaths(product: Product): {
  primary: string
  extras: string[]
} {
  const images = product.images?.length
    ? product.images
    : product.image
      ? [product.image]
      : []
  const photos = images.filter((src) => !isDimensionDrawing(src))
  const pool = photos.length ? photos : images
  const primary = pool[0] || product.image
  const extras: string[] = []
  if (pool.length > 1) {
    const last = pool[pool.length - 1]!
    if (last !== primary) extras.push(last)
  }
  if (pool.length > 2) {
    const mid = pool[1]!
    if (mid !== primary && !extras.includes(mid)) extras.push(mid)
  }
  if (pool.length > 3) {
    const third = pool[2]!
    if (third !== primary && !extras.includes(third)) extras.push(third)
  }
  return { primary, extras: extras.slice(0, 3) }
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
  refineModel?: string
  quality?: string
  engine?: string
}

/** Compress / resize room photo for upload + AI (higher res = better room fidelity) */
export async function fileToDataUrl(
  file: File,
  maxSide = 2400,
  quality = 0.92,
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
    const res = await fetch('/api/visualise-status', {
      headers: aiAuthHeaders(),
    })
    if (!res.ok) return { configured: false, mode: 'needs-key' }
    return (await res.json()) as VisualiseStatus
  } catch {
    return { configured: false, mode: 'needs-key' }
  }
}

/** Owner-only: set Fal key with admin PIN (not for customers). */
export async function connectFalKey(
  key: string,
  adminPin?: string,
): Promise<VisualiseStatus> {
  const res = await fetch('/api/visualise-config', {
    method: 'POST',
    headers: aiAuthHeaders(
      adminPin ? { 'X-AI-Admin': adminPin } : undefined,
    ),
    body: JSON.stringify({ key, adminPin }),
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
      headers: aiAuthHeaders(),
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
        visualiseMode: input.visualiseMode ?? 'replace',
        refineImageUrl: input.refineImageUrl,
        changeRequest: input.changeRequest,
      }),
    })

    const data = (await res.json()) as {
      imageUrl?: string
      error?: string
      code?: string
      hint?: string
      quality?: string
      model?: string
    }

    if (res.ok && data.imageUrl) {
      const quality = data.quality ? ` · ${data.quality}` : ''
      const sizeHint =
        input.widthFt && input.heightFt
          ? ` Sized toward ${input.widthFt} × ${input.heightFt}` +
            (input.depthFt ? ` × ${input.depthFt}` : '') +
            ' ft. Presentation guide — final quote uses site measure.'
          : ' Tip: add exact feet size for tighter scale.'
      const refineHint = input.changeRequest?.trim()
        ? ` Updated for: “${input.changeRequest.trim()}”.`
        : ''
      const modeHint =
        input.visualiseMode === 'redesign'
          ? ' Presentable redesign with your Priyabadal product as the hero.'
          : input.visualiseMode === 'install'
            ? ' Product installed into your room photo.'
            : ' Existing furniture replaced with your Priyabadal product.'
      void quality
      return {
        imageUrl: data.imageUrl,
        source: 'ai',
        message:
          (input.refineImageUrl
            ? 'Here’s the updated look from your change.'
            : 'Here’s your room look with the Priyabadal product.') +
          (input.refineImageUrl ? '' : modeHint) +
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
        data.code === 'SUBSCRIPTION_REQUIRED'
          ? 'AI unlock needed'
          : data.code === 'QUOTA_EXCEEDED'
            ? 'Monthly AI limit reached'
            : data.code === 'MISSING_FAL_KEY'
              ? 'AI not connected'
              : exhausted
                ? 'AI credits unavailable'
                : 'Visualise unavailable',
    }
  } catch {
    return {
      source: 'error',
      message: 'Visualise unavailable',
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
