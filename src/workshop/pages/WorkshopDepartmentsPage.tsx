import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchWorkshopDb, setJobStatus } from '../api'
import type { DepartmentId, WorkshopDb } from '../types'
import { DEPARTMENTS } from '../types'

export function WorkshopDepartmentsPage() {
  const [db, setDb] = useState<WorkshopDb | null>(null)
  const [dept, setDept] = useState<DepartmentId>('cutting')
  const [busy, setBusy] = useState(false)

  const reload = () => fetchWorkshopDb().then(setDb)

  useEffect(() => {
    reload().catch(() => undefined)
  }, [])

  const queue = useMemo(() => {
    const orders = (db?.orders || []).filter(
      (o) => !['cancelled', 'delivered'].includes(o.status),
    )
    return orders
      .map((o) => ({
        order: o,
        status: o.jobs?.[dept] || 'queued',
      }))
      .filter((row) => row.status !== 'done')
  }, [db, dept])

  return (
    <div>
      <div className="ws-page-head">
        <div>
          <h1>Departments</h1>
          <p>Each workshop section updates job status — reports feed the backend board</p>
        </div>
      </div>

      <div className="ws-actions" style={{ marginBottom: '1rem' }}>
        {DEPARTMENTS.map((d) => (
          <button
            key={d.id}
            type="button"
            className={dept === d.id ? 'ws-btn ws-btn--primary' : 'ws-btn ws-btn--ghost'}
            onClick={() => setDept(d.id)}
          >
            {d.name}
          </button>
        ))}
      </div>

      <div className="ws-card">
        <h2>{DEPARTMENTS.find((d) => d.id === dept)?.name} queue</h2>
        {queue.length === 0 ? (
          <p className="ws-empty">No open jobs for this department.</p>
        ) : (
          <table className="ws-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Job</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {queue.map(({ order, status }) => (
                <tr key={order.id}>
                  <td>
                    <Link to={`/workshop/orders/${order.id}`}>{order.orderNo}</Link>
                  </td>
                  <td>{order.customerName}</td>
                  <td>{order.lines.map((l) => l.productName).join(', ')}</td>
                  <td>
                    <span className="ws-pill">{status.replace('_', ' ')}</span>
                  </td>
                  <td>
                    <div className="ws-actions">
                      <button
                        type="button"
                        className="ws-btn ws-btn--ghost"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true)
                          try {
                            await setJobStatus(order.id, dept, 'in_progress', `${dept} started`)
                            await reload()
                          } finally {
                            setBusy(false)
                          }
                        }}
                      >
                        Start
                      </button>
                      <button
                        type="button"
                        className="ws-btn ws-btn--primary"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true)
                          try {
                            await setJobStatus(order.id, dept, 'done', `${dept} completed`)
                            await reload()
                          } finally {
                            setBusy(false)
                          }
                        }}
                      >
                        Report done
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
