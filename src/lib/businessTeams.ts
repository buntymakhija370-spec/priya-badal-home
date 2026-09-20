import { buildCatalogKnowledge } from './catalogKnowledge'
import { WHATSAPP_CHAT_URL, WHATSAPP_DISPLAY } from './whatsapp'

export type BusinessTeamId = 'sales' | 'whatsapp' | 'instagram'

export type BusinessTeam = {
  id: BusinessTeamId
  name: string
  shortLabel: string
  blurb: string
  placeholder: string
  examples: string[]
}

export const BUSINESS_TEAMS: BusinessTeam[] = [
  {
    id: 'sales',
    name: 'Sales',
    shortLabel: 'Sales',
    blurb:
      'Showroom sales coach — pitches, objections, budgets, and next steps from the live catalog.',
    placeholder:
      'Example: Client wants an economic kitchen for 10×8 ft in Indore. Budget around ₹1.8L. What do I pitch first?',
    examples: [
      'Pitch G-Series wall panels for a 12×9 living room, budget ₹40k.',
      'Client says carcass is too expensive — how do I handle that?',
      'Compare hinged vs sliding wardrobe for a 7 ft bay.',
    ],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp sales',
    shortLabel: 'WhatsApp',
    blurb:
      'Draft warm WhatsApp replies and quotation messages ready to send from our number.',
    placeholder:
      'Paste the customer WhatsApp message here, or describe what to send (product, size, finish).',
    examples: [
      'Customer: “Wardrobe price for 8×7 ft?” Draft a reply with tentative rate + measure next step.',
      'Write a follow-up for a cart quote that went quiet for 3 days.',
      'Customer asked for Live Edge table availability — reply professionally.',
    ],
  },
  {
    id: 'instagram',
    name: 'Instagram reel marketing',
    shortLabel: 'Reels',
    blurb:
      'Hooks, scripts, captions, and CTAs for Instagram Reels that sell Priyabadal Homes products.',
    placeholder:
      'Example: Analyze this reel idea — 15s kitchen shutter close-up to G-Series panel reveal. Or paste a caption/script to improve.',
    examples: [
      'Write a 20-second reel script for Silai Bunai wardrobe shutters.',
      'Hooks + CTA for a carcass-assembly QR reel targeting contractors.',
      'Improve this caption: “New kitchen look ✨ DM for quote”.',
    ],
  },
]

export function getBusinessTeam(id: BusinessTeamId): BusinessTeam {
  return BUSINESS_TEAMS.find((t) => t.id === id) ?? BUSINESS_TEAMS[0]!
}

const SHARED_RULES = `Brand: Priyabadal Homes (India, INR). WhatsApp sales line: ${WHATSAPP_DISPLAY}.
Rules:
- Use ONLY catalog facts from the AUTHORITATIVE CATALOG block for products, rates, finishes, thickness.
- Never invent SKUs, brands, or prices. Label estimates as tentative; final quote after measure / finish choice.
- Shutter = façade rate. Carcass = box rate. With-carcass = shutter + carcass when both listed.
- Economic wall panels: lead with G-Series HDR + poly/PU, 6 mm, custom colour, ₹600/sq ft when relevant.
- Mention 10 Years' warranty on manufacturing defects when it helps close.
- Keep replies practical and concise for a busy showroom owner.`

