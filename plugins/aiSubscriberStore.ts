/**
 * Paid AI subscriber access — codes + monthly usage caps.
 * Owner issues codes after WhatsApp/UPI payment; Fal only runs for unlocked subscribers.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomBytes } from 'node:crypto'
import type { IncomingMessage } from 'node:http'

export type AiKind = 'visualise' | 'chat' | 'carcass'

export type AiPlanId = 'starter' | 'pro' | 'custom'

export type AiPlan = {
  id: AiPlanId | string
  name: string
  priceLabel: string
  visualise: number
  chat: number
  carcass: number
}

export type AiSubscriber = {
  id: string
  code: string
  token: string
  planId: string
  name?: string
  phone?: string
  note?: string
  active: boolean
  createdAt: string
  /** YYYY-MM of current usage window */
  period: string
  used: { visualise: number; chat: number; carcass: number }
  /** Optional per-subscriber overrides */
  limits?: Partial<Record<AiKind, number>>
}

type StoreFile = {
  subscribers: AiSubscriber[]
}

const DATA_DIR = resolve(process.cwd(), 'data')
const STORE_PATH = resolve(DATA_DIR, 'ai-subscribers.json')

export const AI_PLANS: AiPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceLabel: '₹499 / month',
    visualise: 10,
    chat: 40,
    carcass: 5,
  },
  {
    id: 'pro',
    name: 'Pro',
    priceLabel: '₹1,499 / month',
    visualise: 40,
    chat: 150,
    carcass: 20,
  },
]

function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function emptyUsed() {
  return { visualise: 0, chat: 0, carcass: 0 }
}

function ensureStore(): StoreFile {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(STORE_PATH)) {
    const initial: StoreFile = { subscribers: [] }
    writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2))
    return initial
  }
  try {
    const raw = readFileSync(STORE_PATH, 'utf8')
    const parsed = JSON.parse(raw) as StoreFile
    if (!Array.isArray(parsed.subscribers)) return { subscribers: [] }
    return parsed
  } catch {
    return { subscribers: [] }
  }
}

function saveStore(store: StoreFile) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2))
}

export function getAdminPin() {
  return (process.env.AI_ADMIN_PIN || '2468').trim()
}

/** When true (default), Fal endpoints require a subscriber token */
export function requireSubscription() {
  const v = (process.env.AI_REQUIRE_SUBSCRIPTION || 'true').toLowerCase()
  return v !== 'false' && v !== '0' && v !== 'off'
}

export function getPlan(planId: string): AiPlan {
  const found = AI_PLANS.find((p) => p.id === planId)
  if (found) return found
  return {
    id: 'custom',
    name: 'Custom',
    priceLabel: 'Custom',
    visualise: 10,
    chat: 40,
    carcass: 5,
  }
}

function limitsFor(sub: AiSubscriber): Record<AiKind, number> {
  const plan = getPlan(sub.planId)
  return {
    visualise: sub.limits?.visualise ?? plan.visualise,
    chat: sub.limits?.chat ?? plan.chat,
    carcass: sub.limits?.carcass ?? plan.carcass,
  }
}

function refreshPeriod(sub: AiSubscriber): AiSubscriber {
  const now = monthKey()
  if (sub.period === now) return sub
  return { ...sub, period: now, used: emptyUsed() }
}

function publicSub(sub: AiSubscriber) {
  const limits = limitsFor(sub)
  const remaining = {
    visualise: Math.max(0, limits.visualise - sub.used.visualise),
    chat: Math.max(0, limits.chat - sub.used.chat),
    carcass: Math.max(0, limits.carcass - sub.used.carcass),
  }
  return {
    id: sub.id,
    planId: sub.planId,
    planName: getPlan(sub.planId).name,
    priceLabel: getPlan(sub.planId).priceLabel,
    active: sub.active,
    period: sub.period,
    used: sub.used,
    limits,
    remaining,
    name: sub.name || null,
  }
}

function makeCode() {
  const part = randomBytes(3).toString('hex').toUpperCase()
  return `PBH-AI-${part}`
}

function makeToken() {
  return randomBytes(24).toString('hex')
}

export function listPlans() {
  return AI_PLANS
}

export function listSubscribers() {
  const store = ensureStore()
  return store.subscribers.map((s) => {
    const refreshed = refreshPeriod(s)
    return {
      ...publicSub(refreshed),
      code: refreshed.code,
      phone: refreshed.phone || null,
      note: refreshed.note || null,
      createdAt: refreshed.createdAt,
      tokenPreview: `${refreshed.token.slice(0, 6)}…`,
    }
  })
}

