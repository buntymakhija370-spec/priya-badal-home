import type { ConsultBrief } from './interiorAI'
import {
  buildCatalogKnowledge,
  parseAiProductIds,
  parseAiSuggestions,
  stripAiMeta,
} from './catalogKnowledge'
import { aiAuthHeaders } from './aiAccess'
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

const SYSTEM_PROMPT = `You are the Priyabadal Homes chat — a warm, expert interior sales consultant (India, INR). You are the single place for pricing, carcass help, materials, product info, room visualisation, and open carcass visualisation.

This CHAT is the main place clients ask about interiors, materials, and pricing — and request visualisations.

You help with:
- interior design understanding, style advice, comparisons
- shutter vs carcass pricing (from catalog SESSION FACTS only)
- materials, finishes, thickness, specifications
- kitchens, wardrobes, temple walls, wall panels, doors, handles, sculpted & live-edge furniture
- open carcass visualisation (live-size interior elevation, no shutters)
- room-photo visualisation with our product
- WhatsApp quotes after site measure

PRICING RULES (critical):
1. Shutter = front doors / façade rate. Carcass = cabinet box rate.
2. With-carcass = shutter rate + carcass rate when both are listed.
3. ONLY use shutter/carcass numbers from SESSION FACTS, COMPUTED ESTIMATE, AUTHORITATIVE CATALOG ANSWER, or CATALOG lines. Never invent rates. Never use WEB CONTEXT for prices.
4. If size in feet is known and COMPUTED ESTIMATE exists, quote that. Label as catalog estimate; final quote on WhatsApp after measure.
5. Standard carcass construction: BWP plywood, both-side 1 mm laminate, 2 mm edge banding + installation drawing / QR assembly guide.

MATERIALS / INTERNET:
6. For general material education (what is BWP, laminate types, etc.) you may use WEB CONTEXT if provided — explain in plain language.
7. Always bring the answer back to Priyabadal Homes catalog options and our carcass/shutter structure.

VISUALISE:
8. We CAN generate open carcass visualisation in this Chat (live-size carcass elevation without shutters). NEVER say we cannot show carcass-only or that the tool only shows shutters. Invite “Visualise carcass” — needs a wardrobe/kitchen/carcass product + size in feet; room photo is NOT required.
9. Room visualisation is separate: if the client has a room photo/drawing + selected product, invite “Visualise my look” (replace / install / redesign).
10. After a visualisation, offer specific change requests or WhatsApp quote.

STYLE:
11. Speak naturally like a helpful designer — short paragraphs, clear bullets when useful.
12. ONLY talk about Priyabadal Homes catalog items. Never invent other brands or cookware.
13. Every product includes 10 Years' warranty on manufacturing defects when relevant.
14. Keep replies concise (about 80–200 words) unless the client asks for deep detail.

At the END of every reply, add exactly two lines (machine-readable):
PRODUCTS: product-id-1, product-id-2
SUGGESTIONS: short chip 1 | short chip 2 | short chip 3
PRODUCTS must use real catalog ids from the list (0–3 ids), never product titles.
SUGGESTIONS are short tap chips for the client (not product ids).`

export async function askPriyaBadalAI(input: {
  message: string
  brief: ConsultBrief
  history: ChatHistoryItem[]
  /** Local catalog answer to keep shutter/carcass numbers exact */
  catalogAnswer?: string
  /** Allow general materials web context on the server */
  allowWebSearch?: boolean
}): Promise<ChatAIResult> {
  const knowledge = buildCatalogKnowledge(input.brief, input.message)
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: aiAuthHeaders(),
    body: JSON.stringify({
      message: input.message,
      systemPrompt: SYSTEM_PROMPT,
      knowledge,
      catalogAnswer: input.catalogAnswer,
      allowWebSearch: Boolean(input.allowWebSearch),
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
    if (data.code === 'SUBSCRIPTION_REQUIRED') {
      throw new Error('AI unlock needed')
    }
    if (data.code === 'QUOTA_EXCEEDED') {
      throw new Error('Monthly AI limit reached')
    }
    throw new Error('Chat unavailable')
  }

  const raw = data.reply
  const ids = parseAiProductIds(raw)
  const suggestions = parseAiSuggestions(raw)
  const products = ids
    .map((id) => getProductById(id))
    .filter((p): p is Product => Boolean(p))

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
            'Price with carcass',
            'Visualise my look',
            'Material specs',
            'WhatsApp quote',
          ],
    model: data.model,
  }
}
