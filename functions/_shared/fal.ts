/** Shared Fal.ai helpers for Cloudflare Pages Functions */

export type Env = {
  FAL_KEY?: string
  FAL_VISUALISE_MODEL?: string
  FAL_REFINE_MODEL?: string
  FAL_CARCASS_MODEL?: string
  FAL_CHAT_MODEL?: string
}

export const PUBLIC_AI_UNTIL_MS = Date.parse('2026-08-24T23:59:59+05:30')
export const PUBLIC_AI_UNTIL_LABEL = '24 Aug 2026'

const DEFAULT_CREATE_MODEL = 'fal-ai/flux-2-pro/edit'
const DEFAULT_REFINE_MODEL = 'fal-ai/flux-pro/kontext'
const DEFAULT_CHAT_MODEL = 'google/gemini-2.5-flash'

export function isPublicAiOpen(now = Date.now()) {
  return now < PUBLIC_AI_UNTIL_MS
}

export function getFalKey(env: Env) {
  return (env.FAL_KEY || '').trim()
}

export function getCreateModel(env: Env) {
  return env.FAL_VISUALISE_MODEL || DEFAULT_CREATE_MODEL
}

export function getRefineModel(env: Env) {
  return env.FAL_REFINE_MODEL || DEFAULT_REFINE_MODEL
}

export function getCarcassModel(env: Env) {
  return env.FAL_CARCASS_MODEL || getCreateModel(env)
}

export function getChatModel(env: Env) {
  return env.FAL_CHAT_MODEL || DEFAULT_CHAT_MODEL
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export function corsPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export function missingKeyResponse() {
  const open = isPublicAiOpen()
  return json(
    {
      error: open
        ? 'Public AI is open until 24 Aug, but the server Fal key is not set yet.'
        : 'Professional AI is not connected yet',
      code: 'MISSING_FAL_KEY',
      hint: open
        ? 'Owner: add FAL_KEY in Cloudflare Pages → Settings → Environment variables.'
        : 'Paste your Fal.ai API key to enable real renders.',
      publicOpen: open,
      publicOpenUntil: PUBLIC_AI_UNTIL_LABEL,
    },
    503,
  )
}

function parseDataUrl(dataUrl: string): { contentType: string; buffer: ArrayBuffer } | null {
  const m = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl)
  if (!m) return null
  const contentType = m[1] || 'application/octet-stream'
  const binary = atob(m[2] || '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return { contentType, buffer: bytes.buffer }
}

async function uploadToFal(
  falKey: string,
  contentType: string,
  buffer: ArrayBuffer,
  fileName: string,
): Promise<string> {
  const tokenRes = await fetch(
    'https://rest.alpha.fal.ai/storage/auth/token?storage_type=fal-cdn-v3',
    {
      method: 'POST',
      headers: {
        Authorization: `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    },
  )
  const tokenText = await tokenRes.text()
  let tokenJson: {
    token?: string
    base_upload_url?: string
    detail?: string
  } = {}
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
  const uploadJson = (await uploadRes.json()) as {
    access_url?: string
    url?: string
    file_url?: string
    detail?: string
  }
  if (!uploadRes.ok) {
    throw new Error(uploadJson.detail || `Fal file upload failed (${uploadRes.status})`)
  }
  const url = uploadJson.access_url || uploadJson.url || uploadJson.file_url
  if (!url) throw new Error('Fal upload returned no URL')
  return url
}

export async function resolveImageUrl(
  falKey: string,
  src: string,
  fileName: string,
): Promise<string> {
  if (/^https?:\/\//i.test(src)) return src
  const parsed = parseDataUrl(src)
  if (parsed) {
    return uploadToFal(falKey, parsed.contentType, parsed.buffer, fileName)
  }
  // Relative site path — fetch from this deployment origin is handled by caller
  throw new Error('Unsupported image source')
}

export async function resolveImageUrlWithOrigin(
  falKey: string,
  src: string,
  fileName: string,
  origin: string,
): Promise<string> {
  if (/^https?:\/\//i.test(src)) return src
  if (src.startsWith('data:')) return resolveImageUrl(falKey, src, fileName)
  if (src.startsWith('/')) {
    const abs = `${origin.replace(/\/$/, '')}${src}`
    const res = await fetch(abs)
    if (!res.ok) throw new Error(`Could not fetch image (${res.status})`)
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const buffer = await res.arrayBuffer()
    return uploadToFal(falKey, contentType, buffer, fileName)
  }
  return resolveImageUrl(falKey, src, fileName)
}