export function createSubscriber(input: {
  planId: string
  name?: string
  phone?: string
  note?: string
  limits?: Partial<Record<AiKind, number>>
  code?: string
}) {
  const store = ensureStore()
  const planId = input.planId || 'starter'
  let code = (input.code || makeCode()).toUpperCase().trim()
  if (store.subscribers.some((s) => s.code === code)) {
    code = makeCode()
  }
  const sub: AiSubscriber = {
    id: randomBytes(8).toString('hex'),
    code,
    token: makeToken(),
    planId,
    name: input.name?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    note: input.note?.trim() || undefined,
    active: true,
    createdAt: new Date().toISOString(),
    period: monthKey(),
    used: emptyUsed(),
    limits: input.limits,
  }
  store.subscribers.push(sub)
  saveStore(store)
  return {
    code: sub.code,
    token: sub.token,
    subscriber: publicSub(sub),
  }
}

export function setSubscriberActive(codeOrId: string, active: boolean) {
  const store = ensureStore()
  const idx = store.subscribers.findIndex(
    (s) => s.code === codeOrId.toUpperCase() || s.id === codeOrId,
  )
  if (idx < 0) return null
  store.subscribers[idx] = { ...store.subscribers[idx]!, active }
  saveStore(store)
  return publicSub(refreshPeriod(store.subscribers[idx]!))
}

export function unlockWithCode(code: string) {
  const store = ensureStore()
  const raw = code.toUpperCase().trim()
  const idx = store.subscribers.findIndex((s) => s.code === raw)
  if (idx < 0) {
    return { ok: false as const, error: 'Invalid access code', code: 'INVALID_CODE' }
  }
  let sub = refreshPeriod(store.subscribers[idx]!)
  if (!sub.active) {
    return {
      ok: false as const,
      error: 'This subscription is paused. Message us on WhatsApp.',
      code: 'INACTIVE',
    }
  }
  // rotate token on unlock for simple device binding refresh
  sub = { ...sub, token: makeToken() }
  store.subscribers[idx] = sub
  saveStore(store)
  return {
    ok: true as const,
    token: sub.token,
    subscriber: publicSub(sub),
  }
}

export function getSubscriberByToken(token: string | undefined | null) {
  if (!token) return null
  const store = ensureStore()
  const idx = store.subscribers.findIndex((s) => s.token === token)
  if (idx < 0) return null
  let sub = refreshPeriod(store.subscribers[idx]!)
  if (sub.period !== store.subscribers[idx]!.period) {
    store.subscribers[idx] = sub
    saveStore(store)
  }
  if (!sub.active) return null
  return sub
}

export function statusForToken(token: string | undefined | null) {
  const sub = getSubscriberByToken(token)
  if (!sub) {
    return {
      subscribed: false,
      requireSubscription: requireSubscription(),
      plans: AI_PLANS,
    }
  }
  return {
    subscribed: true,
    requireSubscription: requireSubscription(),
    subscriber: publicSub(sub),
    plans: AI_PLANS,
  }
}

export function assertCanUse(
  token: string | undefined | null,
  kind: AiKind,
):
  | { ok: true; sub: AiSubscriber; remaining: number }
  | { ok: false; status: number; error: string; code: string; remaining?: number } {
  if (!requireSubscription()) {
    // subscription gate off — allow (owner testing)
    return { ok: true, sub: null as unknown as AiSubscriber, remaining: 999 }
  }
  const sub = getSubscriberByToken(token)
  if (!sub) {
    return {
      ok: false,
      status: 401,
      error: 'AI is for paid subscribers. Unlock with your access code.',
      code: 'SUBSCRIPTION_REQUIRED',
    }
  }
  const limits = limitsFor(sub)
  const used = sub.used[kind] || 0
  const remaining = limits[kind] - used
  if (remaining <= 0) {
    return {
      ok: false,
      status: 402,
      error: `Monthly ${kind} limit reached. Upgrade or wait for next month.`,
      code: 'QUOTA_EXCEEDED',
      remaining: 0,
    }
  }
  return { ok: true, sub, remaining }
}

export function consumeUsage(token: string, kind: AiKind) {
  if (!requireSubscription()) return
  const store = ensureStore()
  const idx = store.subscribers.findIndex((s) => s.token === token)
  if (idx < 0) return
  let sub = refreshPeriod(store.subscribers[idx]!)
  sub = {
    ...sub,
    used: { ...sub.used, [kind]: (sub.used[kind] || 0) + 1 },
  }
  store.subscribers[idx] = sub
  saveStore(store)
}

export function readAccessToken(req: IncomingMessage): string | null {
  const header =
    (req.headers['x-ai-access'] as string | undefined) ||
    (req.headers['x-ai-token'] as string | undefined) ||
    ''
  if (header.trim()) return header.trim()
  // also allow Authorization: Bearer <token>
  const auth = (req.headers.authorization || '').trim()
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim() || null
  }
  return null
}

export function readAdminPin(req: IncomingMessage, bodyPin?: string): string | null {
  const header = (req.headers['x-ai-admin'] as string | undefined) || ''
  if (header.trim()) return header.trim()
  if (bodyPin?.trim()) return bodyPin.trim()
  return null
}

export function assertAdmin(pin: string | null) {
  if (!pin || pin !== getAdminPin()) {
    return {
      ok: false as const,
      status: 401,
      error: 'Admin PIN required',
      code: 'ADMIN_REQUIRED',
    }
  }
  return { ok: true as const }
}
