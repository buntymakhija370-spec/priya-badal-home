import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  WORK_STAGES,
  stageLabel,
  type WorkStageId,
  type WorkshopOrder,
  type Worker,
  type StatusEvent,
  type OrderStage,
} from '../lib/workshopTypes'
import {
  assignWorkshopStage,
  closeWorkshopOrder,
  createWorkshopOrder,
  fetchBoard,
  fetchWorkers,
  resetWorkshop,
  unassignWorkshopStage,
  type WorkshopAuth,
} from '../lib/workshopClient'
import './WorkersApp.css'

type Ctx = { auth: WorkshopAuth | null }

export function ManagerDashboardPage() {
  const { auth } = useOutletContext<Ctx>()
  const pin = auth?.role === 'manager' ? auth.pin : ''

  const [orders, setOrders] = useState<WorkshopOrder[]>([])
  const [workingNow, setWorkingNow] = useState<
    { worker: Worker; jobs: { order: WorkshopOrder; stage: OrderStage }[] }[]
  >([])
  const [idleCount, setIdleCount] = useState(0)
  const [events, setEvents] = useState<StatusEvent[]>([])
  const [workers, setWorkers] = useState<Omit<Worker, 'pin'>[]>([])
  const [showPins, setShowPins] = useState(false)
  const [pinMap, setPinMap] = useState<Record<string, string>>({})
  const [updatedAt, setUpdatedAt] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [orderNo, setOrderNo] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [productLabel, setProductLabel] = useState('')
  const [notes, setNotes] = useState('')

  const [assignOrderId, setAssignOrderId] = useState('')
  const [assignStageId, setAssignStageId] = useState<WorkStageId>('cutting')
  const [assignWorkerId, setAssignWorkerId] = useState('')

  const refresh = useCallback(async () => {
    if (!pin) return
    const [board, roster] = await Promise.all([fetchBoard(pin), fetchWorkers(pin)])
    setOrders(board.orders)
    setWorkingNow(board.workingNow)
    setIdleCount(board.idleCount)
    setEvents(board.events)
    setUpdatedAt(board.updatedAt)
    setWorkers(roster.workers)
    setAssignOrderId((prev) => prev || board.orders[0]?.id || '')
    setAssignWorkerId((prev) => prev || roster.workers[0]?.id || '')
  }, [pin])

  useEffect(() => {
    void refresh().catch((e) => setMsg(e instanceof Error ? e.message : 'Load failed'))
    const t = window.setInterval(() => {
      void refresh().catch(() => {})
    }, 3500)
    return () => window.clearInterval(t)
  }, [refresh])

  // Load pins once from snapshot for roster sheet (manager only, via full snapshot)
  useEffect(() => {
    if (!showPins || Object.keys(pinMap).length) return
    void fetch('/api/workshop/snapshot')
      .then((r) => r.json())
      .then((data: { workers?: Worker[] }) => {
        const map: Record<string, string> = {}
        for (const w of data.workers || []) map[w.id] = w.pin
        setPinMap(map)
      })
      .catch(() => {})
  }, [showPins, pinMap])

  const workerName = useMemo(() => {
    const m = new Map(workers.map((w) => [w.id, w]))
    return (id: string | null) => (id ? m.get(id)?.name || id : '—')
  }, [workers])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!pin) return
    setBusy(true)
    setMsg(null)
    try {
      await createWorkshopOrder(pin, { orderNo, customerName, productLabel, notes })
      setOrderNo('')
      setCustomerName('')
      setProductLabel('')
      setNotes('')
      setMsg('Order posted — assign stages to workers')
      await refresh()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not create order')
    } finally {
      setBusy(false)
    }
  }

  async function onAssign(e: FormEvent) {
    e.preventDefault()
    if (!pin) return
    setBusy(true)
    setMsg(null)
    try {
      await assignWorkshopStage(pin, {
        orderId: assignOrderId,
        stageId: assignStageId,
        workerId: assignWorkerId,
      })
      setMsg('Assignment sent to worker phone')
      await refresh()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Assign failed')
    } finally {
      setBusy(false)
    }
  }

  async function onClose(orderId: string) {
    if (!pin) return
    if (!window.confirm('Close this order? Workers can no longer update it.')) return
    setBusy(true)
    try {
      await closeWorkshopOrder(pin, orderId)
      setMsg('Order closed')
      await refresh()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Close failed')
    } finally {
      setBusy(false)
    }
  }

  async function onUnassign(orderId: string, stageId: WorkStageId) {
    if (!pin) return
    setBusy(true)
    try {
      await unassignWorkshopStage(pin, { orderId, stageId })
      await refresh()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Unassign failed')
    } finally {
      setBusy(false)
    }
  }

  async function onReset() {
    if (!pin) return
    if (!window.confirm('Reset demo floor data (60 workers + sample orders)?')) return
    setBusy(true)
    try {
      await resetWorkshop(pin)
      setPinMap({})
      setMsg('Demo floor reset')
      await refresh()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setBusy(false)
    }
  }

  if (!auth || auth.role !== 'manager') return null

  return (
    <main className="ws-mgr">
      <header className="ws-home__head">
        <div>
          <p className="ws-login__kicker">Live floor</p>
          <h2>Assign & track workmanship</h2>
          <p className="ws-muted">
            Post an order, assign each stage, watch worker status in real time, close when
            workmanship is done.
          </p>
        </div>
        <div className="ws-mgr__stats">
          <div>
            <strong>{orders.length}</strong>
            <span>open orders</span>
          </div>
          <div>
            <strong>{workingNow.length}</strong>
            <span>workers busy</span>
          </div>
          <div>
            <strong>{idleCount}</strong>
            <span>idle</span>
          </div>
          <p className="ws-live">
            <span className="ws-live__dot" /> {updatedAt ? new Date(updatedAt).toLocaleTimeString() : '…'}
          </p>
        </div>
      </header>

      {msg && <p className="ws-banner">{msg}</p>}

      <div className="ws-mgr__grid">
        <section className="ws-panel">
          <h3>New order</h3>
          <form className="ws-form" onSubmit={onCreate}>
            <label>
              Order no.
              <input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="PBH-2410" required />
            </label>
            <label>
              Customer
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Sharma Residence"
                required
              />
            </label>
            <label>
              Product / job
              <input
                value={productLabel}
                onChange={(e) => setProductLabel(e.target.value)}
                placeholder="Kitchen shutters — oak matt"
                required
              />
            </label>
            <label>
              Notes
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </label>
            <button type="submit" className="ws__primary" disabled={busy}>
              Post order
            </button>
          </form>
        </section>

        <section className="ws-panel">
          <h3>Assign stage</h3>
          <form className="ws-form" onSubmit={onAssign}>
            <label>
              Order
              <select value={assignOrderId} onChange={(e) => setAssignOrderId(e.target.value)} required>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNo} — {o.productLabel}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Stage
              <select
                value={assignStageId}
                onChange={(e) => setAssignStageId(e.target.value as WorkStageId)}
              >
                {WORK_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Worker
              <select value={assignWorkerId} onChange={(e) => setAssignWorkerId(e.target.value)} required>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} · {w.name} ({w.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="ws__primary" disabled={busy || !orders.length}>
              Send to worker app
            </button>
          </form>
        </section>

        <section className="ws-panel ws-panel--wide">
          <h3>Working now</h3>
          {workingNow.length === 0 ? (
            <p className="ws-muted">No workers in progress — assign a stage or wait for starts.</p>
          ) : (
            <ul className="ws-live-list">
              {workingNow.map(({ worker, jobs }) => (
                <li key={worker.id}>
                  <strong>
                    {worker.code} {worker.name}
                  </strong>
                  {jobs.map((j) => (
                    <span key={`${j.order.id}-${j.stage.stageId}`}>
                      {j.order.orderNo} · {stageLabel(j.stage.stageId)} ·{' '}
                      <em>{j.stage.statement || j.stage.status}</em>
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="ws-panel">
        <div className="ws-panel__row">
          <h3>Open orders</h3>
          <button type="button" className="ws__ghost" onClick={() => void onReset()} disabled={busy}>
            Reset demo data
          </button>
        </div>
        <div className="ws-orders">
          {orders.map((order) => (
            <article key={order.id} className="ws-order">
              <header>
                <div>
                  <h4>{order.orderNo}</h4>
                  <p>
                    {order.productLabel} · {order.customerName}
                  </p>
                </div>
                <button
                  type="button"
                  className="ws__secondary"
                  disabled={busy}
                  onClick={() => void onClose(order.id)}
                >
                  Close order
                </button>
              </header>
              <ol className="ws-stages">
                {order.stages.map((stage) => (
                  <li key={stage.stageId} className={`is-${stage.status}`}>
                    <div>
                      <strong>{stageLabel(stage.stageId)}</strong>
                      <span className={`ws-pill ws-pill--${stage.status}`}>
                        {stage.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p>{workerName(stage.workerId)}</p>
                    {stage.statement && <p className="ws-order__stmt">{stage.statement}</p>}
                    {stage.workerId && stage.status !== 'done' && (
                      <button
                        type="button"
                        className="ws__ghost ws__ghost--sm"
                        onClick={() => void onUnassign(order.id, stage.stageId)}
                      >
                        Unassign
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            </article>
          ))}
          {orders.length === 0 && <p className="ws-muted">No open orders.</p>}
        </div>
      </section>

      <section className="ws-panel">
        <h3>Accountability feed</h3>
        <ul className="ws-feed">
          {events.map((ev) => (
            <li key={ev.id}>
              <time>{new Date(ev.at).toLocaleString()}</time>
              <span>{ev.message}</span>
            </li>
          ))}
          {events.length === 0 && <li className="ws-muted">No events yet.</li>}
        </ul>
      </section>

      <section className="ws-panel">
        <div className="ws-panel__row">
          <h3>Worker roster (60)</h3>
          <button type="button" className="ws__ghost" onClick={() => setShowPins((v) => !v)}>
            {showPins ? 'Hide PINs' : 'Show login PINs'}
          </button>
        </div>
        <div className="ws-roster">
          {workers.map((w) => (
            <div key={w.id} className="ws-roster__row">
              <span>{w.code}</span>
              <span>{w.name}</span>
              <span>{w.role.replace('_', ' ')}</span>
              {showPins && <code>{pinMap[w.id] || '…'}</code>}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
