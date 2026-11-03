import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import {
  BackLink,
  EventTimeline,
  OrderMetaGrid,
  PriorityBadge,
  ProgressBar,
  StagePipeline,
  StageUpdateHistory,
  StatusPill,
} from '../components/workshop/WorkshopUi'
import {
  formatDuration,
  stageLabel,
  type WorkStageId,
} from '../lib/workshopTypes'
import {
  assignWorkshopStage,
  closeWorkshopOrder,
  fetchOrderDetail,
  unassignWorkshopStage,
  type OrderDetailResponse,
  type WorkshopAuth,
} from '../lib/workshopClient'
import './WorkersApp.css'

type Ctx = { auth: WorkshopAuth | null }

export function ManagerOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { auth } = useOutletContext<Ctx>()
  const navigate = useNavigate()
  const pin = auth?.role === 'manager' ? auth.pin : ''

  const [detail, setDetail] = useState<OrderDetailResponse | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [assignWorker, setAssignWorker] = useState<Record<string, string>>({})
  const [assignNote, setAssignNote] = useState<Record<string, string>>({})

  const refresh = useCallback(async () => {
    if (!pin || !orderId) return
    const data = await fetchOrderDetail(pin, orderId)
    setDetail(data)
  }, [pin, orderId])

  useEffect(() => {
    void refresh().catch((e) => setMsg(e instanceof Error ? e.message : 'Load failed'))
    const t = window.setInterval(() => void refresh().catch(() => {}), 4000)
    return () => window.clearInterval(t)
  }, [refresh])

  const workerName = useMemo(() => {
    const m = new Map((detail?.workers ?? []).map((w) => [w.id, w.name]))
    return (id: string | null) => (id ? m.get(id) || id : '—')
  }, [detail?.workers])

  async function onAssign(stageId: WorkStageId) {
    if (!pin || !orderId) return
    const workerId = assignWorker[stageId]
    if (!workerId) return
    setBusy(true)
    setMsg(null)
    try {
      await assignWorkshopStage(pin, {
        orderId,
        stageId,
        workerId,
        managerNote: assignNote[stageId] || undefined,
      })
      setAssignNote((n) => ({ ...n, [stageId]: '' }))
      setMsg(`${stageLabel(stageId)} assigned`)
      await refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Assign failed')
    } finally {
      setBusy(false)
    }
  }

  async function onUnassign(stageId: WorkStageId) {
    if (!pin || !orderId) return
    setBusy(true)
    try {
      await unassignWorkshopStage(pin, { orderId, stageId })
      await refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Unassign failed')
    } finally {
      setBusy(false)
    }
  }

  async function onClose() {
    if (!pin || !orderId || !detail) return
    if (!window.confirm(`Close order ${detail.order.orderNo}? Workers can no longer update it.`)) return
    setBusy(true)
    try {
      await closeWorkshopOrder(pin, orderId)
      setMsg('Order closed')
      await refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Close failed')
    } finally {
      setBusy(false)
    }
  }

  if (!auth || auth.role !== 'manager') return null
  if (!detail) {
    return (
      <main className="ws-detail">
        <BackLink to="/workers/manage?tab=orders" label="Orders" />
        <p className="ws-muted">Loading order…</p>
      </main>
    )
  }

  const { order, events, progress } = detail
  const isClosed = order.status === 'closed'

  return (
    <main className="ws-detail">
      <header className="ws-detail-head ws-detail-head--sticky">
        <BackLink to="/workers/manage?tab=orders" label="Orders" />
        <div className="ws-detail-head__title">
          <h2>{order.orderNo}</h2>
          <div className="ws-detail-head__badges">
            <PriorityBadge priority={order.priority} />
            <StatusPill status={order.status} />
          </div>
        </div>
        {!isClosed && (
          <button type="button" className="ws__secondary" disabled={busy} onClick={() => void onClose()}>
            Close order
          </button>
        )}
        <Link
          to={`/workers/manage/orders/${order.id}/labels`}
          className="ws__primary"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
        >
          Print barcodes
        </Link>
      </header>

      {msg && <p className="ws-banner">{msg}</p>}

      <section className="ws-panel">
        <ProgressBar percent={progress.percent} />
        <OrderMetaGrid order={order} />
      </section>

      {(order.designCode || (order.designFiles?.length || 0) > 0) && (
        <section className="ws-panel">
          <h3>Design reference</h3>
          {order.designCode ? (
            <p>
              <span className="ws-muted">Design code · </span>
              <strong>{order.designCode}</strong>
            </p>
          ) : null}
          {(order.designFiles?.length || 0) > 0 && (
            <>
              <p className="ws-muted">Optional site photos / CAD for designing.</p>
              <ul className="ws-design-files__list">
                {order.designFiles.map((f) => (
                  <li key={f.id} className="ws-design-files__item">
                    {f.mimeType.startsWith('image/') ? (
                      <a href={f.dataUrl} target="_blank" rel="noreferrer">
                        <img src={f.dataUrl} alt={f.name} className="ws-design-files__thumb" />
                      </a>
                    ) : (
                      <a className="ws-design-files__badge" href={f.dataUrl} download={f.name}>
                        FILE
                      </a>
                    )}
                    <span className="ws-design-files__name">{f.name}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <section className="ws-panel">
        <h3>Worker start photos</h3>
        <div className="ws-start-photo-grid">
          {order.stages.filter((s) => s.startPhoto).length === 0 && (
            <p className="ws-muted">No start photos yet — workers must snap one before starting.</p>
          )}
          {order.stages
            .filter((s) => s.startPhoto)
            .map((s) => (
              <figure key={s.stageId} className="ws-start-photo-card">
                <img src={s.startPhoto!.dataUrl} alt={`${stageLabel(s.stageId)} start`} />
                <figcaption>
                  {stageLabel(s.stageId)}
                  {s.startPhoto?.uploadedBy ? ` · ${workerName(s.startPhoto.uploadedBy)}` : ''}
                </figcaption>
              </figure>
            ))}
        </div>
      </section>

      <section className="ws-panel">
        <h3>Stage pipeline</h3>
        <StagePipeline order={order} workerName={workerName} />
      </section>

      <section className="ws-panel">
        <h3>Stage management</h3>
        <div className="ws-stage-mgmt">
          {order.stages.map((stage) => (
            <article key={stage.stageId} className={`ws-stage-mgmt__row is-${stage.status}`}>
              <div className="ws-stage-mgmt__info">
                <strong>{stageLabel(stage.stageId)}</strong>
                <StatusPill status={stage.status} />
                <p>{workerName(stage.workerId)}</p>
                {stage.startedAt && (
                  <p className="ws-muted">
                    {formatDuration(stage.startedAt, stage.completedAt)} elapsed
                  </p>
                )}
              </div>

              {!isClosed && stage.status !== 'done' && (
                <div className="ws-stage-mgmt__actions">
                  <select
                    value={assignWorker[stage.stageId] ?? stage.workerId ?? ''}
                    onChange={(e) =>
                      setAssignWorker((a) => ({ ...a, [stage.stageId]: e.target.value }))
                    }
                  >
                    <option value="">Select worker…</option>
                    {detail.workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} · {w.name}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Manager note"
                    value={assignNote[stage.stageId] ?? ''}
                    onChange={(e) =>
                      setAssignNote((n) => ({ ...n, [stage.stageId]: e.target.value }))
                    }
                  />
                  <div className="ws-stage-mgmt__btns">
                    <button
                      type="button"
                      className="ws__primary"
                      disabled={busy || !assignWorker[stage.stageId]}
                      onClick={() => void onAssign(stage.stageId)}
                    >
                      Assign
                    </button>
                    {stage.workerId && (
                      <button
                        type="button"
                        className="ws__ghost"
                        disabled={busy}
                        onClick={() => void onUnassign(stage.stageId)}
                      >
                        Unassign
                      </button>
                    )}
                  </div>
                </div>
              )}

              {stage.updates.length > 0 && (
                <details className="ws-stage-mgmt__history">
                  <summary>Update history ({stage.updates.length})</summary>
                  <StageUpdateHistory stage={stage} />
                </details>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="ws-panel">
        <h3>Order timeline</h3>
        <EventTimeline events={events} />
      </section>

      <button type="button" className="ws__ghost ws-detail__back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>
    </main>
  )
}
