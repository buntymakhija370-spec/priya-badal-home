import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import {
  LiveClock,
  PriorityBadge,
  ProgressBar,
  StageDots,
  StatusPill,
} from '../components/workshop/WorkshopUi'
import { orderProgress, stageLabel } from '../lib/workshopTypes'
import { fetchWorkerJobs, type WorkshopAuth } from '../lib/workshopClient'
import './WorkersApp.css'

type Ctx = { auth: WorkshopAuth | null }

export function WorkerHomePage() {
  const { auth } = useOutletContext<Ctx>()
  const workerId = auth?.role === 'worker' ? auth.workerId : ''

  const [jobs, setJobs] = useState<Awaited<ReturnType<typeof fetchWorkerJobs>> | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

  const refresh = useCallback(async () => {
    if (!workerId) return
    setJobs(await fetchWorkerJobs(workerId))
  }, [workerId])

  useEffect(() => {
    void refresh().catch((e) => setMsg(e instanceof Error ? e.message : 'Could not load jobs'))
    const t = window.setInterval(() => void refresh().catch(() => {}), 4000)
    return () => window.clearInterval(t)
  }, [refresh])

  const completedToday = useMemo(() => {
    if (!jobs?.completedJobs) return 0
    const today = new Date().toDateString()
    return jobs.completedJobs.filter((j) => {
      const at = j.completedAt || j.stage.completedAt
      return at && new Date(at).toDateString() === today
    }).length
  }, [jobs?.completedJobs])

  if (!auth || auth.role !== 'worker') return null

  const activeJobs = jobs?.jobs ?? []
  const completedJobs = jobs?.completedJobs ?? []

  return (
    <main className="ws-home">
      <header className="ws-home__head">
        <div>
          <p className="ws-login__kicker">{auth.code} · {auth.workerRole.replace(/_/g, ' ')}</p>
          <h2>Hello, {auth.name.split(' ')[0]}</h2>
          <p className="ws-muted">
            {jobs?.worker.bay ? `${jobs.worker.bay} · ` : ''}
            Tap a job for full details and actions
          </p>
        </div>
        <div className="ws-home__clock">
          <LiveClock />
          <p className="ws-live">
            <span className="ws-live__dot" />
            {jobs?.updatedAt ? new Date(jobs.updatedAt).toLocaleTimeString() : 'Live'}
          </p>
        </div>
      </header>

      <div className="ws-chips">
        <span className="ws-chip ws-chip--active">{activeJobs.length} active</span>
        <span className="ws-chip">{completedToday} done today</span>
      </div>

      {msg && <p className="ws-banner">{msg}</p>}

      {activeJobs.length === 0 ? (
        <div className="ws-empty">
          <h3>No open jobs</h3>
          <p>When the manager assigns you a stage, it will appear here automatically.</p>
        </div>
      ) : (
        <ul className="ws-jobs">
          {activeJobs.map((job) => {
            const { percent } = orderProgress(job.order)
            const draftKey = `${job.order.id}:${job.stage.stageId}`
            return (
              <li key={draftKey}>
                <Link
                  to={`/workers/home/job/${job.order.id}/${job.stage.stageId}`}
                  className="ws-job ws-job--tappable"
                >
                  <div className="ws-job__meta">
                    <PriorityBadge priority={job.order.priority} />
                    <StatusPill status={job.stage.status} />
                    <span className="ws-job__stage">{stageLabel(job.stage.stageId)}</span>
                  </div>
                  <h3>{job.order.orderNo}</h3>
                  <p className="ws-job__product">{job.order.productLabel}</p>
                  <p className="ws-muted">{job.order.customerName}</p>
                  {job.stage.statement && (
                    <p className="ws-job__last">
                      Last: <em>{job.stage.statement}</em>
                    </p>
                  )}
                  <ProgressBar percent={percent} size="sm" />
                  <StageDots order={job.order} />
                  <span className="ws-job__tap-hint">Tap for details →</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {completedJobs.length > 0 && (
        <section className="ws-panel ws-panel--collapse">
          <button
            type="button"
            className="ws-collapse__toggle"
            onClick={() => setShowCompleted((v) => !v)}
            aria-expanded={showCompleted}
          >
            <h3>Completed jobs ({completedJobs.length})</h3>
            <span>{showCompleted ? '−' : '+'}</span>
          </button>
          {showCompleted && (
            <ul className="ws-jobs ws-jobs--compact">
              {completedJobs.map((job) => (
                <li key={`${job.order.id}-${job.stage.stageId}-c`}>
                  <Link
                    to={`/workers/home/job/${job.order.id}/${job.stage.stageId}`}
                    className="ws-job-link"
                  >
                    <strong>{job.order.orderNo}</strong>
                    <span className="ws-muted">{stageLabel(job.stage.stageId)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  )
}
