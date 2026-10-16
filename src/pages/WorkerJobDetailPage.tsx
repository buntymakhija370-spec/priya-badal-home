import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import {
  BackLink,
  OrderMetaGrid,
  StageUpdateHistory,
  StatusPill,
} from '../components/workshop/WorkshopUi'
import { stageLabel, type WorkStageId } from '../lib/workshopTypes'
import {
  fetchJobDetail,
  postWorkerAction,
  type JobDetailResponse,
  type WorkshopAuth,
} from '../lib/workshopClient'
import './WorkersApp.css'

type Ctx = { auth: WorkshopAuth | null }

export function WorkerJobDetailPage() {
  const { orderId, stageId } = useParams<{ orderId: string; stageId: string }>()
  const { auth } = useOutletContext<Ctx>()
  const navigate = useNavigate()
  const workerId = auth?.role === 'worker' ? auth.workerId : ''

  const [detail, setDetail] = useState<JobDetailResponse | null>(null)
  const [statement, setStatement] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    if (!orderId || !stageId) return
    const data = await fetchJobDetail(orderId, stageId as WorkStageId, workerId || undefined)
    setDetail(data)
  }, [orderId, stageId, workerId])

  useEffect(() => {
    void refresh().catch((e) => setMsg(e instanceof Error ? e.message : 'Load failed'))
    const t = window.setInterval(() => void refresh().catch(() => {}), 4000)
    return () => window.clearInterval(t)
  }, [refresh])

  useEffect(() => {
    if (detail?.stage.statement && !statement) {
      setStatement(detail.stage.statement)
    }
  }, [detail?.stage.statement, statement])

  async function act(action: 'start' | 'statement' | 'complete') {
    if (!workerId || !orderId || !stageId || !detail) return
    setBusy(true)
    setMsg(null)
    try {
      await postWorkerAction({
        workerId,
        orderId,
        stageId: stageId as WorkStageId,
        action,
        statement: action !== 'start' ? statement : undefined,
      })
      await refresh()
      setMsg(
        action === 'complete'
          ? `${stageLabel(detail.stage.stageId)} marked done`
          : 'Status saved — manager can see this live',
      )
      if (action === 'complete') {
        setTimeout(() => navigate('/workers/home'), 1200)
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  if (!auth || auth.role !== 'worker') return null
  if (!detail) {
    return (
      <main className="ws-detail">
        <BackLink to="/workers/home" label="My jobs" />
        <p className="ws-muted">Loading job…</p>
      </main>
    )
  }

  const { order, stage } = detail
  const status = stage.status
  const canAct = stage.workerId === workerId || !stage.workerId

  return (
    <main className="ws-detail">
      <header className="ws-detail-head ws-detail-head--sticky">
        <BackLink to="/workers/home" label="My jobs" />
        <div className="ws-detail-head__title">
          <h2>{order.orderNo}</h2>
          <p className="ws-muted">{stageLabel(stage.stageId)}</p>
          <StatusPill status={status} />
        </div>
      </header>

      {msg && <p className="ws-banner">{msg}</p>}

      <section className="ws-panel">
        <h3>Order details</h3>
        <OrderMetaGrid order={order} />
      </section>

      {stage.managerNote && (
        <section className="ws-panel ws-panel--note">
          <h3>Manager note</h3>
          <p>{stage.managerNote}</p>
        </section>
      )}

      {canAct && status !== 'done' && (
        <section className="ws-panel ws-panel--actions">
          <h3>Your stage</h3>
          <label className="ws-job__statement">
            Status statement
            <textarea
              rows={3}
              value={statement}
              placeholder="e.g. Pasting laminate on left shutters — bay 3"
              onChange={(e) => setStatement(e.target.value)}
            />
          </label>
          <div className="ws-job__actions">
            {status === 'assigned' && (
              <button
                type="button"
                className="ws__primary"
                disabled={busy}
                onClick={() => void act('start')}
              >
                Start work
              </button>
            )}
            {(status === 'assigned' || status === 'in_progress') && (
              <button
                type="button"
                className="ws__secondary"
                disabled={busy}
                onClick={() => void act('statement')}
              >
                Post status
              </button>
            )}
            {status === 'in_progress' && (
              <button
                type="button"
                className="ws__done"
                disabled={busy}
                onClick={() => void act('complete')}
              >
                Stage complete
              </button>
            )}
          </div>
        </section>
      )}

      <section className="ws-panel">
        <h3>Your updates</h3>
        <StageUpdateHistory stage={stage} />
      </section>
    </main>
  )
}