const TEAM_SYSTEM: Record<BusinessTeamId, string> = {
  sales: `You are the Priyabadal Homes Sales Team lead — coach the owner/salesperson.

${SHARED_RULES}

Output format:
1) Client read (1–2 lines)
2) Pitch (ranges + tentative INR from catalog)
3) Objection handling (if needed)
4) Next steps (Visualise / measure / WhatsApp quote)
5) Suggested say-this line the salesperson can speak aloud

Do not invent catalog numbers. Prefer bullets over long essays.`,

  whatsapp: `You are the Priyabadal Homes WhatsApp Sales Team — draft messages the owner can paste into WhatsApp.

${SHARED_RULES}
Our public WhatsApp: ${WHATSAPP_CHAT_URL}

Output format:
1) Intent (what the customer wants)
2) Ready-to-send WhatsApp reply (warm, short paragraphs, INR tentative rates from catalog, clear next step)
3) Optional follow-up message (if useful)
4) Internal note for the owner (what to confirm / measure)

The Ready-to-send block must be copy-paste ready — no markdown tables inside it. Sign off naturally as Priyabadal Homes.`,

  instagram: `You are the Priyabadal Homes Instagram Reel Marketing Team.

${SHARED_RULES}

You create and analyse Instagram Reels for this furniture / interior brand (wardrobes, kitchens, wall panels, doors, live edge, Silai Bunai, etc.).

Output format:
1) Verdict / angle (what will hook Indian homeowners / contractors)
2) Hook (first 1–2 seconds on-screen text)
3) Shot list / script timed in seconds
4) Caption (emoji sparingly; Hindi-English mix OK if natural)
5) Hashtags (8–12 relevant, not spammy)
6) CTA (DM / WhatsApp ${WHATSAPP_DISPLAY} / site)
7) Product tie-in (real catalog ranges only)

If the owner pasted an existing caption or metrics, critique first, then rewrite. Keep it brand-safe and commercial — no fake celebrity claims.`,
}

export function teamSystemPrompt(teamId: BusinessTeamId): string {
  return TEAM_SYSTEM[teamId]
}

/** Compact catalog knowledge for team prompts */
export function teamCatalogKnowledge(query = ''): string {
  return buildCatalogKnowledge({}, query)
}

export type TeamHistoryItem = {
  role: 'user' | 'assistant'
  text: string
}

export type TeamAskResult = {
  text: string
  model?: string
  provider?: string
}

const ADMIN_PIN_KEY = 'pbh-teams-admin-pin'

export function getTeamsAdminPin(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_PIN_KEY)
  } catch {
    return null
  }
}

export function setTeamsAdminPin(pin: string | null) {
  try {
    if (!pin) sessionStorage.removeItem(ADMIN_PIN_KEY)
    else sessionStorage.setItem(ADMIN_PIN_KEY, pin)
  } catch {
    /* ignore */
  }
}

export async function unlockBusinessTeams(pin: string): Promise<void> {
  const res = await fetch('/api/ai-admin', {
    headers: { 'X-AI-Admin': pin.trim() },
  })
  const data = (await res.json()) as { error?: string }
  if (!res.ok) throw new Error(data.error || 'Admin PIN incorrect')
  setTeamsAdminPin(pin.trim())
}

export async function askBusinessTeam(input: {
  teamId: BusinessTeamId
  message: string
  history?: TeamHistoryItem[]
  adminPin?: string | null
}): Promise<TeamAskResult> {
  const pin = input.adminPin ?? getTeamsAdminPin()
  if (!pin) throw new Error('Unlock with admin PIN first')

  const message = input.message.trim()
  if (!message) throw new Error('Write a brief for the team first')

  const res = await fetch('/api/teams', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AI-Admin': pin,
    },
    body: JSON.stringify({
      teamId: input.teamId,
      message,
      systemPrompt: teamSystemPrompt(input.teamId),
      knowledge: teamCatalogKnowledge(message).slice(0, 90_000),
      history: (input.history ?? []).slice(-12),
    }),
  })

  const data = (await res.json()) as {
    reply?: string
    model?: string
    provider?: string
    error?: string
  }

  if (!res.ok || !data.reply) {
    throw new Error(data.error || 'Team request failed')
  }

  return {
    text: data.reply.trim(),
    model: data.model,
    provider: data.provider,
  }
}

/** Pull the Ready-to-send WhatsApp block when present */
export function extractWhatsAppDraft(reply: string): string | null {
  const match = reply.match(
    /Ready-to-send WhatsApp reply[:\s]*([\s\S]*?)(?=\n\s*(?:\d+\)|Optional follow-up|Internal note)\b|$)/i,
  )
  if (!match?.[1]) return null
  return match[1].trim().replace(/^```[\s\S]*?\n/, '').replace(/\n```$/, '').trim()
}
