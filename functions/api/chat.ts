import {
  corsPreflight,
  getChatModel,
  getFalKey,
  json,
  missingKeyResponse,
  type Env,
} from '../_shared/fal'

type ChatBody = {
  message?: string
  systemPrompt?: string
  knowledge?: string
  brief?: Record<string, unknown>
  history?: Array<{ role?: string; text?: string }>
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const falKey = getFalKey(context.env)
  if (!falKey) return missingKeyResponse()

  try {
    const body = (await context.request.json()) as ChatBody
    const message = (body.message || '').trim()
    if (!message) return json({ error: 'Message is required' }, 400)

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

    const model = getChatModel(context.env)
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
      return json(
        {
          error:
            falJson.error ||
            falJson.detail ||
            falJson.message ||
            'Chat AI request failed',
          code: 'FAL_CHAT_ERROR',
        },
        502,
      )
    }

    const reply = (falJson.output || '').trim()
    if (!reply) {
      return json({ error: 'Chat AI returned an empty reply', code: 'EMPTY_REPLY' }, 502)
    }

    return json({
      reply,
      provider: 'fal',
      model,
      mode: 'sales-chat',
    })
  } catch (err) {
    return json(
      {
        error: err instanceof Error ? err.message : 'Chat failed',
        code: 'SERVER_ERROR',
      },
      500,
    )
  }
}

export const onRequestOptions: PagesFunction = async () => corsPreflight()
