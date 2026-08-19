import { type Connect, type Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
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
import { fetchInteriorWebContext } from './webContext.ts'
import {
  detectShutterPose,
  shutterPosePromptBlock,
  type ShutterPose,
} from '../src/lib/shutterPose.ts'
import {
  geminiChat,
  geminiEditImage,
  getChatModel,
  getGeminiKey,
  getImageModel,
  hydrateGeminiEnv,
  loadInlineImage,
  setGeminiKey,
} from './geminiAi.ts'
import {
  falChat,
  falConfigured,
  falEditImage,
  getFalCarcassModel,
  getFalChatModel,
  getFalCreateModel,
  getFalRefineModel,
  hydrateFalEnv,
  resolveFalImageUrl,
  setFalKey,
} from './falAi.ts'

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

const INTERIOR_SYSTEM_PROMPT = [
  'You are a professional interior visualisation artist for Priyabadal Homes (India).',
  'Create client-ready, photorealistic interior photographs suitable for paid design presentations.',
  'Preserve the customer room’s camera angle, architecture, windows, doors, floor, and ceiling unless redesign is requested.',
  'Match the catalog product reference images tightly: shutter layout, grooves, handles, edge profiles, materials, and proportions.',
  'Integrate products with correct perspective, contact shadows, reflections, and matching room lighting — never a sticker/collage look.',
  'When slightly-open / ajar shutters are requested: keep the closed façade identity, open only 1–2 doors a little (20–35°), never warp doors or turn the unit into a full open carcass.',
  'Indian residential context: realistic scale, clean finishes, no watermarks, logos, text, arrows, or dimension labels.',
  'Output one polished showroom-quality photograph.',
].join(' ')

hydrateGeminiEnv(process.env.NODE_ENV === 'production' ? 'production' : 'development')
hydrateFalEnv(process.env.NODE_ENV === 'production' ? 'production' : 'development')

/** True when Fal and/or Gemini key is available. Prefer Fal for event demos. */
function aiConfigured() {
  return falConfigured() || Boolean(getGeminiKey())
}

function activeProvider(): 'fal' | 'gemini' | 'none' {
  if (falConfigured()) return 'fal'
  if (getGeminiKey()) return 'gemini'
  return 'none'
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

function resolveShutterPose(body: VisualiseBody): ShutterPose {
  return detectShutterPose(body.changeRequest, body.notes)
}

function buildPrompt(body: VisualiseBody) {
  const categoryName = (body.categoryName || 'interior').trim() || 'interior'
  const space = categoryName.toLowerCase()
  const isDrawing = body.inputKind === 'drawing'
  const isRefine = Boolean(body.refineImageUrl && body.changeRequest?.trim())
  const mode: VisualiseMode = body.visualiseMode || 'replace'
  const extraCount = body.productImageUrls?.length ?? 0
  const hasSize = Number(body.widthFt) > 0 && Number(body.heightFt) > 0
  const shutterPose = resolveShutterPose(body)
  const poseBlock = shutterPosePromptBlock(shutterPose, categoryName)

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

  const extraRefLine =
    extraCount > 0
      ? shutterPose === 'ajar'
        ? `IMAGE 3${extraCount > 1 ? '+ ' : ' '} = interior / detail reference ONLY for the small ajar peek (materials, shelves). Keep façade identity from IMAGE 2 — do not rebuild the whole unit as open carcass.`
        : shutterPose === 'open-carcass'
          ? `IMAGE 3${extraCount > 1 ? '+ ' : ' '} = open carcass / interior reference — use for inside layout while keeping size and finish language.`
          : `IMAGE 3${extraCount > 1 ? '+ ' : ' '} = additional catalog angle(s) for detail accuracy. Prefer the closed look from IMAGE 2.`
      : ''

  const colourLabel = body.colourLabel || 'catalog finish'
  const colour = body.colour || '#c4b7a6'
  const productMatch = [
    `Catalog product: "${body.productName}" (${categoryName}) by Priyabadal Homes.`,
    'IMAGE 2 = hero CLOSED façade reference — match door layout, panel grooves, handle style, edge profile, colour, and material as closely as possible.',
    extraRefLine,
    `Finish cue: ${colourLabel} (${colour}).`,
    body.finishLabel ? `Finish: ${body.finishLabel}.` : '',
    body.scopeLabel ? `Scope: ${body.scopeLabel}.` : '',
    poseBlock,
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
      `Keep product identity: "${body.productName}" (${categoryName}).`,
      `Finish cue: ${colourLabel} (${colour}).`,
      body.finishLabel ? `Finish: ${body.finishLabel}.` : '',
      `CHANGE REQUEST (must apply precisely): ${body.changeRequest!.trim()}`,
      poseBlock,
      shutterPose === 'ajar'
        ? 'Apply ajar shutters on THIS same wardrobe/cabinet only — do not redesign the product, do not fully open every door, do not change the room.'
        : 'Change only what is asked. Do not invent a different product family or a new room.',
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

  if (!aiConfigured()) {
    sendJson(res, 503, {
      error: 'Professional AI is not connected yet',
      code: 'MISSING_FAL_KEY',
      hint: 'Owner: set FAL_KEY (preferred) or GEMINI_API_KEY via /ai-admin. Fal.ai uses simple card billing — no Google AI Studio payment needed.',
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
    const shutterPose = resolveShutterPose(body)
    const prompt = buildPrompt(body)
    const provider = activeProvider()

    if (provider === 'fal') {
      let imageUrls: string[]
      let model: string
      if (isRefine) {
        imageUrls = [
          await resolveFalImageUrl(body.refineImageUrl!, 'refine.jpg'),
        ]
        model = getFalRefineModel()
      } else {
        const extraProductSrcs = (body.productImageUrls ?? [])
          .filter((u) => typeof u === 'string' && u.length > 0)
          .filter((u) => u !== body.productImageUrl)
          .slice(0, 3)
        imageUrls = await Promise.all([
          resolveFalImageUrl(body.roomDataUrl, 'room.jpg'),
          resolveFalImageUrl(body.productImageUrl, 'product-exterior.jpg'),
          ...extraProductSrcs.map((src, i) =>
            resolveFalImageUrl(src, `product-detail-${i + 1}.jpg`),
          ),
        ])
        model = getFalCreateModel()
      }

      const result = await falEditImage({
        imageUrls,
        prompt: `${INTERIOR_SYSTEM_PROMPT}\n\n${prompt}`,
        model,
        refine: isRefine,
      })

      if (gate.token) consumeUsage(gate.token, 'visualise')

      sendJson(res, 200, {
        imageUrl: result.imageUrl,
        provider: 'fal',
        model: result.model,
        mode: isRefine ? 'refine-precision' : 'interior-presentation',
        quality: 'flux-edit',
        visualiseMode: body.visualiseMode || 'replace',
        access: statusForToken(gate.token),
        shutterPose,
      })
      return
    }

    const model = getImageModel()
    let images
    if (isRefine) {
      images = [await loadInlineImage(body.refineImageUrl!)]
    } else {
      const extraProductSrcs = (body.productImageUrls ?? [])
        .filter((u) => typeof u === 'string' && u.length > 0)
        .filter((u) => u !== body.productImageUrl)
        .slice(0, 3)

      images = await Promise.all([
        loadInlineImage(body.roomDataUrl),
        loadInlineImage(body.productImageUrl),
        ...extraProductSrcs.map((src) => loadInlineImage(src)),
      ])
    }

    const result = await geminiEditImage({
      images,
      prompt,
      system: INTERIOR_SYSTEM_PROMPT,
      model,
    })

    if (gate.token) consumeUsage(gate.token, 'visualise')

    sendJson(res, 200, {
      imageUrl: result.dataUrl,
      provider: 'gemini',
      model: result.model,
      mode: isRefine ? 'refine-precision' : 'interior-presentation',
      quality: 'flash-image',
      visualiseMode: body.visualiseMode || 'replace',
      access: statusForToken(gate.token),
      shutterPose,
    })
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Visualise failed'
    const quota =
      /quota|rate[- ]?limit|billing|RESOURCE_EXHAUSTED|exceeded your current|balance/i.test(
        raw,
      )
    sendJson(res, quota ? 429 : 500, {
      error: quota
        ? activeProvider() === 'fal'
          ? 'Fal.ai credits are empty. Add balance at fal.ai/dashboard/billing, then Try again.'
          : 'Google AI image quota is empty on this Gemini key. Prefer Fal.ai for the event (set FAL_KEY), or enable Google billing.'
        : raw,
      code: quota ? 'AI_QUOTA' : 'SERVER_ERROR',
      hint: quota
        ? 'Use Fal.ai (card top-up) to avoid Google AI Studio payment issues.'
        : undefined,
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
        error: 'Only the owner can set the Gemini key (admin PIN required)',
        code: admin.code,
      })
      return
    }
    const key = (body.key || '').trim()
    if (!key || key.length < 10) {
      sendJson(res, 400, { error: 'Paste a valid Fal.ai or Gemini API key' })
      return
    }
    // Fal keys are usually longer UUID-like; Gemini keys often start with AIza
    if (key.startsWith('AIza')) {
      setGeminiKey(key)
      sendJson(res, 200, {
        configured: true,
        mode: 'paid-ai',
        model: getImageModel(),
        refineModel: getImageModel(),
        provider: 'gemini',
      })
    } else {
      setFalKey(key)
      sendJson(res, 200, {
        configured: true,
        mode: 'paid-ai',
        model: getFalCreateModel(),
        refineModel: getFalRefineModel(),
        provider: 'fal',
      })
    }
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : 'Could not save key',
    })
  }
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

  if (!aiConfigured()) {
    sendJson(res, 503, {
      error: 'Professional AI is not connected yet',
      code: 'MISSING_FAL_KEY',
      hint: 'Owner: set FAL_KEY (preferred) or GEMINI_API_KEY via /ai-admin.',
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

    const carcassPrompt = [
      buildCarcassLivePrompt(body),
      'Client-presentation quality. Photoreal open carcass for quotation — clean, sharp, believable scale.',
    ].join(' ')

    if (activeProvider() === 'fal') {
      const imageUrl = await resolveFalImageUrl(body.carcassImageUrl, 'carcass.jpg')
      const result = await falEditImage({
        imageUrls: [imageUrl],
        prompt: `${INTERIOR_SYSTEM_PROMPT}\n\n${carcassPrompt}`,
        model: getFalCarcassModel(),
      })
      if (gate.token) consumeUsage(gate.token, 'carcass')
      sendJson(res, 200, {
        imageUrl: result.imageUrl,
        provider: 'fal',
        model: result.model,
        mode: 'live-size-carcass',
        access: statusForToken(gate.token),
        size: {
          widthFt: body.widthFt,
          heightFt: body.heightFt,
          depthFt: body.depthFt,
        },
      })
      return
    }

    const model = getImageModel()
    const result = await geminiEditImage({
      images: [await loadInlineImage(body.carcassImageUrl)],
      prompt: carcassPrompt,
      system: INTERIOR_SYSTEM_PROMPT,
      model,
    })

    if (gate.token) consumeUsage(gate.token, 'carcass')

    sendJson(res, 200, {
      imageUrl: result.dataUrl,
      provider: 'gemini',
      model: result.model,
      mode: 'live-size-carcass',
      access: statusForToken(gate.token),
      size: {
        widthFt: body.widthFt,
        heightFt: body.heightFt,
        depthFt: body.depthFt,
      },
    })
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Carcass live AI failed'
    const quota =
      /quota|rate[- ]?limit|billing|RESOURCE_EXHAUSTED|exceeded your current|balance/i.test(
        raw,
      )
    sendJson(res, quota ? 429 : 500, {
      error: quota
        ? 'AI credits/quota empty. Top up Fal.ai billing (recommended for the event).'
        : raw,
      code: quota ? 'AI_QUOTA' : 'SERVER_ERROR',
    })
  }
}

type ChatBody = {
  message?: string
  systemPrompt?: string
  knowledge?: string
  /** Authoritative local catalog answer (prices) — LLM must not contradict */
  catalogAnswer?: string
  /** Fetch general materials/interior web context (never for pricing) */
  allowWebSearch?: boolean
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

  if (!aiConfigured()) {
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

    const historyItems = (body.history ?? [])
      .filter(
        (h): h is { role: 'user' | 'assistant'; text: string } =>
          Boolean(h.text) && (h.role === 'user' || h.role === 'assistant'),
      )
      .slice(-20)
      .map((h) => ({
        role: h.role,
        text: String(h.text).slice(0, 1400),
      }))

    const briefBits = body.brief
      ? Object.entries(body.brief)
          .filter(([, v]) => v != null && v !== '' && v !== false)
          .map(([k, v]) => `${k}: ${String(v)}`)
          .join(', ')
      : ''

    const hasAiImage = Boolean(
      body.brief &&
        (body.brief.hasAiImage === true || body.brief.hasAiImage === 'true'),
    )

    const webContext = body.allowWebSearch
      ? await fetchInteriorWebContext(message)
      : ''

    const systemPrompt = [
      body.systemPrompt?.trim() ||
        'You are Priya Badal AI for Priyabadal Homes. Answer helpfully using the catalog.',
      '',
      'SESSION RULE: Continue the same chat job. Use conversation history. If an AI look already exists, treat follow-ups as edits/questions on that look — do not restart from zero.',
      '',
      body.knowledge?.trim() || '',
      '',
      body.catalogAnswer?.trim()
        ? [
            'AUTHORITATIVE CATALOG ANSWER (use these shutter/carcass numbers exactly — do not invent rates):',
            body.catalogAnswer.trim(),
          ].join('\n')
        : '',
      '',
      webContext,
    ]
      .filter(Boolean)
      .join('\n')

    const prompt = [
      briefBits ? `Brief snapshot: ${briefBits}` : '',
      hasAiImage
        ? 'Session note: An AI visualisation is already ready in this chat. Continue from that look unless the client asks to start over from the photo.'
        : '',
      `Client message: ${message}`,
      '',
      body.catalogAnswer?.trim()
        ? 'Rewrite the authoritative catalog answer warmly for the client. Keep every shutter/carcass/INR figure unchanged. Offer visualise or WhatsApp next steps when useful.'
        : 'Reply as Priya Badal AI. Prefer catalog shutter + carcass rates. For general materials, you may use WEB CONTEXT if present. Never invent Priyabadal prices from the web. Continue the existing consultation — do not reset context.',
      '',
      'End with PRODUCTS: and SUGGESTIONS: lines.',
    ]
      .filter(Boolean)
      .join('\n')

    const { reply, model } =
      activeProvider() === 'fal'
        ? await falChat({
            system: systemPrompt.slice(0, 120_000),
            prompt: [
              historyItems
                .map(
                  (h) =>
                    `${h.role === 'assistant' ? 'Assistant' : 'Client'}: ${h.text}`,
                )
                .join('\n'),
              prompt,
            ]
              .filter(Boolean)
              .join('\n')
              .slice(0, 24_000),
            model: getFalChatModel(),
          })
        : await geminiChat({
            system: systemPrompt.slice(0, 120_000),
            prompt: prompt.slice(0, 24_000),
            model: getChatModel(),
            history: historyItems,
          })

    if (gate.token) consumeUsage(gate.token, 'chat')

    sendJson(res, 200, {
      reply,
      provider: activeProvider(),
      model,
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
    falConfigured: aiConfigured(),
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
        falConfigured: aiConfigured(),
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
      geminiKey?: string
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
        sendJson(res, 400, { error: 'Valid Fal.ai API key required' })
        return
      }
      setFalKey(key)
      sendJson(res, 200, { ok: true, falConfigured: true, provider: 'fal' })
      return
    }

    if (action === 'set-gemini-key') {
      const key = (body.geminiKey || body.falKey || '').trim()
      if (!key || key.length < 10) {
        sendJson(res, 400, { error: 'Valid Gemini API key required' })
        return
      }
      setGeminiKey(key)
      sendJson(res, 200, { ok: true, falConfigured: aiConfigured(), provider: 'gemini' })
      return
    }

    if (action === 'list') {
      sendJson(res, 200, {
        subscribers: listSubscribers(),
        plans: listPlans(),
        falConfigured: aiConfigured(),
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
    const provider = activeProvider()
    const ready = aiConfigured()
    sendJson(res, 200, {
      ...access,
      configured: ready && (!needsSub || access.subscribed),
      falConfigured: ready,
      mode: ready
        ? access.subscribed || !needsSub
          ? 'subscriber-ai'
          : 'needs-subscription'
        : 'needs-key',
      model: provider === 'fal' ? getFalCreateModel() : getImageModel(),
      refineModel: provider === 'fal' ? getFalRefineModel() : getImageModel(),
      chatModel: provider === 'fal' ? getFalChatModel() : getChatModel(),
      quality: provider === 'fal' ? 'flux-edit' : 'flash-image',
      engine:
        provider === 'fal'
          ? 'Priyabadal Interior AI · Fal FLUX'
          : provider === 'gemini'
            ? 'Priyabadal Interior AI · Google Gemini Flash Image'
            : 'Priyabadal Interior AI · not connected',
      provider,
      requireSubscription: needsSub,
    })
  })
}

/** Dev + preview middleware for professional product-referenced interior AI */
export function visualiseApiPlugin(): Plugin {
  return {
    name: 'priyabadal-visualise-api',
    configResolved(config) {
      hydrateGeminiEnv(config.mode)
      hydrateFalEnv(config.mode)
    },
    configureServer(server) {
      hydrateGeminiEnv(server.config.mode)
      hydrateFalEnv(server.config.mode)
      attach(server.middlewares)
    },
    configurePreviewServer(server) {
      hydrateGeminiEnv(server.config.mode)
      hydrateFalEnv(server.config.mode)
      attach(server.middlewares)
    },
  }
}
