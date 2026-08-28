import {
  CHAT_MODEL,
  IMAGE_MODEL,
  geminiChat,
  geminiEditImage,
  geminiKey,
  json,
  options,
  requireSubscription,
  type Env,
} from '../_shared/gemini'

type Ctx = { request: Request; env: Env; params: { route?: string | string[] } }

function routePath(params: Ctx['params']): string {
  const r = params.route
  if (!r) return ''
  return Array.isArray(r) ? r.join('/') : r
}

const INTERIOR_SYSTEM = [
  'You are a professional interior visualisation artist for Priyabadal Homes (India).',
  'Create client-ready, photorealistic interior photographs.',
  'Match the catalog product reference tightly. No watermarks or text overlays.',
].join(' ')

const CHAT_SYSTEM = `You are a Priyabadal Homes salesperson in Chat (India, INR).
Use only catalog facts from the prompt. Never invent prices.
End with:
PRODUCTS: id1, id2
SUGGESTIONS: chip 1 | chip 2 | chip 3`

export async function onRequest(context: Ctx): Promise<Response> {
  const { request, env, params } = context
  if (request.method === 'OPTIONS') return options()

  const path = routePath(params)
  const ready = Boolean(geminiKey(env))
  const needsSub = requireSubscription(env)

  try {
    if (path === 'visualise-status') {
      return json({
        configured: ready && !needsSub,
        falConfigured: ready,
        geminiConfigured: ready,
        subscribed: !needsSub,
        mode: ready ? (needsSub ? 'needs-subscription' : 'subscriber-ai') : 'needs-key',
        provider: ready ? 'gemini' : 'none',
        model: IMAGE_MODEL,
        refineModel: IMAGE_MODEL,
        chatModel: CHAT_MODEL,
        quality: 'flash-image',
        engine: ready
          ? 'Priyabadal · Google Gemini'
          : 'Priyabadal · Gemini not connected',
        requireSubscription: needsSub,
        plans: [],
      })
    }

    if (path === 'ai-access') {
      return json({
        falConfigured: ready,
        geminiConfigured: ready,
        provider: ready ? 'gemini' : 'none',
        subscribed: !needsSub,
        requireSubscription: needsSub,
        plans: [],
      })
    }

    if (path === 'ai-unlock' && request.method === 'POST') {
      // Subscription optional — unlock always succeeds when Gemini is on and sub mode is off
      if (!needsSub && ready) {
        return json({
          ok: true,
          token: 'gemini-open',
          subscriber: {
            planName: 'Gemini',
            active: true,
            remaining: { visualise: 999, chat: 999, carcass: 999 },
          },
        })
      }
      return json(
        { error: 'Unlock codes are disabled. Set GEMINI_API_KEY on the server.', code: 'DISABLED' },
        400,
      )
    }

    if (path === 'ai-admin') {
      const pin = request.headers.get('X-AI-Admin') || ''
      const expected = (env.AI_ADMIN_PIN || '2468').trim()
      if (pin !== expected) {
        return json({ error: 'Invalid admin PIN', code: 'FORBIDDEN' }, 403)
      }
      if (request.method === 'GET') {
        return json({
          subscribers: [],
          plans: [],
          falConfigured: ready,
          geminiConfigured: ready,
          provider: ready ? 'gemini' : 'none',
          requireSubscription: needsSub,
          hint: 'On Cloudflare Pages, set GEMINI_API_KEY in the project Environment variables (not via this form — keys do not persist on the edge).',
        })
      }
      if (request.method === 'POST') {
        const body = (await request.json()) as { action?: string }
        if (body.action === 'set-gemini-key') {
          return json({
            ok: false,
            error:
              'On live Cloudflare Pages, add GEMINI_API_KEY in the Pages project Settings → Environment variables, then redeploy. Admin paste only works on local npm run preview.',
          }, 400)
        }
        return json({ ok: true, subscribers: [] })
      }
    }

    if (path === 'chat' && request.method === 'POST') {
      if (!ready) {
        return json(
          { error: 'Gemini is not connected. Set GEMINI_API_KEY on the server.', code: 'MISSING_GEMINI_KEY' },
          503,
        )
      }
      const body = (await request.json()) as {
        message?: string
        catalogAnswer?: string
        history?: Array<{ role: string; text: string }>
        system?: string
      }
      const message = (body.message || '').trim()
      if (!message) return json({ error: 'Message required' }, 400)

      const prompt = [
        body.catalogAnswer?.trim()
          ? `AUTHORITATIVE CATALOG ANSWER (keep all INR figures exact):\n${body.catalogAnswer}`
          : '',
        `Client message: ${message}`,
        '',
        'Reply warmly. End with PRODUCTS: and SUGGESTIONS: lines.',
      ]
        .filter(Boolean)
        .join('\n')

      const { reply, model } = await geminiChat(env, {
        system: body.system || CHAT_SYSTEM,
        prompt,
        history: body.history,
      })
      return json({ reply, provider: 'gemini', model })
    }

    if ((path === 'visualise' || path === 'carcass-live') && request.method === 'POST') {
      if (!ready) {
        return json(
          {
            error: 'Gemini is not connected. Set GEMINI_API_KEY on the server.',
            code: 'MISSING_GEMINI_KEY',
          },
          503,
        )
      }
      const body = (await request.json()) as {
        roomDataUrl?: string
        productImageUrl?: string
        productImageUrls?: string[]
        productName?: string
        categoryName?: string
        colour?: string
        notes?: string
        changeRequest?: string
        refineImageUrl?: string
        carcassImageUrl?: string
        widthFt?: number
        heightFt?: number
        depthFt?: number
        baySummary?: string
      }

      if (path === 'carcass-live') {
        const imgs = [body.carcassImageUrl].filter(Boolean) as string[]
        const prompt = [
          `Open carcass / interior elevation visualisation for ${body.productName || 'cabinet'}.`,
          body.baySummary ? `Layout: ${body.baySummary}` : '',
          body.widthFt && body.heightFt
            ? `Size: ${body.widthFt} × ${body.heightFt} × ${body.depthFt || 2} ft`
            : '',
          'Show open carcass (no shutters), realistic shelves and proportions.',
        ]
          .filter(Boolean)
          .join('\n')
        const result = await geminiEditImage(env, {
          images: imgs,
          prompt,
          system: INTERIOR_SYSTEM,
          origin: new URL(request.url).origin,
        })
        return json({ imageUrl: result.dataUrl, provider: 'gemini', model: result.model })
      }

      const imgs = [
        body.refineImageUrl,
        body.roomDataUrl,
        body.productImageUrl,
        ...(body.productImageUrls || []),
      ].filter(Boolean) as string[]

      const prompt = [
        body.changeRequest?.trim()
          ? `Apply this change to the current visualisation: ${body.changeRequest}`
          : `Place ${body.productName || 'the product'} (${body.categoryName || 'catalog'}) into the customer room photograph.`,
        body.colour ? `Colour / finish: ${body.colour}` : '',
        body.notes ? `Notes: ${body.notes}` : '',
        'Photorealistic, correct perspective, matching lighting. No text overlays.',
      ]
        .filter(Boolean)
        .join('\n')

      const result = await geminiEditImage(env, {
        images: imgs,
        prompt,
        system: INTERIOR_SYSTEM,
        origin: new URL(request.url).origin,
      })
      return json({ imageUrl: result.dataUrl, provider: 'gemini', model: result.model })
    }

    return json({ error: `Unknown API route: ${path}` }, 404)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    const quota = /quota|RESOURCE_EXHAUSTED|billing/i.test(message)
    return json(
      {
        error: message,
        code: quota ? 'GEMINI_QUOTA' : 'SERVER_ERROR',
      },
      quota ? 429 : 500,
    )
  }
}
