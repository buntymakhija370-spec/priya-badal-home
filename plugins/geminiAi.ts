/**
 * Google Gemini AI (cheap Nano Banana / Flash) — replaces Fal for
 * visualise, refine, carcass, and chat.
 */
import { loadEnv } from 'vite'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export type GeminiInlineImage = {
  mimeType: string
  data: string // base64 without data: prefix
}

/** Runtime key so owner can paste without restarting */
let runtimeGeminiKey = ''

/** Cheap image model (Nano Banana / Gemini 2.5 Flash Image) */
export const DEFAULT_IMAGE_MODEL = 'gemini-2.5-flash-image'
/** Cheap text model for sales chat */
export const DEFAULT_CHAT_MODEL = 'gemini-2.5-flash'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

export function hydrateGeminiEnv(mode = 'development') {
  try {
    const env = loadEnv(mode, process.cwd(), '')
    for (const [key, value] of Object.entries(env)) {
      if (value != null && value !== '' && !process.env[key]) {
        process.env[key] = value
      }
    }
  } catch {
    /* fall through */
  }

  for (const name of ['.env.local', '.env']) {
    const file = resolve(process.cwd(), name)
    if (!existsSync(file)) continue
    try {
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eq = trimmed.indexOf('=')
        if (eq <= 0) continue
        const key = trimmed.slice(0, eq).trim()
        let value = trimmed.slice(eq + 1).trim()
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1)
        }
        if (key && value && !process.env[key]) process.env[key] = value
      }
    } catch {
      /* ignore */
    }
  }

  if (!runtimeGeminiKey) {
    runtimeGeminiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      // Legacy Fal key slot — if owner already set FAL_KEY by mistake, ignore for Gemini
      ''
  }
}

export function getGeminiKey() {
  return (
    runtimeGeminiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    ''
  )
}

export function setGeminiKey(key: string) {
  runtimeGeminiKey = key.trim()
  process.env.GEMINI_API_KEY = runtimeGeminiKey
}

export function getImageModel() {
  return process.env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL
}

export function getChatModel() {
  return process.env.GEMINI_CHAT_MODEL || DEFAULT_CHAT_MODEL
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl)
  if (!match) return null
  return { mimeType: match[1] || 'image/jpeg', data: match[2] || '' }
}

/** Load image from data URL or http(s)/relative path into Gemini inlineData */
export async function loadInlineImage(
  src: string,
  originBase?: string,
): Promise<GeminiInlineImage> {
  if (src.startsWith('data:')) {
    const parsed = parseDataUrl(src)
    if (!parsed?.data) throw new Error('Invalid image data')
    return { mimeType: parsed.mimeType, data: parsed.data }
  }

  let url = src
  if (src.startsWith('/') && originBase) {
    url = `${originBase.replace(/\/$/, '')}${src}`
  }

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not fetch image (${res.status})`)
  const mimeType = res.headers.get('content-type') || 'image/jpeg'
  const buffer = Buffer.from(await res.arrayBuffer())
  // Cap very large payloads (~6MB base64) by refusing — client should send compressed photos
  if (buffer.length > 4_500_000) {
    throw new Error('Image too large for Gemini — please use a smaller photo')
  }
  return {
    mimeType: mimeType.split(';')[0] || 'image/jpeg',
    data: buffer.toString('base64'),
  }
}

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; inlineData?: { mimeType?: string; data?: string } }> }
    finishReason?: string
  }>
  error?: { message?: string; status?: string; code?: number }
  promptFeedback?: { blockReason?: string }
}

async function generateContent(opts: {
  model: string
  parts: GeminiPart[]
  system?: string
  imageOutput?: boolean
}): Promise<GeminiResponse> {
  const key = getGeminiKey()
  if (!key) throw new Error('GEMINI_API_KEY is not set')

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: opts.parts }],
  }

  if (opts.system?.trim()) {
    body.systemInstruction = {
      parts: [{ text: opts.system.trim() }],
    }
  }

  if (opts.imageOutput) {
    body.generationConfig = {
      responseModalities: ['TEXT', 'IMAGE'],
    }
  } else {
    body.generationConfig = {
      temperature: 0.35,
      maxOutputTokens: 1100,
    }
  }

  const url = `${GEMINI_BASE}/models/${opts.model}:generateContent?key=${encodeURIComponent(key)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const json = (await res.json()) as GeminiResponse
  if (!res.ok) {
    const msg =
      json.error?.message ||
      `Gemini request failed (${res.status})`
    throw new Error(msg)
  }
  if (json.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked the request: ${json.promptFeedback.blockReason}`)
  }
  return json
}

/**
 * Edit / compose images with Gemini Flash Image.
 * Returns a data URL (image/jpeg or image/png).
 */
export async function geminiEditImage(opts: {
  images: GeminiInlineImage[]
  prompt: string
  system?: string
  model?: string
}): Promise<{ dataUrl: string; model: string }> {
  const model = opts.model || getImageModel()
  const parts: GeminiPart[] = [
    ...opts.images.map((img) => ({
      inlineData: { mimeType: img.mimeType, data: img.data },
    })),
    { text: opts.prompt },
  ]

  const json = await generateContent({
    model,
    parts,
    system: opts.system,
    imageOutput: true,
  })

  const responseParts = json.candidates?.[0]?.content?.parts ?? []
  for (const part of responseParts) {
    if (part.inlineData?.data) {
      const mime = part.inlineData.mimeType || 'image/png'
      return {
        dataUrl: `data:${mime};base64,${part.inlineData.data}`,
        model,
      }
    }
  }

  const textBit = responseParts.map((p) => p.text || '').join(' ').trim()
  throw new Error(
    textBit
      ? `Gemini returned text instead of an image: ${textBit.slice(0, 180)}`
      : 'Gemini returned no image',
  )
}

/** Text chat with Gemini Flash */
export async function geminiChat(opts: {
  system: string
  prompt: string
  model?: string
}): Promise<{ reply: string; model: string }> {
  const model = opts.model || getChatModel()
  const json = await generateContent({
    model,
    parts: [{ text: opts.prompt }],
    system: opts.system,
    imageOutput: false,
  })

  const reply = (json.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text || '')
    .join('')
    .trim()

  if (!reply) throw new Error('Gemini returned an empty reply')
  return { reply, model }
}
