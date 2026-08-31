import { WHATSAPP_CHAT_URL } from './whatsapp'

const TOKEN_KEY = 'pbh-ai-access-token'

export type AiPlan = {
  id: string
  name: string
  priceLabel: string
  visualise: number
  chat: number
  carcass: number
}

export type AiSubscriberPublic = {
  id: string
  planId: string
  planName: string
  priceLabel: string
  active: boolean
  period: string
  used: { visualise: number; chat: number; carcass: number }
  limits: { visualise: number; chat: number; carcass: number }
  remaining: { visualise: number; chat: number; carcass: number }
  name?: string | null
}

export type AiAccessStatus = {
  falConfigured: boolean
  subscribed: boolean
  requireSubscription: boolean
  subscriber?: AiSubscriberPublic
  plans: AiPlan[]
  configured?: boolean
  mode?: string
}

export function getAiAccessToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAiAccessToken(token: string | null) {
  try {
    if (!token) localStorage.removeItem(TOKEN_KEY)
    else localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* ignore */
  }
}

export function aiAuthHeaders(extra?: HeadersInit): HeadersInit {
  const token = getAiAccessToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'X-AI-Access': token } : {}),
    ...extra,
  }
}

export async function fetchAiAccessStatus(): Promise<AiAccessStatus> {
  try {
    const res = await fetch('/api/ai-access', {
      method: 'POST',
      headers: aiAuthHeaders(),
      body: JSON.stringify({ token: getAiAccessToken() }),
    })
    if (!res.ok) {
      return {
        falConfigured: false,
        subscribed: false,
        requireSubscription: false,
        plans: [],
      }
    }
    return (await res.json()) as AiAccessStatus
  } catch {
    return {
      falConfigured: false,
      subscribed: false,
      requireSubscription: false,
      plans: [],
    }
  }
}

export async function unlockAiAccess(code: string): Promise<AiAccessStatus & { token?: string }> {
  const res = await fetch('/api/ai-unlock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code.trim() }),
  })
  const data = (await res.json()) as {
    ok?: boolean
    token?: string
    subscriber?: AiSubscriberPublic
    error?: string
    code?: string
    plans?: AiPlan[]
  }
  if (!res.ok || !data.token) {
    throw new Error(data.error || 'Could not unlock AI')
  }
  setAiAccessToken(data.token)
  // Re-check server so falConfigured reflects reality (don’t assume Fal is on)
  const status = await fetchAiAccessStatus()
  return {
    ...status,
    subscribed: true,
    subscriber: data.subscriber ?? status.subscriber,
    plans: data.plans || status.plans || [],
    token: data.token,
  }
}

export function clearAiAccess() {
  setAiAccessToken(null)
}

export function subscribeWhatsAppUrl(planName?: string) {
  const text = [
    'Hi Priyabadal Homes, I want to subscribe to paid AI access.',
    'Rate: ₹25 per AI image (visualise / carcass).',
    planName ? `Plan: ${planName}` : '',
    '',
    'Please share payment details and my access code.',
  ]
    .filter(Boolean)
    .join('\n')
  return `${WHATSAPP_CHAT_URL}?text=${encodeURIComponent(text)}`
}

export function formatAiQuota(sub?: AiSubscriberPublic | null) {
  if (!sub) return 'Not subscribed'
  const r = sub.remaining
  return `${r.visualise} visualise · ${r.chat} chat · ${r.carcass} carcass left this month`
}
