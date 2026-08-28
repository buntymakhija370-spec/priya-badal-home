/** Shared Gemini helpers for Cloudflare Pages Functions */

export const IMAGE_MODEL = 'gemini-2.5-flash-image'
export const CHAT_MODEL = 'gemini-2.5-flash'
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

export type Env = {
  GEMINI_API_KEY?: string
  AI_REQUIRE_SUBSCRIPTION?: string
  AI_ADMIN_PIN?: string
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-AI-Admin, X-AI-Token',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
  })
}

export function options(): Response {
  return json({ ok: true })
}

export function geminiKey(env: Env): string {
  return (env.GEMINI_API_KEY || '').trim()
}

export function requireSubscription(env: Env): boolean {
  const v = (env.AI_REQUIRE_SUBSCRIPTION || 'false').toLowerCase()
  return v === 'true' || v === '1' || v === 'on'
}

export async function geminiChat(
  env: Env,
  opts: { system: string; prompt: string; history?: Array<{ role: string; text: string }> },
): Promise<{ reply: string; model: string }> {
  const key = geminiKey(env)
  if (!key) throw new Error('GEMINI_API_KEY is not set on the server')

  const history =
    opts.history?.map((h) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.text }],
    })) ?? []

  const body = {
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: [...history, { role: 'user', parts: [{ text: opts.prompt }] }],
    generationConfig: { temperature: 0.35, maxOutputTokens: 1100 },
  }

  const url = `${GEMINI_BASE}/models/${CHAT_MODEL}:generateContent?key=${encodeURIComponent(key)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    error?: { message?: string }
  }
  if (!res.ok) throw new Error(data.error?.message || `Gemini chat failed (${res.status})`)
  const reply =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''
  if (!reply.trim()) throw new Error('Empty Gemini reply')
  return { reply, model: CHAT_MODEL }
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl)
  if (!match) return null
  return { mimeType: match[1] || 'image/jpeg', data: match[2] || '' }
}

async function loadInlineImage(
  src: string,
  origin?: string,
): Promise<{ mimeType: string; data: string } | null> {
  if (src.startsWith('data:')) return parseDataUrl(src)
  let url = src
  if (src.startsWith('/') && origin) url = `${origin.replace(/\/$/, '')}${src}`
  if (!(url.startsWith('http://') || url.startsWith('https://'))) return null
  const res = await fetch(url)
  if (!res.ok) return null
  const buf = await res.arrayBuffer()
  const mimeType = res.headers.get('content-type') || 'image/jpeg'
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return { mimeType, data: btoa(binary) }
}

export async function geminiEditImage(
  env: Env,
  opts: { images: string[]; prompt: string; system?: string; origin?: string },
): Promise<{ dataUrl: string; model: string }> {
  const key = geminiKey(env)
  if (!key) throw new Error('GEMINI_API_KEY is not set on the server')

  const inline: Array<{ inlineData: { mimeType: string; data: string } }> = []
  for (const src of opts.images) {
    const img = await loadInlineImage(src, opts.origin)
    if (img) inline.push({ inlineData: img })
  }
  if (!inline.length) throw new Error('No usable images for Gemini visualise')

  const body: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: [...inline, { text: opts.prompt }],
      },
    ],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  }
  if (opts.system?.trim()) {
    body.systemInstruction = { parts: [{ text: opts.system.trim() }] }
  }

  const url = `${GEMINI_BASE}/models/${IMAGE_MODEL}:generateContent?key=${encodeURIComponent(key)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string; inlineData?: { mimeType?: string; data?: string } }> }
    }>
    error?: { message?: string }
  }
  if (!res.ok) throw new Error(data.error?.message || `Gemini image failed (${res.status})`)

  const parts = data.candidates?.[0]?.content?.parts || []
  for (const part of parts) {
    if (part.inlineData?.data) {
      const mime = part.inlineData.mimeType || 'image/png'
      return {
        dataUrl: `data:${mime};base64,${part.inlineData.data}`,
        model: IMAGE_MODEL,
      }
    }
  }
  throw new Error('Gemini returned no image')
}
