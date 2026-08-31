/**
 * Fal.ai provider — image edit (visualise) + any-llm chat.
 * Preferred for event demos when Google AI Studio billing is blocked.
 */
import { loadEnv } from 'vite'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

let runtimeFalKey = ''

/** Multi-reference room + product install */
export const DEFAULT_FAL_CREATE_MODEL = 'fal-ai/flux-2-pro/edit'
/** Single-image refine edits */
export const DEFAULT_FAL_REFINE_MODEL = 'fal-ai/flux-pro/kontext'
/** Chat via Fal any-llm (billed on Fal, not Google AI Studio) */
export const DEFAULT_FAL_CHAT_MODEL = 'openai/gpt-4o-mini'

const KEY_STORE_PATH = resolve(process.cwd(), 'data/fal-key.json')

function readPersistedFalKey(): string {
  try {
    if (!existsSync(KEY_STORE_PATH)) return ''
    const raw = JSON.parse(readFileSync(KEY_STORE_PATH, 'utf8')) as {
      falKey?: string
    }
    return (raw.falKey || '').trim()
  } catch {
    return ''
  }
}

function persistFalKey(key: string) {
  try {
    mkdirSync(dirname(KEY_STORE_PATH), { recursive: true })
    writeFileSync(
      KEY_STORE_PATH,
      JSON.stringify({ falKey: key, updatedAt: new Date().toISOString() }, null, 2),
      'utf8',
    )
  } catch {
    /* non-fatal */
  }
}

export function hydrateFalEnv(mode = 'development') {
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

  if (!runtimeFalKey) {
    runtimeFalKey =
      process.env.FAL_KEY ||
      process.env.VITE_FAL_KEY ||
      readPersistedFalKey() ||
      ''
  }
}

export function getFalKey() {
  return (
    runtimeFalKey ||
    process.env.FAL_KEY ||
    process.env.VITE_FAL_KEY ||
    readPersistedFalKey() ||
    ''
  )
}

export function setFalKey(key: string) {
  runtimeFalKey = key.trim()
  process.env.FAL_KEY = runtimeFalKey
  if (runtimeFalKey) persistFalKey(runtimeFalKey)
}

export function falConfigured() {
  return Boolean(getFalKey())
}

export function getFalCreateModel() {
  return process.env.FAL_VISUALISE_MODEL || DEFAULT_FAL_CREATE_MODEL
}

export function getFalRefineModel() {
  return process.env.FAL_REFINE_MODEL || DEFAULT_FAL_REFINE_MODEL
}

export function getFalCarcassModel() {
  return process.env.FAL_CARCASS_MODEL || getFalCreateModel()
}

export function getFalChatModel() {
  return process.env.FAL_CHAT_MODEL || DEFAULT_FAL_CHAT_MODEL
}

function parseDataUrl(dataUrl: string): { contentType: string; buffer: Buffer } | null {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl)
  if (!match) return null
  return {
    contentType: match[1] || 'image/jpeg',
    buffer: Buffer.from(match[2] || '', 'base64'),
  }
}

function contentTypeForPath(filePath: string): string {
  const lower = filePath.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  return 'image/jpeg'
}

/** Read /products/... from local public/ or dist/ (preview ports change; avoid hardcoded origin). */
function readLocalPublicAsset(
  src: string,
): { contentType: string; buffer: Buffer } | null {
  if (!src.startsWith('/')) return null
  const rel = src.replace(/^\//, '')
  for (const root of ['public', 'dist']) {
    const filePath = resolve(process.cwd(), root, rel)
    if (!existsSync(filePath)) continue
    try {
      return {
        contentType: contentTypeForPath(filePath),
        buffer: readFileSync(filePath),
      }
    } catch {
      /* try next root */
    }
  }
  return null
}

async function fetchAsBuffer(url: string): Promise<{ contentType: string; buffer: Buffer }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not fetch image (${res.status})`)
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const buffer = Buffer.from(await res.arrayBuffer())
  return { contentType, buffer }
}

async function uploadToFal(
  falKey: string,
  contentType: string,
  buffer: Buffer,
  fileName: string,
): Promise<string> {
  const tokenRes = await fetch(
    'https://rest.alpha.fal.ai/storage/auth/token?storage_type=fal-cdn-v3',
    {
      method: 'POST',
      headers: {
        Authorization: `Key ${falKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: '{}',
    },
  )

  const tokenText = await tokenRes.text()
  let tokenJson: { token?: string; base_upload_url?: string; detail?: string } = {}
  try {
    tokenJson = JSON.parse(tokenText) as typeof tokenJson
  } catch {
    throw new Error(`Fal upload auth failed: ${tokenText.slice(0, 200)}`)
  }

  if (!tokenRes.ok || !tokenJson.token) {
    throw new Error(tokenJson.detail || `Fal upload auth failed (${tokenRes.status})`)
  }

  const base = (tokenJson.base_upload_url || 'https://v3.fal.media').replace(/\/$/, '')
  const uploadRes = await fetch(`${base}/files/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenJson.token}`,
      'Content-Type': contentType,
      'X-Fal-File-Name': fileName,
    },
    body: buffer,
  })

  const uploadText = await uploadRes.text()
  let uploadJson: {
    url?: string
    file_url?: string
    access_url?: string
    detail?: string
  } = {}
  try {
    uploadJson = JSON.parse(uploadText) as typeof uploadJson
  } catch {
    throw new Error(`Fal file upload failed: ${uploadText.slice(0, 200)}`)
  }

  if (!uploadRes.ok) {
    throw new Error(uploadJson.detail || `Fal file upload failed (${uploadRes.status})`)
  }

  const url = uploadJson.access_url || uploadJson.url || uploadJson.file_url
  if (!url) throw new Error('Fal upload returned no URL')
  return url
}

