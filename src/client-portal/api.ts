import type { WorkshopOrder } from '../workshop/types'

export type ClientSession = {
  token: string
  expiresAt: string
  loginId: string
  name: string
  phone: string
}

export type ClientLoginResponse = {
  token: string
  expiresAt: string
  client: { loginId: string; name: string; phone: string }
  orders: WorkshopOrder[]
}

const SESSION_KEY = 'pbh-client-session-v2'

export function getClientSession(): ClientSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as ClientSession
    if (!session.token || !session.expiresAt) return null
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

export function setClientSession(session: ClientSession | null) {
  if (!session) sessionStorage.removeItem(SESSION_KEY)
  else sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

async function api<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(path, { ...init, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export async function clientLogin(loginId: string, pin: string) {
  const res = await api<ClientLoginResponse>('/api/workshop/client/login', {
    method: 'POST',
    body: JSON.stringify({ loginId, pin }),
  })
  const session: ClientSession = {
    token: res.token,
    expiresAt: res.expiresAt,
    loginId: res.client.loginId,
    name: res.client.name,
    phone: res.client.phone,
  }
  setClientSession(session)
  return { ...res, session }
}

export function refreshClientOrders(session: ClientSession) {
  return api<{ orders: WorkshopOrder[]; client?: ClientSession }>(
    '/api/workshop/client/orders',
    { method: 'GET' },
    session.token,
  )
}

export async function clientLogout(session: ClientSession | null) {
  if (session?.token) {
    try {
      await api('/api/workshop/logout', { method: 'POST', body: '{}' }, session.token)
    } catch {
      // ignore
    }
  }
  setClientSession(null)
}
