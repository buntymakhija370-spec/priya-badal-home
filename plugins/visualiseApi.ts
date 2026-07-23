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

  const falKey = process.env.FAL_KEY || process.env.VITE_FAL_KEY
  if (!falKey) {
    sendJson(res, 503, {
      error: 'AI key not configured',
      code: 'MISSING_FAL_KEY',
      hint: 'Add FAL_KEY to your environment, then restart the server.',
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

    const prompt = [
      `Image 1 is the customer's empty or existing ${body.categoryName.toLowerCase()} space.`,
      `Image 2 is the exact Priyabadal Homes product reference: "${body.productName}".`,
      `Edit Image 1 only: place / redesign using the product from Image 2 so it matches that product design as closely as possible.`,
      `Apply finish colour: ${body.colourLabel} (${body.colour}).`,
      'Keep the room architecture — walls, floor, ceiling, windows, lighting direction — realistic and unchanged except for the product installation.',
      'Photorealistic interior photo, no text overlays, no watermarks, no invented random furniture brands.',
      body.notes ? `Extra customer note: ${body.notes}` : '',
    ]
      .filter(Boolean)
      .join(' ')

    const model =
      process.env.FAL_VISUALISE_MODEL || 'fal-ai/nano-banana/edit'

    const falRes = await fetch(`https://fal.run/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_urls: [body.roomDataUrl, body.productImageUrl],
        num_images: 1,
        output_format: 'jpeg',
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
        error: falJson.detail || falJson.error || falJson.message || 'AI generation failed',
        code: 'FAL_ERROR',
      })
      return
    }

    const imageUrl =
      falJson.images?.[0]?.url || falJson.image?.url || null

    if (!imageUrl) {
      sendJson(res, 502, { error: 'AI returned no image', code: 'EMPTY_RESULT' })
      return
    }

    sendJson(res, 200, {
      imageUrl,
      provider: 'fal',
      model,
      mode: 'product-referenced',
    })
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : 'Visualise failed',
      code: 'SERVER_ERROR',
    })
  }
}

function attach(middlewares: Connect.Server) {
  middlewares.use('/api/visualise', (req, res, next) => {
    void handleVisualise(req, res).catch(next)
  })
  middlewares.use('/api/visualise-status', (_req, res) => {
    const configured = Boolean(process.env.FAL_KEY || process.env.VITE_FAL_KEY)
    sendJson(res, 200, {
      configured,
      mode: configured ? 'paid-ai' : 'preview-fallback',
    })
  })
}

/** Dev + preview middleware for product-referenced interior AI */
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
