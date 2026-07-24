import type { Connect, Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

type VisualiseBody = {
  roomDataUrl: string
  productImageUrl: string
  productName: string
  categoryName: string
  colour: string
  colourLabel: string
  notes?: string
}

/** Runtime key so owner can paste FAL_KEY without restarting */
let runtimeFalKey = process.env.FAL_KEY || process.env.VITE_FAL_KEY || ''

function getFalKey() {
  return runtimeFalKey || process.env.FAL_KEY || process.env.VITE_FAL_KEY || ''
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function parseDataUrl(dataUrl: string): { contentType: string; buffer: Buffer } | null {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl)
  if (!match) return null
  return {
    contentType: match[1] || 'image/jpeg',
    buffer: Buffer.from(match[2] || '', 'base64'),
  }
}

async function fetchAsBuffer(url: string): Promise<{ contentType: string; buffer: Buffer }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not fetch image (${res.status})`)
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const buffer = Buffer.from(await res.arrayBuffer())
  return { contentType, buffer }
}

/**
 * Upload to Fal CDN v3 (token + raw PUT/POST).
 * Tunnel / localhost URLs are not readable by Fal models.
 */
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

async function resolveImageUrl(
  falKey: string,
  src: string,
  fileName: string,
): Promise<string> {
  if (src.startsWith('data:')) {
    const parsed = parseDataUrl(src)
    if (!parsed) throw new Error('Invalid image data')
    try {
      return await uploadToFal(falKey, parsed.contentType, parsed.buffer, fileName)
    } catch {
      // Fal models also accept data URIs when under size limits
      if (src.length < 4_500_000) return src
      throw new Error('Could not upload room/product image to Fal storage')
    }
  }

  if (/^https?:\/\//i.test(src)) {
    const { contentType, buffer } = await fetchAsBuffer(src)
    return uploadToFal(falKey, contentType, buffer, fileName)
  }

  throw new Error('Unsupported image source')
}

function buildPrompt(body: VisualiseBody) {
  const space = body.categoryName.toLowerCase()
  return [
    'You are a professional interior visualiser for Priyabadal Homes (India).',
    `IMAGE 1 = customer's real ${space} / room photograph — keep this exact camera angle, walls, floor, ceiling, windows, appliances, and lighting.`,
    `IMAGE 2 = exact product reference photo of "${body.productName}" from Priyabadal Homes.`,
    'Task: Photorealistically redesign IMAGE 1 by installing the product style from IMAGE 2 onto the correct surfaces (cabinets, shutters, doors, panels, wardrobe, or temple as relevant).',
    'Match door styles, groove profiles, handles, proportions, materials, and detailing from IMAGE 2 as closely as possible.',
    `Cabinet / product finish colour: ${body.colourLabel} (${body.colour}).`,
    'Do NOT invent a different product brand. Do NOT paste IMAGE 2 as a floating sticker or collage.',
    'Blend seamlessly with correct perspective, contact shadows, reflections, and ambient light.',
    'No text, logos, watermarks, or UI overlays in the output.',
    'Output a single photorealistic interior photograph suitable for a showroom quote.',
    body.notes ? `Customer note: ${body.notes}` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

async function handleVisualise(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.end()
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  const falKey = getFalKey()
  if (!falKey) {
    sendJson(res, 503, {
      error: 'Professional AI is not connected yet',
      code: 'MISSING_FAL_KEY',
      hint: 'Paste your Fal.ai API key on the Visualise page to enable real renders.',
    })
    return
  }

  try {
    const raw = await readBody(req)
    const body = JSON.parse(raw) as VisualiseBody

    if (!body.roomDataUrl || !body.productImageUrl || !body.productName) {
      sendJson(res, 400, { error: 'Missing room photo or product' })
      return
    }

    const [roomUrl, productUrl] = await Promise.all([
      resolveImageUrl(falKey, body.roomDataUrl, 'room.jpg'),
      resolveImageUrl(falKey, body.productImageUrl, 'product.jpg'),
    ])

    const model =
      process.env.FAL_VISUALISE_MODEL || 'fal-ai/nano-banana-pro/edit'

    const falRes = await fetch(`https://fal.run/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: buildPrompt(body),
        image_urls: [roomUrl, productUrl],
        num_images: 1,
        aspect_ratio: 'auto',
        output_format: 'jpeg',
        resolution: '1K',
      }),
    })

    const falJson = (await falRes.json()) as {
      images?: Array<{ url?: string }>
      image?: { url?: string }
      detail?: string
      error?: string
      message?: string
    }

    if (!falRes.ok) {
      sendJson(res, 502, {
        error:
          falJson.detail ||
          falJson.error ||
          falJson.message ||
          'Professional AI generation failed',
        code: 'FAL_ERROR',
      })
      return
    }

    const imageUrl = falJson.images?.[0]?.url || falJson.image?.url || null
    if (!imageUrl) {
      sendJson(res, 502, { error: 'AI returned no image', code: 'EMPTY_RESULT' })
      return
    }

    sendJson(res, 200, {
      imageUrl,
      provider: 'fal',
      model,
      mode: 'product-referenced-pro',
    })
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : 'Visualise failed',
      code: 'SERVER_ERROR',
    })
  }
}

async function handleConfig(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.end()
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    const raw = await readBody(req)
    const body = JSON.parse(raw) as { key?: string }
    const key = (body.key || '').trim()
    if (!key || key.length < 10) {
      sendJson(res, 400, { error: 'Paste a valid Fal.ai API key' })
      return
    }
    runtimeFalKey = key
    process.env.FAL_KEY = key
    sendJson(res, 200, {
      configured: true,
      mode: 'paid-ai',
      model: process.env.FAL_VISUALISE_MODEL || 'fal-ai/nano-banana-pro/edit',
    })
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : 'Could not save key',
    })
  }
}

function attach(middlewares: Connect.Server) {
  middlewares.use('/api/visualise-config', (req, res, next) => {
    void handleConfig(req, res).catch(next)
  })
  middlewares.use('/api/visualise', (req, res, next) => {
    void handleVisualise(req, res).catch(next)
  })
  middlewares.use('/api/visualise-status', (_req, res) => {
    sendJson(res, 200, {
      configured: Boolean(getFalKey()),
      mode: getFalKey() ? 'paid-ai' : 'needs-key',
      model: process.env.FAL_VISUALISE_MODEL || 'fal-ai/nano-banana-pro/edit',
    })
  })
}

/** Dev + preview middleware for professional product-referenced interior AI */
export function visualiseApiPlugin(): Plugin {
  return {
    name: 'priyabadal-visualise-api',
    configureServer(server) {
      attach(server.middlewares)
    },
    configurePreviewServer(server) {
      attach(server.middlewares)
    },
  }
}
