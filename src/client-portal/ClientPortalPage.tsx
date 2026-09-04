import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { WHATSAPP_CHAT_URL } from '../lib/whatsapp'
import { formatInr, type WorkshopOrder } from '../workshop/types'
import {
  clientLogin,
  clientLogout,
  getClientSession,
  refreshClientOrders,
  type ClientSession,
} from './api'
import { buildClientStages, clientStatusLabel } from './stages'
import './client-portal.css'

export function ClientPortalPage() {
  const [session, setSession] = useState<ClientSession | null>(() => getClientSession())
  const [loginId, setLoginId] = useState('DEMO01')
  const [pin, setPin] = useState('1234')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<WorkshopOrder[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const refresh = useCallback(async (s: ClientSession) => {
    const data = await refreshClientOrders(s)
    setOrders(data.orders)
    setSelectedId((prev) => prev || data.orders[0]?.id || null)
  }, [])

  useEffect(() => {
    if (!session) return
    let cancelled = false
    const load = async () => {
      try {
        const data = await refreshClientOrders(session)
        if (cancelled) return
        setOrders(data.orders)
        setSelectedId((prev) => {
          if (prev && data.orders.some((o) => o.id === prev)) return prev
          return data.orders[0]?.id || null
        })
      } catch {
        if (!cancelled) {
          setSession(null)
        }
      }
    }
    void load()
    const t = window.setInterval(() => void load(), 8000)
    return () => {
      cancelled = true
      window.clearInterval(t)
    }
  }, [session])

  async function onLogin(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await clientLogin(loginId.trim(), pin.trim())
      setSession(res.session)
      setOrders(res.orders)
      setSelectedId(res.orders[0]?.id || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await clientLogout(session)
    setSession(null)
    setOrders([])
    setSelectedId(null)
  }

  const selected = orders.find((o) => o.id === selectedId) || null

  if (!session) {
    return (
      <main className="client-portal">
        <section className="client-portal__hero">
          <p className="client-portal__eyebrow">Client login</p>
          <h1>Track your order live</h1>
          <p className="client-portal__lede">
            Sign in with the login ID we share on WhatsApp. Follow CNC, paint booth, dispatch,
            and accounting in one place.
          </p>
        </section>

        <form className="client-portal__login" onSubmit={onLogin}>
          <label>
            Login ID
            <input
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              autoComplete="username"
              placeholder="e.g. DEMO01"
              required
            />
          </label>
          <label>
            PIN
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="current-password"
              placeholder="4-digit PIN"
              required
            />
          </label>
          {error ? <p className="client-portal__error">{error}</p> : null}
          <button className="client-portal__btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'View my orders'}
          </button>
          <p className="client-portal__hint">
            Demo login: <strong>DEMO01</strong> · PIN <strong>1234</strong>
          </p>
          <a className="client-portal__wa" href={WHATSAPP_CHAT_URL} target="_blank" rel="noreferrer">
            Prefer WhatsApp? Message us for your login ID
          </a>
        </form>
      </main>
    )
  }

  return (
    <main className="client-portal client-portal--app">
      <header className="client-portal__bar">
        <div>
          <p className="client-portal__eyebrow">Welcome</p>
          <h1>{session.name}</h1>
          <p className="client-portal__meta">
            Login {session.loginId} · {session.phone}
          </p>
        </div>
        <div className="client-portal__bar-actions">
          <button type="button" className="client-portal__btn client-portal__btn--ghost" onClick={() => void refresh(session)}>
            Refresh
          </button>
          <button type="button" className="client-portal__btn client-portal__btn--ghost" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      </header>

      <div className="client-portal__grid">
        <aside className="client-portal__list">
          <h2>Your orders</h2>
          {orders.length === 0 ? (
            <p className="client-portal__empty">No orders yet. Ask us on WhatsApp to place one.</p>
          ) : (
            <ul>
              {orders.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    className={o.id === selectedId ? 'is-active' : undefined}
                    onClick={() => setSelectedId(o.id)}
                  >
                    <strong>{o.orderNo}</strong>
                    <span>{clientStatusLabel(o)}</span>
                    <em>{formatInr(o.totalAmount)}</em>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <a className="client-portal__wa" href={WHATSAPP_CHAT_URL} target="_blank" rel="noreferrer">
            Chat on WhatsApp
          </a>
        </aside>

        <section className="client-portal__detail">
          {!selected ? (
            <p className="client-portal__empty">Select an order to see live status.</p>
          ) : (
            <OrderDetail order={selected} />
          )}
        </section>
      </div>

      <p className="client-portal__staff">
        Need help?{' '}
        <a href={WHATSAPP_CHAT_URL} target="_blank" rel="noreferrer">
          Message us on WhatsApp
        </a>
      </p>
    </main>
  )
}

function OrderDetail({ order }: { order: WorkshopOrder }) {
  const stages = buildClientStages(order)
  const balance = Math.max(0, order.totalAmount - order.advancePaid)
  const current = stages.find((s) => s.state === 'current')

  return (
    <div className="client-order">
      <div className="client-order__head">
        <div>
          <p className="client-portal__eyebrow">Live status</p>
          <h2>{order.orderNo}</h2>
          <p className="client-order__now">
            Now: <strong>{current?.label || 'Complete'}</strong>
          </p>
        </div>
        <div className="client-order__money">
          <span>Total {formatInr(order.totalAmount)}</span>
          <span>Advance {formatInr(order.advancePaid)}</span>
          <span className={balance > 0 ? 'is-due' : 'is-clear'}>
            {balance > 0 ? `Balance ${formatInr(balance)}` : 'Paid in full'}
          </span>
        </div>
      </div>

      <ol className="client-timeline">
        {stages.map((stage) => (
          <li key={stage.id} className={`client-timeline__item is-${stage.state}`}>
            <span className="client-timeline__dot" aria-hidden="true" />
            <div>
              <strong>{stage.label}</strong>
              <p>{stage.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="client-order__lines">
        <h3>Items</h3>
        <ul>
          {order.lines.map((line) => (
            <li key={line.id}>
              <span>
                {line.productName}
                {line.qty > 1 ? ` × ${line.qty}` : ''}
              </span>
              <span>{formatInr(line.unitPrice * line.qty)}</span>
            </li>
          ))}
        </ul>
      </div>

      {order.dispatchNotes || order.vehicleNo ? (
        <div className="client-order__note">
          <h3>Dispatch</h3>
          {order.vehicleNo ? <p>Vehicle: {order.vehicleNo}</p> : null}
          {order.dispatchNotes ? <p>{order.dispatchNotes}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
