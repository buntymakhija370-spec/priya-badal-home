import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import {
  BackLink,
  EventTimeline,
  PriorityBadge,
  StatusPill,
} from '../components/workshop/WorkshopUi'
import { stageLabel } from '../lib/workshopTypes'
import {
  fetchWorkerDetail,
  type WorkerDetailResponse,
  type WorkshopAuth,
} from '../lib/workshopClient'
import './WorkersApp.css'

type Ctx = { auth: WorkshopAuth | null }

export function ManagerWorkerDetailPage() {
  const { workerId } = useParams<{ workerId: string }>()
  const { auth } = useOutletContext<Ctx>()
  const pin = auth?.role === 'manager' ? auth.pin : ''

  const [detail, setDetail] = useState<WorkerDetailResponse | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [showPin, setShowPin] = useState(false)

  const refresh = useCallback(async () => {
    if (!pin || !workerId) return
    setDetail(await fetchWorkerDetail(pin, workerId))
  }, [pin, workerId])

  useEffect(() => {
    void refresh().catch((e) => setMsg(e instanceof Error ? e.message : 'Load failed'))
    const t = window.setInterval(() => void refresh().catch(() => {}), 4000)
    return () => window.clearInterval(t)
  }, [refresh])

  if (!auth || auth.role !== 'manager') return null
  if (!detail) {
    return (
      <main className="ws-detail">
        <BackLink to="/workers/manage?tab=workers" label="Workers" />
        <p className="ws-muted">Loading worker…</p>
      </main>
    )
  }

  const { worker, activeJobs, completedJobs, events } = detail

  return (
    <main className="ws-detail">
      <header className="ws-detail-head ws-detail-head--sticky">
        <BackLink to="/workers/manage?tab=workers" label="Workers" />
        <div className="ws-detail-head__title">
          <h2>
            {worker.code} · {worker.name}
          </h2>
          <p className="ws-muted">{worker.role.replace(/_/g, ' ')} · {worker.bay}</p>
        </div>
      </header>

      {msg && <p className="ws-banner">{msg}</p>}

      <section className="ws-panel ws-profile">
        <dl className="ws-meta">
          <div>
            <dt>Code</dt>
            <dd>{worker.code}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{worker.role.replace(/_/g, ' ')}</dd>
          </div>
          <div>
            <dt>Bay</dt>
            <dd>{worker.bay || '—'}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{worker.phone || '—'}</dd>
          </div>
          <div>
            <dt>PIN</dt>
            <dd>
              <button type="button" className="ws__ghost" onClick={() => setShowPin((v) => !v)}>
                {showPin ? worker.pin : '••••'}
              </button>
            </dd>
          </div>
        </dl>
      </section>

      <section className="ws-panel">
        <h3>Active jobs ({activeJobs.length})</h3>
        {activeJobs.length === 0 ? (
          <p className="ws-muted">No active assignments.</p>
        ) : (
          <ul className="ws-jobs ws-jobs--compact">
            {activeJobs.map((j) => (
              <li key={`${j.order.id}-${j.stage.stageId}`}>
                <Link to={`/workers/manage/orders/${j.order.id}`} className="ws-job-link">
                  <div className="ws-job-link__head">
                    <strong>{j.order.orderNo}</strong>
                    <PriorityBadge priority={j.order.priority} />
                    <StatusPill status={j.stage.status} />
                  </div>
                  <p>{j.order.productLabel}</p>
                  <p className="ws-muted">
                    {stageLabel(j.stage.stageId)} · {j.stage.statement || 'No statement yet'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ws-panel">
        <h3>Completed history</h3>
        {completedJobs.length === 0 ? (
          <p className="ws-muted">No completed stages yet.</p>
        ) : (
          <ul className="ws-jobs ws-jobs--compact">
            {completedJobs.map((j) => (
              <li key={`${j.order.id}-${j.stage.stageId}-done`}>
                <Link to={`/workers/manage/orders/${j.order.id}`} className="ws-job-link">
                  <strong>{j.order.orderNo}</strong>
                  <p className="ws-muted">
                    {stageLabel(j.stage.stageId)} ·{' '}
                    {j.completedAt
                      ? new Date(j.completedAt).toLocaleString()
                      : j.stage.completedAt
                        ? new Date(j.stage.completedAt).toLocaleString()
                        : '—'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ws-panel">
        <h3>Personal activity</h3>
        <EventTimeline events={events} />
      </section>
    </main>
  )
}
