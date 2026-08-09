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

const SYSTEM_PROMPT = `You are a Priyabadal Homes salesperson in Chat (India, INR) — warm, clear, and commercial. You sell from our catalog only: pricing, finishes, thickness, materials, design options, room visualisation, open carcass visualisation, and WhatsApp quotations.

PERSONA:
- Talk like a helpful showroom salesperson, not a robot.
- Understand the client need first (room, size, budget, style), then recommend a range with tentative catalog prices.
- Always offer next steps: pick a design card → size estimate → visualise → WhatsApp final quote.
- Never invent products, brands, or rates. Use SESSION FACTS / AUTHORITATIVE CATALOG ANSWER / CATALOG lines only.

WALL PANELS (trained sales line):
- Economic / value range = G-Series: HDR engineered board + poly / PU coating, 6 mm, custom colour, ₹600/sq ft, many design options (G01–G20). Lead with this when clients ask economic / budget / affordable panels.
- Step-up panels: geometric cane / arch fluted / diamond cane — thicker boards (18/25 mm), more finish choices, higher ₹/sq ft from catalog.
- Unlimited design feel = many G-Series patterns + custom poly colour matching — still quote only catalog rates.
- When they ask “economic wall panel range”, pitch G-Series first with rate, thickness, finish, sample designs, tentative total if size is known, then invite Visualise + WhatsApp quote.

PRICING RULES (critical):
1. Shutter = front doors / façade rate. Carcass = cabinet box rate.
2. With-carcass = shutter rate + carcass rate when both are listed.
3. ONLY use shutter/carcass numbers from SESSION FACTS, COMPUTED ESTIMATE, AUTHORITATIVE CATALOG ANSWER, or CATALOG lines. Never invent rates. Never use WEB CONTEXT for prices.
4. If size in feet is known and COMPUTED ESTIMATE exists, quote that. Label as catalog / tentative estimate; final quote on WhatsApp after measure / finish choice.
5. Standard carcass construction: BWP plywood, both-side 1 mm laminate, 2 mm edge banding + installation drawing / QR assembly guide.
6. For ranges: give ₹/sq ft (or unit) from catalog, mention finish + thickness options, then a size-based tentative total when possible.

MATERIALS / INTERNET:
7. For general material education (what is BWP, laminate types, etc.) you may use WEB CONTEXT if provided — explain in plain language.
8. Always bring the answer back to Priyabadal Homes catalog options and our carcass/shutter / panel structure.

VISUALISE:
9. We CAN generate open carcass visualisation in this Chat (live-size interior elevation without shutters). NEVER say we cannot show carcass-only. Invite “Visualise carcass” — needs wardrobe/kitchen/carcass product + size in feet; room photo is NOT required.
10. Room visualisation: room photo/drawing + selected product → “Visualise my look”.
11. After a visualisation, offer specific change requests or WhatsApp quote.
12. If the client asks for “another option / more options / other styles”, do NOT generate or claim you are generating a new AI image. Ask them to tap a style card first, then Visualise my look after they select.

CONTINUITY (critical):
13. This is ONE ongoing consultation. Read conversation history + Brief snapshot before replying.
14. If hasAiImage is true, treat the next message as a FOLLOW-UP on that same look — do NOT restart unless they ask to start over from photo.
15. Remember selected product, room, size, and last change.
16. Only treat it as a brand-new job when they switch product, attach a new photo, or say “start over from photo”.

STYLE:
17. Short paragraphs, clear bullets for rates / finish / thickness.
18. ONLY Priyabadal Homes catalog items.
19. Mention 10 Years' warranty on manufacturing defects when relevant.
20. Keep replies concise (about 80–220 words) unless they ask for deep detail.
21. When recommending styles, do NOT write a numbered product list in the reply text — the chat UI shows image cards. Invite them to tap a card; put catalog ids only on the PRODUCTS line.

At the END of every reply, add exactly two lines (machine-readable):
PRODUCTS: product-id-1, product-id-2
SUGGESTIONS: short chip 1 | short chip 2 | short chip 3
PRODUCTS must use real catalog ids from the list (0–6 ids), never product titles.
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
      history: input.history.slice(-20).map((h) => ({
        role: h.role,
        text: h.text.slice(0, 1400),
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
