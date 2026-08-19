import {
  corsPreflight,
  getCreateModel,
  getFalKey,
  getRefineModel,
  json,
  missingKeyResponse,
  resolveImageUrlWithOrigin,
  type Env,
} from '../_shared/fal'

type VisualiseBody = {
  roomDataUrl: string
  productImageUrl: string
  productImageUrls?: string[]
  productName: string
  categoryName: string
  colour: string
  colourLabel: string
  notes?: string
  widthFt?: number
  heightFt?: number
  depthFt?: number
  finishLabel?: string
  scopeLabel?: string
  inputKind?: 'photo' | 'drawing'
  refineImageUrl?: string
  changeRequest?: string
}

function buildPrompt(body: VisualiseBody) {
  const isDrawing = body.inputKind === 'drawing'
  const isRefine = Boolean(body.refineImageUrl && body.changeRequest?.trim())
  const space = body.categoryName || 'interior'
  const sizeLine =
    body.widthFt && body.heightFt
      ? `Target furniture size: ${body.widthFt} ft wide × ${body.heightFt} ft high` +
        (body.depthFt ? ` × ${body.depthFt} ft deep` : '') +
        '.'
      : ''
  const finishBits = [
    body.colourLabel ? `Finish colour: ${body.colourLabel} (${body.colour}).` : '',
    body.finishLabel ? `Material finish: ${body.finishLabel}.` : '',
    body.scopeLabel ? `Scope: ${body.scopeLabel}.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  const productMatch = [
    `IMAGE 2 = Priyabadal Homes catalog product “${body.productName}” for ${space}.`,
    'Match this product’s design language: proportions, grooves, handles, materials, and colour.',
    finishBits,
  ]
    .filter(Boolean)
    .join(' ')

  if (isRefine) {
    return [
      'ACCURACY-FIRST interior edit for Priyabadal Homes (India).',
      'IMAGE 1 = the current visualisation to edit. Keep the same room, camera, and installed product unless the change requires otherwise.',
      `Change request: ${body.changeRequest?.trim()}`,
      'Apply only the requested change. Photorealistic result. No text or watermarks.',
    ].join(' ')
  }

  if (isDrawing) {
    return [
      'ACCURACY-FIRST interior architect visualisation for Priyabadal Homes (India).',
      `IMAGE 1 = architect drawing for ${space}. Respect wall runs, openings, and marked sizes.`,
      productMatch,
      'Task: Photoreal eye-level interior showing the catalog product installed per the drawing.',
      sizeLine,
      'No text, logos, dimension arrows, or watermarks.',
      body.notes ? `Notes: ${body.notes}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  return [
    'ACCURACY-FIRST interior product visualisation for Priyabadal Homes (India).',
    `IMAGE 1 = customer’s real ${space} photograph. Keep THE SAME camera angle, walls, floor, ceiling, windows, doors, and lighting.`,
    productMatch,
    'Task: Install the catalog product onto the correct wall/surfaces with correct perspective and seamless lighting.',
    sizeLine,
    'Do NOT paste IMAGE 2 as a sticker. Output one photorealistic interior photograph. No text or watermarks.',
    body.notes ? `Notes: ${body.notes}` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const falKey = getFalKey(context.env)
  if (!falKey) return missingKeyResponse()

  try {
    const body = (await context.request.json()) as VisualiseBody
    if (!body.roomDataUrl || !body.productImageUrl || !body.productName) {
      return json({ error: 'Missing room photo or product' }, 400)
    }

    const origin = new URL(context.request.url).origin
    const isRefine = Boolean(body.refineImageUrl && body.changeRequest?.trim())
    const prompt = buildPrompt(body)

    let model: string
    let falPayload: Record<string, unknown>

    if (isRefine) {
      const refineUrl = await resolveImageUrlWithOrigin(
        falKey,
        body.refineImageUrl!,
        'refine.jpg',
        origin,
      )
      model = getRefineModel(context.env)
      falPayload = {
        prompt,
        image_url: refineUrl,
        num_images: 1,
        output_format: 'jpeg',
        guidance_scale: 3.5,
        safety_tolerance: '2',
      }
    } else {
      const extraProductSrcs = (body.productImageUrls ?? [])
        .filter((u) => typeof u === 'string' && u.length > 0)
        .filter((u) => u !== body.productImageUrl)
        .slice(0, 2)

      const [baseUrl, productUrl, ...extraProductUrls] = await Promise.all([
        resolveImageUrlWithOrigin(falKey, body.roomDataUrl, 'room.jpg', origin),
        resolveImageUrlWithOrigin(
          falKey,
          body.productImageUrl,
          'product-exterior.jpg',
          origin,
        ),
        ...extraProductSrcs.map((src, i) =>
          resolveImageUrlWithOrigin(falKey, src, `product-detail-${i + 1}.jpg`, origin),
        ),
      ])

      model = getCreateModel(context.env)
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
      return json(
        {
          error:
            falJson.detail ||
            falJson.error ||
            falJson.message ||
            'Professional AI generation failed',
          code: 'FAL_ERROR',
        },
        502,
      )
    }

    const imageUrl = falJson.images?.[0]?.url || falJson.image?.url || null
    if (!imageUrl) {
      return json({ error: 'AI returned no image', code: 'EMPTY_RESULT' }, 502)
    }

    return json({
      imageUrl,
      provider: 'fal',
      model,
      mode: 'product-referenced-pro',
    })
  } catch (err) {
    return json(
      {
        error: err instanceof Error ? err.message : 'Visualise failed',
        code: 'SERVER_ERROR',
      },
      500,
    )
  }
}

export const onRequestOptions: PagesFunction = async () => corsPreflight()
