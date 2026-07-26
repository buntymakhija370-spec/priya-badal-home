import {
  connectFalKey,
  fetchVisualiseStatus,
  urlToDataUrl,
  type VisualiseStatus,
} from './visualise'
import type { CarcassCategory, CarcassQuote } from './carcassPlanner'
import { getFinish, getThickness } from './pricing'

export type LiveCarcassResult = {
  imageUrl?: string
  source: 'ai' | 'error'
  message: string
  code?: string
}

export async function fetchCarcassAiStatus(): Promise<VisualiseStatus> {
  return fetchVisualiseStatus()
}

export async function connectCarcassAiKey(key: string): Promise<VisualiseStatus> {
  return connectFalKey(key)
}

export async function generateLiveCarcass(input: {
  carcassImagePath: string
  productName: string
  category: CarcassCategory
  quote: CarcassQuote
  finishId: string
  thicknessId: string
  notes?: string
}): Promise<LiveCarcassResult> {
  try {
    const carcassImageUrl = await urlToDataUrl(input.carcassImagePath)

    const res = await fetch('/api/carcass-live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        carcassImageUrl,
        productName: input.productName,
        category: input.category,
        widthFt: input.quote.width,
        heightFt: input.quote.height,
        depthFt: input.quote.depth,
        baySummary: input.quote.baySummary,
        finishLabel: getFinish(input.finishId).name,
        thicknessLabel: getThickness(input.thicknessId).label,
        notes: input.notes,
      }),
    })

    const data = (await res.json()) as {
      imageUrl?: string
      error?: string
      code?: string
      hint?: string
    }

    if (res.ok && data.imageUrl) {
      return {
        imageUrl: data.imageUrl,
        source: 'ai',
        message: `Live-size AI carcass · ${input.quote.width} × ${input.quote.height} × ${input.quote.depth} ft`,
      }
    }

    return {
      source: 'error',
      code: data.code,
      message:
        data.code === 'MISSING_FAL_KEY'
          ? 'Connect your Fal.ai key below to generate live-size carcass AI.'
          : data.error ||
            data.hint ||
            'Live-size AI could not generate this carcass. Try again.',
    }
  } catch (err) {
    return {
      source: 'error',
      message:
        err instanceof Error
          ? err.message
          : 'Could not reach live-size AI. Check connection / key.',
    }
  }
}
