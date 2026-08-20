import { loadEnv, type Connect, type Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

type VisualiseBody = {
  roomDataUrl: string
  productImageUrl: string
  /** Extra catalog refs (e.g. detail / carcass) for closer product match */
  productImageUrls?: string[]
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
  /** Previous AI visualisation URL/data — used to apply follow-up change commands */
  refineImageUrl?: string
  /** Specific change to apply on the current AI photo */
  changeRequest?: string
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
let runtimeFalKey = ''

/** Multi-reference room + product install (create / carcass) */
const DEFAULT_CREATE_MODEL = 'fal-ai/flux-2-pro/edit'
/** Single-image targeted edits (chat “change something”) */
const DEFAULT_REFINE_MODEL = 'fal-ai/flux-pro/kontext'

/** Load .env into process.env — Vite may import this plugin before loadEnv runs */
function hydrateFalEnv(mode = 'development') {
  try {
    const env = loadEnv(mode, process.cwd(), '')
    for (const [key, value] of Object.entries(env)) {
      if (value != null && value !== '' && !process.env[key]) {
        process.env[key] = value
      }
    }
  } catch {
    // fall through to manual .env parse
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
    runtimeFalKey = process.env.FAL_KEY || process.env.VITE_FAL_KEY || ''
  }
}

hydrateFalEnv(process.env.NODE_ENV === 'production' ? 'production' : 'development')

function getFalKey() {
  return (
    runtimeFalKey ||
    process.env.FAL_KEY ||
    process.env.VITE_FAL_KEY ||
    ''
  )
}

function getCreateModel() {
  return process.env.FAL_VISUALISE_MODEL || DEFAULT_CREATE_MODEL
}

function getRefineModel() {
  return process.env.FAL_REFINE_MODEL || DEFAULT_REFINE_MODEL
}

function getCarcassModel() {
  return process.env.FAL_CARCASS_MODEL || getCreateModel()
}

/** Conversational sales chatbot (Fal any-llm) */
const DEFAULT_CHAT_MODEL = 'google/gemini-2.5-flash'

function getChatModel() {
  return process.env.FAL_CHAT_MODEL || DEFAULT_CHAT_MODEL
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
  const isRefine = Boolean(body.refineImageUrl && body.changeRequest?.trim())
  const hasExtraProduct = Boolean(body.productImageUrls?.length)
  const hasSize =
    Number(body.widthFt) > 0 && Number(body.heightFt) > 0
  const sizeLine = hasSize
    ? [
        `INSTALL SIZE (feet, for the furniture only — do NOT change the photo aspect ratio): width ${body.widthFt} ft × height ${body.heightFt} ft` +
          (Number(body.depthFt) > 0 ? ` × depth ${body.depthFt} ft` : '') +
          '.',
        'Rescale the catalog product to this live size on the wall. Keep IMAGE 1 camera framing exactly.',
        space.includes('wardrobe')
          ? `Wardrobe must read as about ${body.widthFt} ft wide and ${body.heightFt} ft tall on the wall (floor-to-near-ceiling if height is tall).`
          : space.includes('kitchen')
            ? `Kitchen run must fit about ${body.widthFt} ft width and ${body.heightFt} ft shutter/cabinet height.`
            : `Product must fit about ${body.widthFt} ft × ${body.heightFt} ft on the intended wall/niche.`,
      ].join(' ')
    : isDrawing
      ? 'Read marked dimensions from the drawing when present; otherwise fit the product to the indicated wall run.'
      : 'Scale the product to the natural wall opening in IMAGE 1.'

  const productMatch = [
    `Product to match: "${body.productName}" (Priyabadal Homes catalog).`,
    'IMAGE 2 = CLOSED EXTERIOR / façade reference — match door layout, panel grooves, handle style, edge profile, and finish as closely as possible.',
    hasExtraProduct
      ? 'IMAGE 3 = extra catalog detail or open carcass reference — use only for construction/detail cues; keep the closed look of IMAGE 2 unless the customer asked for open carcass.'
      : '',
    `Preferred finish cue: ${body.colourLabel} (${body.colour}).`,
    body.finishLabel ? `Finish: ${body.finishLabel}.` : '',
    body.scopeLabel ? `Scope: ${body.scopeLabel}.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (isRefine) {
    return [
      'ACCURACY-FIRST revision for Priyabadal Homes (India).',
      'Edit the attached visualisation photo. Preserve camera, room geometry, walls, floor, ceiling, windows, and lighting.',
      `Keep the same Priyabadal catalog product identity: "${body.productName}" (${body.categoryName}).`,
      `Preferred finish cue: ${body.colourLabel} (${body.colour}).`,
      body.finishLabel ? `Finish: ${body.finishLabel}.` : '',
      `CHANGE REQUEST (must apply): ${body.changeRequest!.trim()}`,
      'Edit only what the change asks. Do not invent a new room or a different product family.',
      sizeLine,
      'Photorealistic interior photo only. No text, logos, arrows, or watermarks.',
      body.notes ? `Notes: ${body.notes}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  if (isDrawing) {
    return [
      'ACCURACY-FIRST interior architect visualisation for Priyabadal Homes (India).',
      `IMAGE 1 = architect drawing for ${space} (plan/elevation/section/sketch). Respect wall runs, openings, and marked sizes.`,
      productMatch,
      'Task: Photoreal eye-level interior showing the catalog product installed per the drawing — not a CAD screenshot, not a random room.',
      sizeLine,
      'Match IMAGE 2 product identity tightly (doors, grooves, handles, materials).',
      'No text, logos, dimension arrows, or watermarks in the output.',
      body.notes ? `Notes: ${body.notes}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  return [
    'ACCURACY-FIRST interior product visualisation for Priyabadal Homes (India).',
    `IMAGE 1 = customer’s real ${space} photograph. Keep THE SAME camera angle, perspective, walls, floor, ceiling, windows, doors, and lighting. Do not replace the room.`,
    productMatch,
    'Task: Install the Priyabadal catalog product onto the correct wall/surfaces in IMAGE 1 with correct perspective, contact shadows, and seamless lighting.',
    sizeLine,
    'Do NOT paste IMAGE 2 as a sticker/collage. Do NOT invent another brand or a totally different design.',
    'Do NOT leave a tiny sample-sized unit — fill the intended wall run at the given feet size.',
    'Output one photorealistic interior photograph. No text, logos, arrows, or watermarks.',
    body.notes ? `Notes: ${body.notes}` : '',
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

    const isRefine = Boolean(body.refineImageUrl && body.changeRequest?.trim())
    const prompt = buildPrompt(body)

    let model: string
    let falPayload: Record<string, unknown>

    if (isRefine) {
      // Kontext: single image + text change (best for follow-up tweaks)
      const refineUrl = await resolveImageUrl(
        falKey,
        body.refineImageUrl!,
        'refine.jpg',
      )
      model = getRefineModel()
      falPayload = {
        prompt,
        image_url: refineUrl,
        num_images: 1,
        output_format: 'jpeg',
        guidance_scale: 3.5,
        safety_tolerance: '2',
      }
    } else {
      // FLUX.2 Pro Edit: room + exterior (+ optional detail) multi-ref
      const extraProductSrcs = (body.productImageUrls ?? [])
        .filter((u) => typeof u === 'string' && u.length > 0)
        .filter((u) => u !== body.productImageUrl)
        .slice(0, 2)

      const [baseUrl, productUrl, ...extraProductUrls] = await Promise.all([
        resolveImageUrl(falKey, body.roomDataUrl, 'room.jpg'),
        resolveImageUrl(falKey, body.productImageUrl, 'product-exterior.jpg'),
        ...extraProductSrcs.map((src, i) =>
          resolveImageUrl(falKey, src, `product-detail-${i + 1}.jpg`),
        ),
      ])

      model = getCreateModel()
      falPayload = {
        prompt,
        image_urls: [baseUrl, productUrl, ...extraProductUrls],
        image_size: 'auto',
        output_format: 'jpeg',
        safety_tolerance: '2',
        enable_safety_checker: true,
      }
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
      model: getCreateModel(),
      refineModel: getRefineModel(),
    })
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : 'Could not save key',
    })
  }
}

/** Map furniture feet to FLUX.2 Pro Edit image_size presets */
function imageSizeFromFeet(widthFt: number, heightFt: number): string {
  const ratio = widthFt / Math.max(heightFt, 0.1)
  if (ratio >= 1.7) return 'landscape_16_9'
  if (ratio >= 1.25) return 'landscape_4_3'
  if (ratio >= 0.95) return 'square_hd'
  if (ratio >= 0.7) return 'portrait_4_3'
  return 'portrait_16_9'
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

    const model = getCarcassModel()

    const falRes = await fetch(`https://fal.run/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: buildCarcassLivePrompt(body),
        image_urls: [imageUrl],
        image_size: imageSizeFromFeet(
          Number(body.widthFt),
          Number(body.heightFt),
        ),
        output_format: 'jpeg',
        safety_tolerance: '2',
        enable_safety_checker: true,
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

type ChatBody = {
  message?: string
  systemPrompt?: string
  knowledge?: string
  brief?: Record<string, unknown>
  history?: Array<{ role?: string; text?: string }>
}

async function handleChat(req: IncomingMessage, res: ServerResponse) {
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
      error: 'Connect your Fal.ai key to enable live AI chat',
      code: 'MISSING_FAL_KEY',
    })
    return
  }

  try {
    const raw = await readBody(req)
    const body = JSON.parse(raw) as ChatBody
    const message = (body.message || '').trim()
    if (!message) {
      sendJson(res, 400, { error: 'Message is required' })
      return
    }

    const history = (body.history ?? [])
      .filter((h) => h.text && (h.role === 'user' || h.role === 'assistant'))
      .slice(-12)
      .map((h) => `${h.role === 'assistant' ? 'Assistant' : 'Client'}: ${h.text}`)
      .join('\n')

    const briefBits = body.brief
      ? Object.entries(body.brief)
          .filter(([, v]) => v != null && v !== '' && v !== false)
          .map(([k, v]) => `${k}: ${String(v)}`)
          .join(', ')
      : ''

    const systemPrompt = [
      body.systemPrompt?.trim() ||
        'You are Priya Badal AI for Priyabadal Homes. Answer helpfully using the catalog.',
      '',
      body.knowledge?.trim() || '',
    ]
      .filter(Boolean)
      .join('\n')

    const prompt = [
      history ? `Recent conversation:\n${history}\n` : '',
      briefBits ? `Brief snapshot: ${briefBits}\n` : '',
      `Client message: ${message}`,
      '',
      'Reply as Priya Badal AI. End with PRODUCTS: and SUGGESTIONS: lines.',
    ]
      .filter(Boolean)
      .join('\n')

    const model = getChatModel()
    const falRes = await fetch('https://fal.run/fal-ai/any-llm', {
      method: 'POST',
      headers: {
        Authorization: `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        system_prompt: systemPrompt.slice(0, 120_000),
        prompt: prompt.slice(0, 20_000),
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
      sendJson(res, 502, {
        error:
          falJson.error ||
          falJson.detail ||
          falJson.message ||
          'Chat AI request failed',
        code: 'FAL_CHAT_ERROR',
      })
      return
    }

    const reply = (falJson.output || '').trim()
    if (!reply) {
      sendJson(res, 502, {
        error: 'Chat AI returned an empty reply',
        code: 'EMPTY_REPLY',
      })
      return
    }

    sendJson(res, 200, {
      reply,
      provider: 'fal',
      model,
      mode: 'sales-chat',
    })
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : 'Chat failed',
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
  middlewares.use('/api/chat', (req, res, next) => {
    void handleChat(req, res).catch(next)
  })
  middlewares.use('/api/visualise-status', (_req, res) => {
    sendJson(res, 200, {
      configured: Boolean(getFalKey()),
      publicOpen: Boolean(getFalKey()) && Date.now() < Date.parse('2026-08-24T23:59:59+05:30'),
      publicOpenUntil: '24 Aug 2026',
      mode: getFalKey()
        ? Date.now() < Date.parse('2026-08-24T23:59:59+05:30')
          ? 'public-ai'
          : 'paid-ai'
        : 'needs-key',
      model: getCreateModel(),
      refineModel: getRefineModel(),
      chatModel: getChatModel(),
      message:
        getFalKey() && Date.now() < Date.parse('2026-08-24T23:59:59+05:30')
          ? 'Complimentary AI is open for all visitors until 24 Aug 2026.'
          : undefined,
    })
  })
}

/** Dev + preview middleware for professional product-referenced interior AI */
export function visualiseApiPlugin(): Plugin {
  return {
    name: 'priyabadal-visualise-api',
    configResolved(config) {
      hydrateFalEnv(config.mode)
    },
    configureServer(server) {
      hydrateFalEnv(server.config.mode)
      attach(server.middlewares)
    },
    configurePreviewServer(server) {
      hydrateFalEnv(server.config.mode)
      attach(server.middlewares)
    },
  }
}
