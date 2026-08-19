import {
  corsPreflight,
  getCarcassModel,
  getFalKey,
  json,
  missingKeyResponse,
  resolveImageUrlWithOrigin,
  type Env,
} from '../_shared/fal'

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
    `Task: Create ONE photorealistic ${kind} at the customer's LIVE made-to-measure size.`,
    `LIVE SIZE IN FEET (mandatory): width ${w} ft × height ${h} ft × depth ${d} ft.`,
    `Storage bay plan left-to-right: ${body.baySummary}.`,
    body.finishLabel ? `Finish: ${body.finishLabel}.` : '',
    body.thicknessLabel ? `Board thickness look: ${body.thicknessLabel}.` : '',
    'Keep wood tone, LED style, and hardware language from IMAGE 1.',
    'Show a full open carcass elevation. No text, logos, or watermarks.',
    body.notes ? `Customer note: ${body.notes}` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const falKey = getFalKey(context.env)
  if (!falKey) return missingKeyResponse()

  try {
    const body = (await context.request.json()) as CarcassLiveBody
    if (
      !body.carcassImageUrl ||
      !body.productName ||
      !body.widthFt ||
      !body.heightFt ||
      !body.depthFt ||
      !body.baySummary
    ) {
      return json({ error: 'Missing carcass image or size details' }, 400)
    }

    const origin = new URL(context.request.url).origin
    const imageUrl = await resolveImageUrlWithOrigin(
      falKey,
      body.carcassImageUrl,
      'carcass-ref.jpg',
      origin,
    )
    const model = getCarcassModel(context.env)
    const prompt = buildCarcassLivePrompt(body)

    const falRes = await fetch(`https://fal.run/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_urls: [imageUrl],
        image_size: imageSizeFromFeet(body.widthFt, body.heightFt),
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
      return json(
        {
          error:
            falJson.detail ||
            falJson.error ||
            falJson.message ||
            'Live-size carcass AI failed',
          code: 'FAL_ERROR',
        },
        502,
      )
    }

    const outUrl = falJson.images?.[0]?.url || falJson.image?.url || null
    if (!outUrl) {
      return json({ error: 'AI returned no image', code: 'EMPTY_RESULT' }, 502)
    }

    return json({
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
    return json(
      {
        error: err instanceof Error ? err.message : 'Carcass live AI failed',
        code: 'SERVER_ERROR',
      },
      500,
    )
  }
}

export const onRequestOptions: PagesFunction = async () => corsPreflight()
