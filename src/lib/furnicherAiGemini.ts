import { aiAuthHeaders } from './aiAccess'
import type { ProjectBrief } from '../data/furnicherAi'

export type FurnicherGeminiResult = {
  text: string
  model?: string
  provider?: string
}

const FURNICHER_SYSTEM = `You are FurnicherAI for Priyabadal Homes — bulk furniture desk for hotels, hostels, and commercial projects (India, INR).

ROLE:
- Warm, clear B2B salesperson in chat. Keep the client in this chat (marketplace cards + BOQ).
- Communication must feel natural and correct: confirm what they said, ask one clear next question when needed, and never sound like a factory quotation bot.

PRICING RULES (critical — “100% accuracy” means never invent numbers):
1. ONLY use INR figures from AUTHORITATIVE DRAFT ESTIMATE below. Do not invent production / factory MRP.
2. Speak in draft / guide / similar-range language. Final rates are confirmed by Priyabadal Homes on WhatsApp.
3. If the authoritative block has no total yet, do not invent one — ask for unit count / kitchen ft / options.
4. Kitchen length in feet is a major cost driver — acknowledge it when present.

FLOOR PLAN:
5. If a floor plan image/PDF note is attached, briefly acknowledge what you can infer (unit type hints, kitchen run if readable). Do not invent dimensions you cannot see.
6. Always steer back to the guided options (unit type, count, kitchen ft, sofa, TV, wardrobe) and live draft calculator.

STYLE:
7. Short paragraphs, light bullets. About 60–180 words unless they ask for more.
8. Do NOT invent product SKUs. Marketplace cards are shown by the app — invite them to tap Add / Build BOQ.
9. End with a clear next step (confirm option, upload plan, or WhatsApp BOQ).
10. Do NOT add PRODUCTS: or SUGGESTIONS: machine lines.`

/** Polish FurnicherAI local turn with Gemini (falls back silently on failure). */
export async function askFurnicherGemini(input: {
  message: string
  brief: ProjectBrief
  history: Array<{ role: 'user' | 'ai'; text: string }>
  authoritativeDraft: string
  planDataUrl?: string
  planName?: string
}): Promise<FurnicherGeminiResult | null> {
  try {
    const res = await fetch('/api/furnicher-chat', {
      method: 'POST',
      headers: aiAuthHeaders(),
      body: JSON.stringify({
        message: input.message,
        systemPrompt: FURNICHER_SYSTEM,
        authoritativeDraft: input.authoritativeDraft,
        planDataUrl: input.planDataUrl,
        planName: input.planName || input.brief.planName,
        brief: {
          entry: input.brief.entry,
          projectType: input.brief.projectType,
          roomFormat: input.brief.roomFormat,
          roomCount: input.brief.roomCount,
          kitchenRunFt: input.brief.kitchenRunFt,
          kitchen: input.brief.kitchen,
          sofa: input.brief.sofa,
          tv: input.brief.tv,
          wardrobe: input.brief.wardrobe,
          hasPlan: input.brief.hasPlan,
          planName: input.brief.planName,
          unitSqft: input.brief.unitSqft,
        },
        history: input.history.slice(-16).map((h) => ({
          role: h.role === 'ai' ? 'assistant' : 'user',
          text: h.text.slice(0, 1400),
        })),
      }),
    })

    const data = (await res.json()) as {
      reply?: string
      model?: string
      provider?: string
      error?: string
      code?: string
    }

    if (!res.ok || !data.reply?.trim()) return null

    return {
      text: data.reply.trim(),
      model: data.model,
      provider: data.provider,
    }
  } catch {
    return null
  }
}

export async function fetchFurnicherAiStatus(): Promise<{
  configured: boolean
  provider: 'gemini' | 'fal' | 'none'
  chatModel?: string
}> {
  try {
    const res = await fetch('/api/furnicher-chat', { method: 'GET' })
    if (!res.ok) return { configured: false, provider: 'none' }
    const data = (await res.json()) as {
      configured?: boolean
      provider?: 'gemini' | 'fal' | 'none'
      chatModel?: string
    }
    return {
      configured: Boolean(data.configured),
      provider: data.provider || 'none',
      chatModel: data.chatModel,
    }
  } catch {
    return { configured: false, provider: 'none' }
  }
}
