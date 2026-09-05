import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchWorkshopDb, setJobStatus } from '../api'
import { JobSheetList } from '../components/JobSheetList'
import { StagePhotoProofPanel } from '../components/StagePhotoProofPanel'
import {
  departmentGate,
  hasStagePhotoProof,
  isDepartmentUnlocked,
  previousDepartment,
  PIPELINE_STAGES,
  stagePhotoCount,
} from '../pipeline'
import type { DepartmentId, WorkshopDb, WorkshopOrder } from '../types'
import { DEPARTMENTS } from '../types'

export function WorkshopDepartmentsPage() {
  const [db, setDb] = useState<WorkshopDb | null>(null)
  const [dept, setDept] = useState<DepartmentId>('review')
  const [busy, setBusy] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

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
  const prevId = previousDepartment(dept)
  const prevName = prevId ? PIPELINE_STAGES.find((s) => s.id === prevId)?.name || prevId : null

  function patchOrderInDb(next: WorkshopOrder) {
    setDb((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        orders: prev.orders.map((o) => (o.id === next.id ? next : o)),
      }
    })
  }

  return (
    <div>
      <div className="ws-page-head">
        <div>
          <h1>Departments</h1>
          <p>
            Every department must <strong>Start</strong>, post product photo proof, then{' '}
            <strong>Confirm with photo</strong>. The next department unlocks only after that — Review
            → Design → Cutting → Paint Booth → QC → Dispatch → Transport.
          </p>
        </div>
      </div>

      {error ? <p className="ws-error">{error}</p> : null}
      {message ? <p className="ws-hint">{message}</p> : null}

      <div className="ws-actions" style={{ marginBottom: '1rem' }}>
        {DEPARTMENTS.map((d) => (
          <button
            key={d.id}
            type="button"
            className={dept === d.id ? 'ws-btn ws-btn--primary' : 'ws-btn ws-btn--ghost'}
            onClick={() => {
              setDept(d.id)
              setOpenId(null)
              setError('')
              setMessage('')
            }}
          >
            {d.short}
          </button>
        ))}
      </div>

      <div className="ws-card">
        <h2>{deptName} queue</h2>
        {prevName ? (
          <p className="ws-hint">
            Orders stay locked here until <strong>{prevName}</strong> is marked done with photo
            proof.
          </p>
        ) : null}
        {!queue.length ? (
          <p className="ws-empty">No open jobs for this department.</p>
        ) : (
          <div className="ws-dept-queue">
            {queue.map(({ order, status }) => {
              const expanded = openId === order.id
              const pics = stagePhotoCount(order.photos, dept)
              const unlocked = isDepartmentUnlocked(order.jobs, dept)
              const startGate = departmentGate(order, dept, 'start')
              const doneGate = departmentGate(order, dept, 'done')
              const canDone = doneGate.ok
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
                      <div className="ws-actions" style={{ marginTop: '0.35rem' }}>
                        <span className="ws-pill">{status.replace('_', ' ')}</span>
                        {!unlocked ? (
                          <span className="ws-pill ws-pill--warn">Waiting previous department</span>
                        ) : (
                          <span
                            className={`ws-pill ${hasStagePhotoProof(order.photos, dept) ? 'ws-pill--ok' : 'ws-pill--warn'}`}
                          >
                            {hasStagePhotoProof(order.photos, dept)
                              ? `${pics} photo proof`
                              : 'Photo proof needed'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ws-actions">
                      <button
                        type="button"
                        className="ws-btn ws-btn--ghost"
                        onClick={() => setOpenId(expanded ? null : order.id)}
                      >
                        {expanded ? 'Hide details' : 'Show job + photo proof'}
                      </button>
                      <button
                        type="button"
                        className="ws-btn ws-btn--ghost"
                        disabled={busy || !startGate.ok}
                        title={startGate.ok ? 'Start this department' : startGate.reason}
                        onClick={async () => {
                          setBusy(true)
                          setError('')
                          try {
                            await setJobStatus(order.id, dept, 'in_progress', `${deptName} started`)
                            await reload()
                          } catch (e) {
                            setError(e instanceof Error ? e.message : 'Could not start')
                            setOpenId(order.id)
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
                        disabled={busy || !canDone}
                        title={canDone ? 'Confirm with photo proof' : doneGate.reason}
                        onClick={async () => {
                          setBusy(true)
                          setError('')
                          setMessage('')
                          try {
                            await setJobStatus(
                              order.id,
                              dept,
                              'done',
                              `${deptName} completed with photo proof`,
                            )
                            setMessage(
                              `${order.orderNo}: ${deptName} confirmed with photo — next department unlocked`,
                            )
                            await reload()
                          } catch (e) {
                            setError(e instanceof Error ? e.message : 'Could not mark done')
                            setOpenId(order.id)
                          } finally {
                            setBusy(false)
                          }
                        }}
                      >
                        Confirm with photo
                      </button>
                    </div>
                  </header>

                  {expanded ? (
                    <div className="ws-dept-job__body">
                      {!unlocked ? (
                        <p className="ws-error">{startGate.ok ? null : startGate.reason}</p>
                      ) : null}
                      {order.productionNotes ? (
                        <p className="ws-hint">
                          <strong>Order notes:</strong> {order.productionNotes}
                        </p>
                      ) : null}
                      <StagePhotoProofPanel
                        orderId={order.id}
                        departmentId={dept}
                        departmentLabel={deptName}
                        photos={order.photos?.[dept] || []}
                        disabled={busy || !unlocked}
                        onOrderChange={patchOrderInDb}
                        onError={setError}
                        onMessage={setMessage}
                      />
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
