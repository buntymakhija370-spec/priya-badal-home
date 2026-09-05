import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchWorkshopDb, setJobStatus } from '../api'
import { JobSheetList } from '../components/JobSheetList'
import type { DepartmentId, WorkshopDb } from '../types'
import { DEPARTMENTS } from '../types'

export function WorkshopDepartmentsPage() {
  const [db, setDb] = useState<WorkshopDb | null>(null)
  const [dept, setDept] = useState<DepartmentId>('review')
  const [busy, setBusy] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  const reload = () => fetchWorkshopDb().then(setDb)

  useEffect(() => {
    reload().catch(() => undefined)
  }, [])

  const queue = useMemo(() => {
    const orders = (db?.orders || []).filter((o) => !['cancelled', 'delivered'].includes(o.status))
    return orders
      .map((o) => ({
        order: o,
        status: o.jobs?.[dept] || 'queued',
      }))
      .filter((row) => row.status !== 'done')
  }, [db, dept])

  const deptName = DEPARTMENTS.find((d) => d.id === dept)?.name || dept

  return (
    <div>
      <div className="ws-page-head">
        <div>
          <h1>Departments</h1>
          <p>
            Open a department to see client orders waiting. Each order shows full product details —
            coating number/colour, laminate paste codes, leather, thickness — so the team knows
            exactly what to do.
          </p>
        </div>
      </div>

      <div className="ws-actions" style={{ marginBottom: '1rem' }}>
        {DEPARTMENTS.map((d) => (
          <button
            key={d.id}
            type="button"
            className={dept === d.id ? 'ws-btn ws-btn--primary' : 'ws-btn ws-btn--ghost'}
            onClick={() => {
              setDept(d.id)
              setOpenId(null)
            }}
          >
            {d.short}
          </button>
        ))}
      </div>

      <div className="ws-card">
        <h2>{deptName} queue</h2>
        {!queue.length ? (
          <p className="ws-empty">No open jobs for this department.</p>
        ) : (
          <div className="ws-dept-queue">
            {queue.map(({ order, status }) => {
              const expanded = openId === order.id
              return (
                <article className="ws-dept-job" key={order.id}>
                  <header className="ws-dept-job__head">
                    <div>
                      <Link to={`/workshop/orders/${order.id}`}>
                        <strong>{order.orderNo}</strong>
                      </Link>
                      <p className="ws-hint">
                        Client: {order.customerName} · {order.customerPhone}
                        {order.customerCity ? ` · ${order.customerCity}` : ''}
                      </p>
                      <p className="ws-hint">
                        {order.lines.length} product(s):{' '}
                        {order.lines.map((l) => l.productName).filter(Boolean).join(', ') || '—'}
                      </p>
                      <span className="ws-pill">{status.replace('_', ' ')}</span>
                    </div>
                    <div className="ws-actions">
                      <button
                        type="button"
                        className="ws-btn ws-btn--ghost"
                        onClick={() => setOpenId(expanded ? null : order.id)}
                      >
                        {expanded ? 'Hide details' : 'Show full job sheet'}
                      </button>
                      <button
                        type="button"
                        className="ws-btn ws-btn--ghost"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true)
                          try {
                            await setJobStatus(order.id, dept, 'in_progress', `${deptName} started`)
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
                            await setJobStatus(order.id, dept, 'done', `${deptName} completed`)
                            await reload()
                          } finally {
                            setBusy(false)
                          }
                        }}
                      >
                        Report done
                      </button>
                    </div>
                  </header>

                  {expanded ? (
                    <div className="ws-dept-job__body">
                      {order.productionNotes ? (
                        <p className="ws-hint">
                          <strong>Order notes:</strong> {order.productionNotes}
                        </p>
                      ) : null}
                      <JobSheetList
                        lines={order.lines}
                        title={`${deptName} must follow these product details`}
                      />
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
