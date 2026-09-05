import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchWorkshopDb } from '../api'
import type { WorkshopDb } from '../types'
import { formatInr } from '../types'

export function WorkshopDashboard() {
  const [db, setDb] = useState<WorkshopDb | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchWorkshopDb()
      .then(setDb)
      .catch((e: Error) => setError(e.message))
  }, [])

  const stats = useMemo(() => {
    const orders = db?.orders || []
    return {
      open: orders.filter((o) => !['delivered', 'cancelled', 'dispatched'].includes(o.status)).length,
      production: orders.filter((o) => o.status === 'in_production' || o.status === 'qc').length,
      ready: orders.filter((o) => o.status === 'ready').length,
      partners: (db?.partners || []).filter((p) => p.active).length,
    }
  }, [db])

  const recent = (db?.orders || []).slice(0, 8)

  return (
    <div>
      <div className="ws-page-head">
        <div>
          <h1>Workshop dashboard</h1>
          <p>Orders · production · dispatch · channel partners</p>
        </div>
        <div className="ws-actions">
          <Link className="ws-btn ws-btn--primary" to="/workshop/new-order">
            New order
          </Link>
          <Link className="ws-btn ws-btn--ghost" to="/workshop/projects">
            Projects
          </Link>
          <Link className="ws-btn ws-btn--ghost" to="/workshop/modular">
            Modular mfg
          </Link>
          <Link className="ws-btn ws-btn--ghost" to="/workshop/display">
            Floor display
          </Link>
        </div>
      </div>

      {error ? <p className="ws-empty">{error}</p> : null}

      <div className="ws-grid-stats">
        <div className="ws-stat">
          <strong>{stats.open}</strong>
          <span>Open orders</span>
        </div>
        <div className="ws-stat">
          <strong>{stats.production}</strong>
          <span>In workshop</span>
        </div>
        <div className="ws-stat">
          <strong>{stats.ready}</strong>
          <span>Ready to dispatch</span>
        </div>
        <div className="ws-stat">
          <strong>{stats.partners}</strong>
          <span>Active partners</span>
        </div>
      </div>

      <div className="ws-card">
        <h2>Recent orders</h2>
        {recent.length === 0 ? (
          <p className="ws-empty">No orders yet. Add a WhatsApp / offline / partner order.</p>
        ) : (
          <table className="ws-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Source</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link to={`/workshop/orders/${o.id}`}>{o.orderNo}</Link>
                  </td>
                  <td>
                    {o.customerName}
                    <div style={{ color: '#3a4a40', fontSize: '0.8rem' }}>{o.customerPhone}</div>
                  </td>
                  <td>
                    <span className="ws-pill ws-pill--info">{o.source.replace('_', ' ')}</span>
                  </td>
                  <td>
                    <span className="ws-pill">{o.status.replace('_', ' ')}</span>
                  </td>
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
