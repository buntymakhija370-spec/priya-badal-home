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
  /** Made-to-measure size in feet (from Design my space / calculator) */
  widthFt?: number
  heightFt?: number
  depthFt?: number
  finishLabel?: string
  scopeLabel?: string
  /** Customer room photo or architect drawing (plan / elevation / section) */
  inputKind?: 'photo' | 'drawing'
}

type CarcassLiveBody = {
  carcassImageUrl: string
  productName: string
  category: 'wardrobe' | 'kitchen'
  widthFt: number
  heightFt: number
  depthFt: number
  baySummary: string
  finishLabel?: string
  thicknessLabel?: string
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
  const isDrawing = body.inputKind === 'drawing'
  const hasSize =
    Number(body.widthFt) > 0 && Number(body.heightFt) > 0
  const sizeLine = hasSize
    ? [
        `CRITICAL MADE-TO-MEASURE SIZE (feet): width ${body.widthFt} ft × height ${body.heightFt} ft` +
          (Number(body.depthFt) > 0 ? ` × depth ${body.depthFt} ft` : '') +
          '.',
        'The installed product MUST match this live size — not the sample proportions from IMAGE 2.',
        `If IMAGE 2 shows a different width/height, RESCALE it: span about ${body.widthFt} ft along the wall and about ${body.heightFt} ft tall` +
          (Number(body.depthFt) > 0
            ? `, projecting about ${body.depthFt} ft deep from the wall`
            : '') +
          '.',
        space.includes('wardrobe')
          ? 'For wardrobe: build a continuous floor-to-near-ceiling run at the given width; keep door/panel style from IMAGE 2 but change overall scale to the live feet sizes.'
          : space.includes('kitchen')
            ? 'For kitchen: fit cabinetry to the given run width/height/depth; keep shutter style from IMAGE 2 but respect live feet sizes.'
            : 'Fit the temple / product into the niche or wall at the given live feet sizes while keeping the design language of IMAGE 2.',
      ].join(' ')
    : isDrawing
      ? 'Read dimensions from the drawing if marked; otherwise scale the product naturally to the indicated wall / run.'
      : 'Scale the product naturally to the room opening visible in IMAGE 1.'

  if (isDrawing) {
    return [
      'You are a professional interior architect visualiser for Priyabadal Homes (India).',
      'You understand interior architect drawings: floor plans, elevations, sections, CAD layouts, hand sketches, and dimensioned drawings.',
      `IMAGE 1 = customer's architect drawing / plan / elevation / sketch for a ${space} — use its layout, wall runs, openings, and marked sizes as the design brief.`,
      `IMAGE 2 = catalog style reference of "${body.productName}" from the Priyabadal Homes product list (doors, shutters, finish, detailing).`,
      'Task: Create a photorealistic interior visualisation that follows IMAGE 1 as the architectural layout, and installs the Priyabadal product style from IMAGE 2 on the correct walls / units.',
      'Interpret plan lines, elevation outlines, kitchen/wardrobe runs, niches, and openings correctly — do not invent a random room that ignores the drawing.',
      sizeLine,
      'Match door styles, groove profiles, handles, materials, and detailing from IMAGE 2 as closely as possible.',
      `Cabinet / product finish colour cue: ${body.colourLabel} (${body.colour}).`,
      body.finishLabel ? `Finish selection: ${body.finishLabel}.` : '',
      body.scopeLabel ? `Build scope: ${body.scopeLabel}.` : '',
      'Do NOT invent a different product brand. Do NOT paste IMAGE 2 as a floating sticker or collage.',
      'Convert the drawing into a believable finished interior photograph (eye-level or natural interior camera), not a CAD screenshot.',
      'No text, logos, dimension arrows, watermarks, or UI overlays in the output.',
      'Output a single photorealistic interior photograph suitable for a showroom quote.',
      body.notes ? `Customer note: ${body.notes}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  return [
    'You are a professional interior visualiser for Priyabadal Homes (India).',
    `IMAGE 1 = customer's real ${space} / room photograph — keep this exact camera angle, walls, floor, ceiling, windows, doors, and lighting.`,
    `IMAGE 2 = style reference of "${body.productName}" from Priyabadal Homes (design / finish / detailing only — NOT the final size).`,
    'Task: Photorealistically redesign IMAGE 1 by installing that product style onto the correct wall/surfaces in IMAGE 1.',
    sizeLine,
    'Match door styles, groove profiles, handles, materials, and detailing from IMAGE 2 as closely as possible.',
    `Cabinet / product finish colour cue: ${body.colourLabel} (${body.colour}).`,
    body.finishLabel ? `Finish selection: ${body.finishLabel}.` : '',
    body.scopeLabel ? `Build scope: ${body.scopeLabel}.` : '',
    'Do NOT invent a different product brand. Do NOT paste IMAGE 2 as a floating sticker or collage.',
    'Do NOT keep a tiny sample-sized unit if the customer size is larger — fill the intended wall run.',
    'Blend seamlessly with correct perspective, contact shadows, reflections, and ambient light.',
    'No text, logos, dimension arrows, watermarks, or UI overlays in the output.',
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

    const aspect =
      Number(body.widthFt) > 0 && Number(body.heightFt) > 0
        ? aspectFromFeet(Number(body.widthFt), Number(body.heightFt))
        : 'auto'

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
        aspect_ratio: aspect,
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

function aspectFromFeet(widthFt: number, heightFt: number): string {
  const ratio = widthFt / Math.max(heightFt, 0.1)
  if (ratio >= 1.7) return '16:9'
  if (ratio >= 1.25) return '4:3'
  if (ratio >= 0.95) return '1:1'
  if (ratio >= 0.7) return '3:4'
  return '9:16'
}

function buildCarcassLivePrompt(body: CarcassLiveBody) {
  const kind = body.category === 'kitchen' ? 'kitchen carcass / cabinetry' : 'wardrobe carcass'
  const w = Number(body.widthFt)
  const h = Number(body.heightFt)
  const d = Number(body.depthFt)
  return [
    'You are a professional furniture visualiser for Priyabadal Homes (India).',
    'IMAGE 1 = style reference for open carcass / interior (materials, lighting, hardware language ONLY).',
    `Task: Create ONE photorealistic ${kind} at the customer's LIVE made-to-measure size — not a copy of the sample scale.`,
    `LIVE SIZE IN FEET (mandatory): width ${w} ft × height ${h} ft × depth ${d} ft.`,
    `Overall façade must read as approximately ${w} feet wide and ${h} feet tall, with carcass depth about ${d} feet.`,
    `Storage bay plan left-to-right (scale bay widths so they add up to ~${w} ft): ${body.baySummary}.`,
    body.finishLabel ? `Finish: ${body.finishLabel}.` : '',
    body.thicknessLabel ? `Board thickness look: ${body.thicknessLabel}.` : '',
    'Keep wood tone, LED style, and hardware language from IMAGE 1.',
    'If IMAGE 1 is narrower/shorter than the live size, WIDEN and HEIGHTEN the unit — do not output the sample size.',
    'If IMAGE 1 is larger, shrink to the live feet sizes.',
    'Show a full open carcass elevation (doors open / no doors), realistic shelves, hanging rods, drawers as per the bay plan.',
    'Include floor + wall edges for scale. No text, logos, dimension arrows, or watermarks.',
    'Output a single showroom-quality photograph for quotation.',
    body.notes ? `Customer note: ${body.notes}` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

async function handleCarcassLive(req: IncomingMessage, res: ServerResponse) {
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
      hint: 'Paste your Fal.ai API key to generate live-size carcass renders.',
    })
    return
  }

  try {
    const raw = await readBody(req)
    const body = JSON.parse(raw) as CarcassLiveBody

    if (
      !body.carcassImageUrl ||
      !body.productName ||
      !body.widthFt ||
      !body.heightFt ||
      !body.baySummary
    ) {
      sendJson(res, 400, { error: 'Missing carcass image, size, or layout' })
      return
    }

    const imageUrl = await resolveImageUrl(
      falKey,
      body.carcassImageUrl,
      'carcass-ref.jpg',
    )

    const model =
      process.env.FAL_CARCASS_MODEL ||
      process.env.FAL_VISUALISE_MODEL ||
      'fal-ai/nano-banana-pro/edit'

    const falRes = await fetch(`https://fal.run/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: buildCarcassLivePrompt(body),
        image_urls: [imageUrl],
        num_images: 1,
        aspect_ratio: aspectFromFeet(Number(body.widthFt), Number(body.heightFt)),
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
          'Live-size carcass AI failed',
        code: 'FAL_ERROR',
      })
      return
    }

    const outUrl = falJson.images?.[0]?.url || falJson.image?.url || null
    if (!outUrl) {
      sendJson(res, 502, { error: 'AI returned no image', code: 'EMPTY_RESULT' })
      return
    }

    sendJson(res, 200, {
      imageUrl: outUrl,
      provider: 'fal',
      model,
      mode: 'live-size-carcass',
      size: {
        widthFt: body.widthFt,
        heightFt: body.heightFt,
        depthFt: body.depthFt,
      },
    })
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : 'Carcass live AI failed',
      code: 'SERVER_ERROR',
    })
  }
}

function attach(middlewares: Connect.Server) {
  middlewares.use('/api/visualise-config', (req, res, next) => {
    void handleConfig(req, res).catch(next)
  })
  middlewares.use('/api/carcass-live', (req, res, next) => {
    void handleCarcassLive(req, res).catch(next)
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
