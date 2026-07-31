import { loadEnv, type Connect, type Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  assertAdmin,
  assertCanUse,
  consumeUsage,
  createSubscriber,
  listPlans,
  listSubscribers,
  readAccessToken,
  readAdminPin,
  requireSubscription,
  setSubscriberActive,
  statusForToken,
  unlockWithCode,
} from './aiSubscriberStore.ts'
import type { AiKind } from './aiSubscriberStore.ts'

type VisualiseMode = 'replace' | 'install' | 'redesign'

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
  /**
   * How to treat the room photo:
   * replace = swap existing furniture with our product
   * install = place our product into the room
   * redesign = presentable full interior look with our product as hero
   */
  visualiseMode?: VisualiseMode
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

/**
 * Client-chargeable quality defaults:
 * - Create / install: Nano Banana Pro Edit @ 2K (best photoreal interior restyle + multi refs)
 * - Refine: FLUX.1 Kontext Max (precise follow-up edits, room consistency)
 * Override with FAL_VISUALISE_MODEL / FAL_REFINE_MODEL if needed.
 */
const DEFAULT_CREATE_MODEL = 'fal-ai/nano-banana-pro/edit'
const DEFAULT_REFINE_MODEL = 'fal-ai/flux-pro/kontext/max'
const DEFAULT_RESOLUTION = '2K'

const INTERIOR_SYSTEM_PROMPT = [
  'You are a professional interior visualisation artist for Priyabadal Homes (India).',
  'Create client-ready, photorealistic interior photographs suitable for paid design presentations.',
  'Preserve the customer room’s camera angle, architecture, windows, doors, floor, and ceiling unless redesign is requested.',
  'Match the catalog product reference images tightly: shutter layout, grooves, handles, edge profiles, materials, and proportions.',
  'Integrate products with correct perspective, contact shadows, reflections, and matching room lighting — never a sticker/collage look.',
  'Indian residential context: realistic scale, clean finishes, no watermarks, logos, text, arrows, or dimension labels.',
  'Output one polished showroom-quality photograph.',
].join(' ')

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

function getVisualiseResolution() {
  const r = (process.env.FAL_VISUALISE_RESOLUTION || DEFAULT_RESOLUTION).toUpperCase()
  return r === '1K' || r === '4K' || r === '2K' ? r : DEFAULT_RESOLUTION
}

function modelFamily(model: string): 'nano-banana' | 'flux-2' | 'kontext' | 'other' {
  const m = model.toLowerCase()
  if (m.includes('nano-banana')) return 'nano-banana'
  if (m.includes('kontext')) return 'kontext'
  if (m.includes('flux-2') || m.includes('flux2')) return 'flux-2'
  return 'other'
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
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.end(JSON.stringify(data))
}

function sendOptions(res: ServerResponse) {
  res.statusCode = 204
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, X-AI-Access, X-AI-Token, X-AI-Admin, Authorization',
  )
  res.end()
}