export async function resolveFalImageUrl(
  src: string,
  fileName: string,
): Promise<string> {
  const falKey = getFalKey()
  if (!falKey) throw new Error('FAL_KEY is not set')

  if (src.startsWith('data:')) {
    const parsed = parseDataUrl(src)
    if (!parsed) throw new Error('Invalid image data')
    try {
      return await uploadToFal(falKey, parsed.contentType, parsed.buffer, fileName)
    } catch {
      if (src.length < 4_500_000) return src
      throw new Error('Could not upload room/product image to Fal storage')
    }
  }

  if (/^https?:\/\//i.test(src)) {
    const { contentType, buffer } = await fetchAsBuffer(src)
    return uploadToFal(falKey, contentType, buffer, fileName)
  }

  if (src.startsWith('/')) {
    const local = readLocalPublicAsset(src)
    if (local) {
      return uploadToFal(falKey, local.contentType, local.buffer, fileName)
    }
    const origins = [
      process.env.PUBLIC_ORIGIN,
      'http://127.0.0.1:4174',
      'http://127.0.0.1:4173',
      'http://127.0.0.1:5173',
    ].filter((v): v is string => Boolean(v && v.trim()))
    let lastErr: unknown
    for (const origin of origins) {
      try {
        const { contentType, buffer } = await fetchAsBuffer(
          `${origin.replace(/\/$/, '')}${src}`,
        )
        return uploadToFal(falKey, contentType, buffer, fileName)
      } catch (err) {
        lastErr = err
      }
    }
    throw lastErr instanceof Error
      ? lastErr
      : new Error(`Could not load local image ${src}`)
  }

  throw new Error('Unsupported image source')
}

export async function falEditImage(opts: {
  imageUrls: string[]
  prompt: string
  model?: string
  refine?: boolean
}): Promise<{ imageUrl: string; model: string }> {
  const falKey = getFalKey()
  if (!falKey) throw new Error('FAL_KEY is not set')

  const model =
    opts.model ||
    (opts.refine ? getFalRefineModel() : getFalCreateModel())

  const falPayload: Record<string, unknown> = opts.refine
    ? {
        prompt: opts.prompt,
        image_url: opts.imageUrls[0],
        output_format: 'jpeg',
        safety_tolerance: '5',
      }
    : {
        prompt: opts.prompt,
        image_urls: opts.imageUrls,
        num_images: 1,
        output_format: 'jpeg',
        safety_tolerance: '5',
      }

  const falRes = await fetch(`https://fal.run/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(falPayload),
  })

  const falJson = (await falRes.json()) as {
    images?: Array<{ url?: string }>
    image?: { url?: string }
    detail?: string
    error?: string
    message?: string
  }

  if (!falRes.ok) {
    throw new Error(
      falJson.detail ||
        falJson.error ||
        falJson.message ||
        `Fal image request failed (${falRes.status})`,
    )
  }

  const imageUrl = falJson.images?.[0]?.url || falJson.image?.url || null
  if (!imageUrl) throw new Error('Fal returned no image URL')
  return { imageUrl, model }
}

export async function falChat(opts: {
  system: string
  prompt: string
  model?: string
}): Promise<{ reply: string; model: string }> {
  const falKey = getFalKey()
  if (!falKey) throw new Error('FAL_KEY is not set')

  const model = opts.model || getFalChatModel()
  const falRes = await fetch('https://fal.run/fal-ai/any-llm', {
    method: 'POST',
    headers: {
      Authorization: `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      system_prompt: opts.system.slice(0, 120_000),
      prompt: opts.prompt.slice(0, 24_000),
      temperature: 0.4,
      priority: 'latency',
      max_tokens: 900,
    }),
  })

  const falJson = (await falRes.json()) as {
    output?: string
    error?: string
    detail?: string
    message?: string
  }

  if (!falRes.ok) {
    throw new Error(
      falJson.error ||
        falJson.detail ||
        falJson.message ||
        `Fal chat failed (${falRes.status})`,
    )
  }

  const reply = (falJson.output || '').trim()
  if (!reply) throw new Error('Fal chat returned an empty reply')
  return { reply, model }
}
