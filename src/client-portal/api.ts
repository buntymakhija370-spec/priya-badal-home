import type { WorkshopOrder } from '../workshop/types'

export type ClientSession = {
  loginId: string
  name: string
  phone: string
  pin: string
}

export type ClientLoginResponse = {
  client: ClientSession
  orders: WorkshopOrder[]
}

const SESSION_KEY = 'pbh-client-session'

export function getClientSession(): ClientSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ClientSession
  } catch {
    return null
  }
}

export function setClientSession(session: ClientSession | null) {
  if (!session) sessionStorage.removeItem(SESSION_KEY)
  else sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export function clientLogin(loginId: string, pin: string) {
  return api<ClientLoginResponse>('/api/workshop/client/login', {
    method: 'POST',
    body: JSON.stringify({ loginId, pin }),
  })
}

export function fetchClientOrders(loginId: string, pin: string) {
  return api<{ orders: WorkshopOrder[] }>('/api/workshop/client/orders', {
    method: 'POST',
    body: JSON.stringify({ loginId, pin }),
  })
}

export function refreshClientOrders(session: ClientSession) {
  return fetchClientOrders(session.loginId, session.pin)
}
