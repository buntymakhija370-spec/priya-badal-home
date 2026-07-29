import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchWorkshopDb } from '../api'
import type { OrderSource, OrderStatus, WorkshopDb } from '../types'
import { ORDER_SOURCES, ORDER_STATUSES, formatInr } from '../types'

export function WorkshopOrdersPage() {
  const [db, setDb] = useState<WorkshopDb | null>(null)
  const [source, setSource] = useState<OrderSource | 'all'>('all')
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [q, setQ] = useState('')

  useEffect(() => {
    fetchWorkshopDb().then(setDb).catch(() => setDb(null))
  }, [])

  const rows = useMemo(() => {
    let list = db?.orders || []
    if (source !== 'all') list = list.filter((o) => o.source === source)
    if (status !== 'all') list = list.filter((o) => o.status === status)
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      list = list.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(s) ||
          o.customerName.toLowerCase().includes(s) ||
          o.customerPhone.includes(s) ||
          (o.partnerName || '').toLowerCase().includes(s),
      )
    }
    return list
  }, [db, source, status, q])

  return (
    <div>
      <div className="ws-page-head">
        <div>
          <h1>Orders</h1>
          <p>Website · WhatsApp · offline showroom · channel partners</p>
        </div>
        <Link className="ws-btn ws-btn--primary" to="/workshop/new-order">
          New order
        </Link>
      </div>

      <div className="ws-card ws-stack" style={{ marginBottom: '1rem' }}>
        <div className="ws-form__row">
          <div className="ws-field">
            <label htmlFor="q">Search</label>
            <input
              id="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Order no, name, phone…"
            />
          </div>
          <div className="ws-field">
            <label htmlFor="source">Source</label>
            <select
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value as OrderSource | 'all')}
            >
              <option value="all">All sources</option>
              {ORDER_SOURCES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="ws-field">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus | 'all')}
          >
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ws-card">
        {rows.length === 0 ? (
          <p className="ws-empty">No matching orders.</p>
        ) : (
          <table className="ws-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Source</th>
                <th>Partner</th>
                <th>Status</th>
                <th>Due</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link to={`/workshop/orders/${o.id}`}>{o.orderNo}</Link>
                    <div style={{ fontSize: '0.75rem', color: '#3a4a40' }}>
                      {new Date(o.createdAt).toLocaleString('en-IN')}
                    </div>
                  </td>
                  <td>
                    {o.customerName}
                    <div style={{ fontSize: '0.8rem', color: '#3a4a40' }}>{o.customerPhone}</div>
                  </td>
                  <td>{o.source.replace('_', ' ')}</td>
                  <td>{o.partnerName || '—'}</td>
                  <td>
                    <span className="ws-pill">{o.status.replace('_', ' ')}</span>
                  </td>
                  <td>{o.dueDate || '—'}</td>
                  <td>{formatInr(o.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