/** Gate Fal spend: require paid subscriber + remaining monthly quota */
function gateAi(
  req: IncomingMessage,
  res: ServerResponse,
  kind: AiKind,
): { token: string | null } | null {
  const token = readAccessToken(req)
  const check = assertCanUse(token, kind)
  if (!check.ok) {
    sendJson(res, check.status, {
      error: check.error,
      code: check.code,
      remaining: check.remaining ?? 0,
      requireSubscription: requireSubscription(),
    })
    return null
  }
  return { token }
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
  const mode: VisualiseMode = body.visualiseMode || 'replace'
  const extraCount = body.productImageUrls?.length ?? 0
  const hasSize = Number(body.widthFt) > 0 && Number(body.heightFt) > 0

  const sizeLine = hasSize
    ? [
        `LIVE SIZE (furniture only, keep photo framing): ${body.widthFt} ft wide × ${body.heightFt} ft high` +
          (Number(body.depthFt) > 0 ? ` × ${body.depthFt} ft deep` : '') +
          '.',
        space.includes('wardrobe')
          ? `The wardrobe must read as a full wall unit ~${body.widthFt} ft wide and ~${body.heightFt} ft tall (near floor-to-ceiling if height is tall).`
          : space.includes('kitchen')
            ? `The kitchen run must fill ~${body.widthFt} ft of wall with ~${body.heightFt} ft shutter/cabinet height.`
            : `Scale the product to about ${body.widthFt} × ${body.heightFt} ft on the intended wall.`,
      ].join(' ')
    : isDrawing
      ? 'Respect marked dimensions on the drawing; otherwise fit the product to the indicated wall run.'
      : 'Scale the product to the natural wall opening / furniture footprint in IMAGE 1.'

  const productMatch = [
    `Catalog product: "${body.productName}" (${body.categoryName}) by Priyabadal Homes.`,
    'IMAGE 2 = hero CLOSED façade reference — match door layout, panel grooves, handle style, edge profile, colour, and material as closely as possible.',
    extraCount > 0
      ? `IMAGE 3${extraCount > 1 ? '+ ' : ' '} = additional catalog angle(s) for detail accuracy. Prefer the closed look from IMAGE 2 unless the customer asked for open carcass.`
      : '',
    `Finish cue: ${body.colourLabel} (${body.colour}).`,
    body.finishLabel ? `Finish: ${body.finishLabel}.` : '',
    body.scopeLabel ? `Scope: ${body.scopeLabel}.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  const modeTask =
    mode === 'install'
      ? `INSTALL mode: Place the Priyabadal ${space} product into IMAGE 1 on the correct wall/niche. Keep the rest of the room natural and believable.`
      : mode === 'redesign'
        ? `REDESIGN mode: Create a presentable, client-ready interior look of this ${space}. Keep room architecture from IMAGE 1, refresh styling around the new Priyabadal product so the result looks like a polished design proposal.`
        : `REPLACE mode: Remove / replace the existing ${space} furniture or cabinets in IMAGE 1 with the Priyabadal catalog product. Keep walls, floor, ceiling, windows, and camera identical.`

  if (isRefine) {
    return [
      'Client-ready revision for a paid Priyabadal Homes interior visualisation.',
      'Edit the attached visualisation. Preserve camera, room geometry, walls, floor, ceiling, windows, and overall lighting.',
      `Keep product identity: "${body.productName}" (${body.categoryName}).`,
      `Finish cue: ${body.colourLabel} (${body.colour}).`,
      body.finishLabel ? `Finish: ${body.finishLabel}.` : '',
      `CHANGE REQUEST (must apply precisely): ${body.changeRequest!.trim()}`,
      'Change only what is asked. Do not invent a different product family or a new room.',
      sizeLine,
      'Photoreal presentation quality. No text, logos, arrows, or watermarks.',
      body.notes ? `Customer notes: ${body.notes}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  if (isDrawing) {
    return [
      'Client-ready architect-to-photo visualisation for Priyabadal Homes (India).',
      `IMAGE 1 = architect drawing for ${space} (plan / elevation / section / sketch). Respect wall runs, openings, and marked sizes.`,
      productMatch,
      'Task: Produce a photoreal eye-level interior photo with the catalog product installed per the drawing — not a CAD screenshot.',
      sizeLine,
      'Match IMAGE 2 product identity tightly. Soft realistic lighting, correct scale, presentation quality.',
      'No text, logos, dimension arrows, or watermarks.',
      body.notes ? `Customer notes: ${body.notes}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  return [
    'Client-ready photoreal interior visualisation for Priyabadal Homes (India).',
    `IMAGE 1 = customer’s real ${space} photograph.`,
    modeTask,
    productMatch,
    'Blend the product with correct perspective, contact shadows, edge alignment, and room lighting. Never look like a pasted sticker or collage.',
    sizeLine,
    'Do not invent another brand or a totally different design language.',
    'Fill the intended wall run at realistic Indian residential scale — not a tiny sample unit.',
    'Output one polished presentation photograph. No text, logos, arrows, or watermarks.',
    body.notes ? `Customer notes: ${body.notes}` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function buildFalPayload(opts: {
  model: string
  prompt: string
  imageUrls: string[]
  isRefine: boolean
}): Record<string, unknown> {
  const family = modelFamily(opts.model)
  const resolution = getVisualiseResolution()

  if (opts.isRefine || family === 'kontext') {
    return {
      prompt: opts.prompt,
      image_url: opts.imageUrls[0],
      num_images: 1,
      output_format: 'jpeg',
      guidance_scale: 4.0,
      enhance_prompt: true,
      safety_tolerance: '2',
      aspect_ratio: 'auto',
    }
  }

  if (family === 'nano-banana') {
    return {
      prompt: opts.prompt,
      system_prompt: INTERIOR_SYSTEM_PROMPT,
      image_urls: opts.imageUrls,
      num_images: 1,
      output_format: 'jpeg',
      resolution,
      aspect_ratio: 'auto',
      safety_tolerance: '4',
      limit_generations: true,
    }
  }

  // FLUX.2 Pro / Max edit family
  return {
    prompt: opts.prompt,
    image_urls: opts.imageUrls,
    image_size: 'auto',
    output_format: 'jpeg',
    safety_tolerance: '2',
    enable_safety_checker: true,
  }
}

async function handleVisualise(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    sendOptions(res)
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  const gate = gateAi(req, res, 'visualise')
  if (!gate) return

  const falKey = getFalKey()
  if (!falKey) {
    sendJson(res, 503, {
      error: 'Professional AI is not connected yet',
      code: 'MISSING_FAL_KEY',
      hint: 'Owner must set FAL_KEY on the server. Subscribers do not paste Fal keys.',
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
    let imageUrls: string[] = []

    if (isRefine) {
      // Kontext Max: precise single-image follow-up edits
      const refineUrl = await resolveImageUrl(
        falKey,
        body.refineImageUrl!,
        'refine.jpg',
      )
      model = getRefineModel()
      imageUrls = [refineUrl]
      falPayload = buildFalPayload({
        model,
        prompt,
        imageUrls,
        isRefine: true,
      })
    } else {
      // Nano Banana Pro / FLUX.2: room + product façade (+ detail angles)
      const extraProductSrcs = (body.productImageUrls ?? [])
        .filter((u) => typeof u === 'string' && u.length > 0)
        .filter((u) => u !== body.productImageUrl)
        .slice(0, 3)

      const [baseUrl, productUrl, ...extraProductUrls] = await Promise.all([
        resolveImageUrl(falKey, body.roomDataUrl, 'room.jpg'),
        resolveImageUrl(falKey, body.productImageUrl, 'product-exterior.jpg'),
        ...extraProductSrcs.map((src, i) =>
          resolveImageUrl(falKey, src, `product-detail-${i + 1}.jpg`),
        ),
      ])

      model = getCreateModel()
      imageUrls = [baseUrl, productUrl, ...extraProductUrls]
      falPayload = buildFalPayload({
        model,
        prompt,
        imageUrls,
        isRefine: false,
      })
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

    if (gate.token) consumeUsage(gate.token, 'visualise')

    sendJson(res, 200, {
      imageUrl,
      provider: 'fal',
      model,
      mode: isRefine ? 'refine-precision' : 'interior-presentation',
      quality: modelFamily(model) === 'nano-banana' ? getVisualiseResolution() : 'hd',
      visualiseMode: body.visualiseMode || 'replace',
      access: statusForToken(gate.token),
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
    sendOptions(res)
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    const raw = await readBody(req)
    const body = JSON.parse(raw) as { key?: string; adminPin?: string }
    const admin = assertAdmin(readAdminPin(req, body.adminPin))
    if (!admin.ok) {
      sendJson(res, admin.status, {
        error: 'Only the owner can set the Fal key (admin PIN required)',
        code: admin.code,
      })
      return
    }
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
    sendOptions(res)
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  const gate = gateAi(req, res, 'carcass')
  if (!gate) return

  const falKey = getFalKey()
  if (!falKey) {
    sendJson(res, 503, {
      error: 'Professional AI is not connected yet',
      code: 'MISSING_FAL_KEY',
      hint: 'Owner must set FAL_KEY on the server.',
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
    const carcassPrompt = [
      buildCarcassLivePrompt(body),
      'Client-presentation quality. Photoreal open carcass for quotation — clean, sharp, believable scale.',
    ].join(' ')
    const falPayload = buildFalPayload({
      model,
      prompt: carcassPrompt,
      imageUrls: [imageUrl],
      isRefine: false,
    })
    if (modelFamily(model) === 'flux-2') {
      falPayload.image_size = imageSizeFromFeet(
        Number(body.widthFt),
        Number(body.heightFt),
      )
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

    if (gate.token) consumeUsage(gate.token, 'carcass')

    sendJson(res, 200, {
      imageUrl: outUrl,
      provider: 'fal',
      model,
      mode: 'live-size-carcass',
      access: statusForToken(gate.token),
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
    sendOptions(res)
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  const gate = gateAi(req, res, 'chat')
  if (!gate) return

  const falKey = getFalKey()
  if (!falKey) {
    sendJson(res, 503, {
      error: 'Live AI chat is not connected on the server',
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

    if (gate.token) consumeUsage(gate.token, 'chat')

    sendJson(res, 200, {
      reply,
      provider: 'fal',
      model,
      mode: 'sales-chat',
      access: statusForToken(gate.token),
    })
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : 'Chat failed',
      code: 'SERVER_ERROR',
    })
  }
}

async function handleAiUnlock(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    sendOptions(res)
    return
  }
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }
  try {
    const raw = await readBody(req)
    const body = JSON.parse(raw) as { code?: string }
    const result = unlockWithCode(body.code || '')
    if (!result.ok) {
      sendJson(res, 401, { error: result.error, code: result.code })
      return
    }
    sendJson(res, 200, result)
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : 'Unlock failed',
    })
  }
}

async function handleAiAccessStatus(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    sendOptions(res)
    return
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }
  let token = readAccessToken(req)
  if (!token && req.method === 'POST') {
    try {
      const raw = await readBody(req)
      const body = JSON.parse(raw || '{}') as { token?: string }
      token = body.token || null
    } catch {
      token = null
    }
  }
  sendJson(res, 200, {
    falConfigured: Boolean(getFalKey()),
    ...statusForToken(token),
    plans: listPlans(),
  })
}

async function handleAiAdmin(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    sendOptions(res)
    return
  }

  try {
    if (req.method === 'GET') {
      const admin = assertAdmin(readAdminPin(req))
      if (!admin.ok) {
        sendJson(res, admin.status, { error: admin.error, code: admin.code })
        return
      }
      sendJson(res, 200, {
        subscribers: listSubscribers(),
        plans: listPlans(),
        falConfigured: Boolean(getFalKey()),
        requireSubscription: requireSubscription(),
      })
      return
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' })
      return
    }

    const raw = await readBody(req)
    const body = JSON.parse(raw) as {
      adminPin?: string
      action?: string
      planId?: string
      name?: string
      phone?: string
      note?: string
      code?: string
      active?: boolean
      limits?: { visualise?: number; chat?: number; carcass?: number }
      falKey?: string
    }

    const admin = assertAdmin(readAdminPin(req, body.adminPin))
    if (!admin.ok) {
      sendJson(res, admin.status, { error: admin.error, code: admin.code })
      return
    }

    const action = body.action || 'create'

    if (action === 'create') {
      const created = createSubscriber({
        planId: body.planId || 'starter',
        name: body.name,
        phone: body.phone,
        note: body.note,
        limits: body.limits,
        code: body.code,
      })
      sendJson(res, 200, { ok: true, ...created, subscribers: listSubscribers() })
      return
    }

    if (action === 'set-active') {
      const updated = setSubscriberActive(body.code || '', Boolean(body.active))
      if (!updated) {
        sendJson(res, 404, { error: 'Subscriber not found', code: 'NOT_FOUND' })
        return
      }
      sendJson(res, 200, { ok: true, subscriber: updated, subscribers: listSubscribers() })
      return
    }

    if (action === 'set-fal-key') {
      const key = (body.falKey || '').trim()
      if (!key || key.length < 10) {
        sendJson(res, 400, { error: 'Valid Fal key required' })
        return
      }
      runtimeFalKey = key
      process.env.FAL_KEY = key
      sendJson(res, 200, { ok: true, falConfigured: true })
      return
    }

    if (action === 'list') {
      sendJson(res, 200, {
        subscribers: listSubscribers(),
        plans: listPlans(),
        falConfigured: Boolean(getFalKey()),
      })
      return
    }

    sendJson(res, 400, { error: 'Unknown action' })
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : 'Admin request failed',
    })
  }
}

function attach(middlewares: Connect.Server) {
  middlewares.use('/api/ai-unlock', (req, res, next) => {
    void handleAiUnlock(req, res).catch(next)
  })
  middlewares.use('/api/ai-access', (req, res, next) => {
    void handleAiAccessStatus(req, res).catch(next)
  })
  middlewares.use('/api/ai-admin', (req, res, next) => {
    void handleAiAdmin(req, res).catch(next)
  })
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
  middlewares.use('/api/visualise-status', (req, res) => {
    const token = readAccessToken(req)
    const access = statusForToken(token)
    const needsSub = requireSubscription()
    sendJson(res, 200, {
      ...access,
      configured: Boolean(getFalKey()) && (!needsSub || access.subscribed),
      falConfigured: Boolean(getFalKey()),
      mode: getFalKey()
        ? access.subscribed || !needsSub
          ? 'subscriber-ai'
          : 'needs-subscription'
        : 'needs-key',
      model: getCreateModel(),
      refineModel: getRefineModel(),
      chatModel: getChatModel(),
      quality: getVisualiseResolution(),
      engine: 'Priyabadal Interior AI · Nano Banana Pro 2K + Kontext Max',
      requireSubscription: needsSub,
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
