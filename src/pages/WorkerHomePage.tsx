import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { stageLabel, type OrderStage, type WorkshopOrder } from '../lib/workshopTypes'
import {
  fetchWorkerJobs,
  postWorkerAction,
  type WorkshopAuth,
} from '../lib/workshopClient'
import './WorkersApp.css'

type Ctx = { auth: WorkshopAuth | null }

type Job = { order: WorkshopOrder; stage: OrderStage }

export function WorkerHomePage() {
  const { auth } = useOutletContext<Ctx>()
  const [jobs, setJobs] = useState<Job[]>([])
  const [updatedAt, setUpdatedAt] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const workerId = auth?.role === 'worker' ? auth.workerId : ''

  const refresh = useCallback(async () => {
    if (!workerId) return
    const data = await fetchWorkerJobs(workerId)
    setJobs(data.jobs)
    setUpdatedAt(data.updatedAt)
  }, [workerId])

  useEffect(() => {
    void refresh().catch((e) => setMsg(e instanceof Error ? e.message : 'Could not load jobs'))
    const t = window.setInterval(() => {
      void refresh().catch(() => {})
    }, 4000)
    return () => window.clearInterval(t)
  }, [refresh])

  async function act(job: Job, action: 'start' | 'statement' | 'complete') {
    if (!workerId) return
    const key = `${job.order.id}:${job.stage.stageId}:${action}`
    setBusyKey(key)
    setMsg(null)
    try {
      const statement = drafts[`${job.order.id}:${job.stage.stageId}`]
      await postWorkerAction({
        workerId,
        orderId: job.order.id,
        stageId: job.stage.stageId,
        action,
        statement,
      })
      await refresh()
      setMsg(
        action === 'complete'
          ? `${stageLabel(job.stage.stageId)} marked done on ${job.order.orderNo}`
          : 'Status saved — manager can see this live',
      )
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setBusyKey(null)
    }
  }

  if (!auth || auth.role !== 'worker') return null

  return (
    <main className="ws-home">
      <header className="ws-home__head">
        <div>
          <p className="ws-login__kicker">My assignments</p>
          <h2>Hello, {auth.name.split(' ')[0]}</h2>
          <p className="ws-muted">
            Post what you are doing. When your stage is finished, mark it complete so the order
            stays accountable.
          </p>
        </div>
        <p className="ws-live">
          <span className="ws-live__dot" /> Live
          {updatedAt ? ` · ${new Date(updatedAt).toLocaleTimeString()}` : ''}
        </p>
      </header>

      {msg && <p className="ws-banner">{msg}</p>}

      {jobs.length === 0 ? (
        <div className="ws-empty">
          <h3>No open jobs</h3>
          <p>When the manager assigns you a stage, it will appear here automatically.</p>
        </div>
      ) : (
        <ul className="ws-jobs">
          {jobs.map((job) => {
            const draftKey = `${job.order.id}:${job.stage.stageId}`
            const status = job.stage.status
            return (
              <li key={draftKey} className="ws-job">
                <div className="ws-job__meta">
                  <span className={`ws-pill ws-pill--${status}`}>{status.replace('_', ' ')}</span>
                  <span className="ws-job__stage">{stageLabel(job.stage.stageId)}</span>
                </div>
                <h3>{job.order.orderNo}</h3>
                <p className="ws-job__product">{job.order.productLabel}</p>
                <p className="ws-muted">{job.order.customerName}</p>
                {job.order.notes && <p className="ws-job__notes">{job.order.notes}</p>}
                {job.stage.statement && (
                  <p className="ws-job__last">
                    Last update: <em>{job.stage.statement}</em>
                  </p>
                )}

                <label className="ws-job__statement">
                  What are you doing now?
                  <textarea
                    rows={2}
                    value={drafts[draftKey] ?? ''}
                    placeholder="e.g. Pasting laminate on left shutters — bay 3"
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [draftKey]: e.target.value }))
                    }
                  />
                </label>

                <div className="ws-job__actions">
                  {status === 'assigned' && (
                    <button
                      type="button"
                      className="ws__primary"
                      disabled={busyKey !== null}
                      onClick={() => void act(job, 'start')}
                    >
                      Start work
                    </button>
                  )}
                  {(status === 'assigned' || status === 'in_progress') && (
                    <button
                      type="button"
                      className="ws__secondary"
                      disabled={busyKey !== null}
                      onClick={() => void act(job, 'statement')}
                    >
                      Post status
                    </button>
                  )}
                  {status === 'in_progress' && (
                    <button
                      type="button"
                      className="ws__done"
                      disabled={busyKey !== null}
                      onClick={() => void act(job, 'complete')}
                    >
                      Stage complete
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
