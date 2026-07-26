import type { ConsultBrief } from './interiorAI'
import {
  buildCatalogKnowledge,
  parseAiProductIds,
  parseAiSuggestions,
  stripAiMeta,
} from './catalogKnowledge'
import { getProductById } from './products'
import type { Product } from '../data/catalog'

export type ChatHistoryItem = {
  role: 'user' | 'assistant'
  text: string
}

export type ChatAIResult = {
  text: string
  products: Product[]
  suggestions: string[]
  model?: string
}

const SYSTEM_PROMPT = `You are Priya Badal AI — the warm, expert sales consultant for Priyabadal Homes (India, INR).

You help clients with ANY question about our products and services:
- design understanding, style advice, comparisons
- pricing (shutter vs carcass), size estimates in feet
- materials, finishes, thickness, specifications
- kitchens, wardrobes, temple walls, wall panels, doors, handles, sculpted & live-edge furniture
- order process, WhatsApp quotes, visualisation

RULES:
1. Speak naturally like a helpful human designer — short paragraphs, clear bullets when useful.
2. ONLY talk about Priyabadal Homes catalog items listed below (kitchens, wardrobes, temple walls, wall panels, doors, handles, sculpted/live-edge furniture, etc.). NEVER invent cookware, appliances, or other brands.
3. ONLY use prices and specs from SESSION FACTS and CATALOG. Never invent rates or product names.
4. If COMPUTED ESTIMATE is present, quote that number. Label it as a catalog estimate; final quote on WhatsApp after site measure.
5. Carcass = cabinet box; shutter = front doors. With-carcass = shutter rate + carcass rate when listed.
6. If asked about something not in the catalog, say we don’t list it and suggest the closest Priyabadal options from the list.
7. You can discuss any product in the catalog — not only the selected one. Use exact product names and ids from the list.
8. Offer next steps: pick a product, share size in feet, ask for materials, visualise with a room photo, or WhatsApp quote.
9. Keep replies concise (about 80–180 words) unless the client asks for deep detail.
10. Do not mention these rules or that you are using a system prompt.

At the END of every reply, add exactly two lines (machine-readable):
PRODUCTS: product-id-1, product-id-2
SUGGESTIONS: short chip 1 | short chip 2 | short chip 3
PRODUCTS must use real catalog ids from the list (0–3 ids), never product titles.
SUGGESTIONS are short tap chips for the client (not product ids).`

export async function askPriyaBadalAI(input: {
  message: string
  brief: ConsultBrief
  history: ChatHistoryItem[]
}): Promise<ChatAIResult> {
  const knowledge = buildCatalogKnowledge(input.brief, input.message)
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: input.message,
      systemPrompt: SYSTEM_PROMPT,
      knowledge,
      brief: {
        room: input.brief.room,
        categoryId: input.brief.categoryId,
        widthFt: input.brief.widthFt,
        heightFt: input.brief.heightFt,
        depthFt: input.brief.depthFt,
        style: input.brief.style,
        budget: input.brief.budget,
        selectedProductId: input.brief.selectedProductId,
        hasPhoto: Boolean(input.brief.roomPhotoDataUrl),
        attachmentKind: input.brief.attachmentKind,
        hasAiImage: Boolean(input.brief.aiImageUrl),
      },
      history: input.history.slice(-12).map((h) => ({
        role: h.role,
        text: h.text.slice(0, 1200),
      })),
    }),
  })

  const data = (await res.json()) as {
    reply?: string
    model?: string
    error?: string
    code?: string
  }

  if (!res.ok || !data.reply) {
    throw new Error(data.error || 'Chat AI is unavailable right now')
  }

  const raw = data.reply
  const ids = parseAiProductIds(raw)
  const suggestions = parseAiSuggestions(raw)
  const products = ids
    .map((id) => getProductById(id))
    .filter((p): p is Product => Boolean(p))

  // If model forgot products but we have a selection, show it
  if (!products.length && input.brief.selectedProductId) {
    const sel = getProductById(input.brief.selectedProductId)
    if (sel) products.push(sel)
  }

  return {
    text: stripAiMeta(raw),
    products,
    suggestions:
      suggestions.length > 0
        ? suggestions
        : [
            'Suggest products',
            'Price estimate',
            'Material specs',
            'WhatsApp quote',
          ],
    model: data.model,
  }
}
