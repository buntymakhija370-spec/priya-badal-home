import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import {
  BackLink,
  OrderMetaGrid,
  StageUpdateHistory,
  StatusPill,
} from '../components/workshop/WorkshopUi'
import { stageLabel, type WorkStageId } from '../lib/workshopTypes'
import { cameraFileToJpeg } from '../lib/workshopMedia'
import {
  fetchJobDetail,
  postWorkerAction,
  type JobDetailResponse,
  type WorkshopAuth,
} from '../lib/workshopClient'
import './WorkersApp.css'

type Ctx = { auth: WorkshopAuth | null }

type StartPhotoDraft = { name: string; mimeType: string; dataUrl: string }

export function WorkerJobDetailPage() {
  const { orderId, stageId } = useParams<{ orderId: string; stageId: string }>()
  const { auth } = useOutletContext<Ctx>()
  const navigate = useNavigate()
  const workerId = auth?.role === 'worker' ? auth.workerId : ''
  const cameraRef = useRef<HTMLInputElement | null>(null)

  const [detail, setDetail] = useState<JobDetailResponse | null>(null)
  const [statement, setStatement] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [startPhoto, setStartPhoto] = useState<StartPhotoDraft | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)

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

  async function onCameraPicked(file: File | null) {
    if (!file) return
    setPhotoBusy(true)
    setMsg(null)
    try {
      const payload = await cameraFileToJpeg(file)
      setStartPhoto(payload)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not read photo')
    } finally {
      setPhotoBusy(false)
    }
  }

  async function act(action: 'start' | 'statement' | 'complete') {
    if (!workerId || !orderId || !stageId || !detail) return
    if (action === 'start' && !startPhoto) {
      setMsg('Take a start photo first — then tap Start work')
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      await postWorkerAction({
        workerId,
        orderId,
        stageId: stageId as WorkStageId,
        action,
        statement: action !== 'start' ? statement : undefined,
        startPhoto: action === 'start' && startPhoto ? startPhoto : undefined,
      })
      await refresh()
      setMsg(
        action === 'complete'
          ? `${stageLabel(detail.stage.stageId)} marked done`
          : action === 'start'
            ? 'Start photo saved — work started. Manager can see this live.'
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
  const isDesigner = stage.stageId === 'designing'
  const showDesignRef =
    isDesigner && (!!order.designCode || (order.designFiles?.length || 0) > 0)

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

      {showDesignRef && (
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
              <p className="ws-muted">Photos / CAD for this design job only.</p>
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

      {stage.managerNote && (
        <section className="ws-panel ws-panel--note">
          <h3>Manager note</h3>
          <p>{stage.managerNote}</p>
        </section>
      )}

      {canAct && status === 'assigned' && (
        <section className="ws-panel ws-panel--actions">
          <h3>Start photo (required)</h3>
          <p className="ws-muted">
            Click a picture of the sheet / panel / bay before you start. Saved with your worker ID (
            {auth.code}).
          </p>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="ws-file-hidden"
            onChange={(e) => {
              void onCameraPicked(e.target.files?.[0] || null)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            className="ws__secondary"
            disabled={photoBusy || busy}
            onClick={() => cameraRef.current?.click()}
          >
            {photoBusy ? 'Saving photo…' : startPhoto ? 'Retake start photo' : 'Take start photo'}
          </button>
          {startPhoto && (
            <img src={startPhoto.dataUrl} alt="Start photo preview" className="ws-start-photo" />
          )}
          <button
            type="button"
            className="ws__primary"
            disabled={busy || !startPhoto}
            onClick={() => void act('start')}
          >
            Start work
          </button>
        </section>
      )}

      {canAct && status === 'in_progress' && (
        <section className="ws-panel ws-panel--actions">
          <h3>Your stage</h3>
          {stage.startPhoto && (
            <div className="ws-start-photo-saved">
              <p className="ws-muted">Start photo on file</p>
              <img
                src={stage.startPhoto.dataUrl}
                alt="Saved start photo"
                className="ws-start-photo"
              />
            </div>
          )}
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
            <button
              type="button"
              className="ws__secondary"
              disabled={busy}
              onClick={() => void act('statement')}
            >
              Post status
            </button>
            <button
              type="button"
              className="ws__done"
              disabled={busy}
              onClick={() => void act('complete')}
            >
              Stage complete
            </button>
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
