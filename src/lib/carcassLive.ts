import {
  connectFalKey,
  fetchVisualiseStatus,
  urlToDataUrl,
  type VisualiseStatus,
} from './visualise'
import { aiAuthHeaders } from './aiAccess'
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
      headers: aiAuthHeaders(),
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

    const raw = data.error || data.hint || ''
    const exhausted = /exhausted balance|top up your balance|locked/i.test(raw)
    return {
      source: 'error',
      code: exhausted ? 'FAL_BALANCE' : data.code,
      message:
        data.code === 'SUBSCRIPTION_REQUIRED'
          ? 'Paid AI subscription required. Unlock with your access code first.'
          : data.code === 'QUOTA_EXCEEDED'
            ? 'Monthly carcass AI limit reached. Upgrade or wait for next month.'
            : data.code === 'MISSING_FAL_KEY'
              ? 'AI is not connected on the server yet. Please try later.'
              : exhausted
                ? 'AI credits are temporarily unavailable. Please try later.'
                : raw || 'Live-size AI could not generate this carcass. Try again.',
    }
  } catch (err) {
    return {
      source: 'error',
      message:
        err instanceof Error
          ? err.message
          : 'Could not reach live-size AI. Check your connection.',
    }
  }
}
