import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import {
  EventTimeline,
  KpiCard,
  PriorityBadge,
  ProgressBar,
  StageDots,
  StagePipelineBars,
  StatusPill,
} from '../components/workshop/WorkshopUi'
import {
  WORK_STAGES,
  orderProgress,
  stageLabel,
  type OrderPriority,
  type StatusEvent,
  type WorkStageId,
  type WorkshopOrder,
} from '../lib/workshopTypes'
import {
  assignWorkshopStage,
  createWorkshopOrder,
  fetchBoard,
  fetchWorkers,
  resetWorkshop,
  type BoardResponse,
  type WorkerRosterEntry,
  type WorkshopAuth,
} from '../lib/workshopClient'
import './WorkersApp.css'

type Ctx = { auth: WorkshopAuth | null }
type Tab = 'floor' | 'orders' | 'workers' | 'activity'

const TABS: { id: Tab; label: string }[] = [
  { id: 'floor', label: 'Floor' },
  { id: 'orders', label: 'Orders' },
  { id: 'workers', label: 'Workers' },
  { id: 'activity', label: 'Activity' },
]

export function ManagerDashboardPage() {
  const { auth } = useOutletContext<Ctx>()
  const pin = auth?.role === 'manager' ? auth.pin : ''
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'floor'

  const [board, setBoard] = useState<BoardResponse | null>(null)
  const [workers, setWorkers] = useState<WorkerRosterEntry[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [orderSearch, setOrderSearch] = useState('')
  const [orderFilter, setOrderFilter] = useState<'open' | 'closed' | 'all'>('open')
  const [priorityFilter, setPriorityFilter] = useState<OrderPriority | 'all'>('all')
  const [workerSearch, setWorkerSearch] = useState('')
  const [eventFilter, setEventFilter] = useState<StatusEvent['kind'] | 'all'>('all')

  const [orderNo, setOrderNo] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [productLabel, setProductLabel] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState<OrderPriority>('normal')
  const [quantity, setQuantity] = useState(1)
  const [material, setMaterial] = useState('')
  const [finish, setFinish] = useState('')
  const [bay, setBay] = useState('')
  const [dueDate, setDueDate] = useState('')

  const [assignOrderId, setAssignOrderId] = useState('')
  const [assignStageId, setAssignStageId] = useState<WorkStageId>('cutting')
  const [assignWorkerId, setAssignWorkerId] = useState('')
  const [managerNote, setManagerNote] = useState('')

  const refresh = useCallback(async () => {
    if (!pin) return
    const [b, roster] = await Promise.all([fetchBoard(pin), fetchWorkers(pin)])
    setBoard(b)
    setWorkers(roster.workers)
    setAssignOrderId((prev) => prev || b.orders[0]?.id || '')
    setAssignWorkerId((prev) => prev || roster.workers[0]?.id || '')
  }, [pin])

  useEffect(() => {
    void refresh().catch((e) => setMsg(e instanceof Error ? e.message : 'Load failed'))
    const t = window.setInterval(() => void refresh().catch(() => {}), 3500)
    return () => window.clearInterval(t)
  }, [refresh])

  const allOrders = useMemo(() => {
    if (!board) return []
    return [...board.orders, ...board.closedOrders]
  }, [board])

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase()
    return allOrders.filter((o) => {
      if (orderFilter === 'open' && o.status === 'closed') return false
      if (orderFilter === 'closed' && o.status !== 'closed') return false
      if (priorityFilter !== 'all' && o.priority !== priorityFilter) return false
      if (!q) return true
      return (
        o.orderNo.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.productLabel.toLowerCase().includes(q)
      )
    })
  }, [allOrders, orderFilter, orderSearch, priorityFilter])

  const filteredWorkers = useMemo(() => {
    const q = workerSearch.trim().toLowerCase()
    if (!q) return workers
    return workers.filter(
      (w) =>
        w.code.toLowerCase().includes(q) ||
        w.name.toLowerCase().includes(q) ||
        (w.bay || '').toLowerCase().includes(q) ||
        w.role.replace(/_/g, ' ').includes(q),
    )
  }, [workers, workerSearch])

  const assignOrder = useMemo(
    () => board?.orders.find((o) => o.id === assignOrderId) ?? null,
    [board, assignOrderId],
  )
  const assignStages = useMemo(
    () =>
      assignOrder
        ? assignOrder.stages.map((s) => s.stageId)
        : WORK_STAGES.map((s) => s.id),
    [assignOrder],
  )

  useEffect(() => {
    if (!assignStages.includes(assignStageId)) {
      setAssignStageId(assignStages[0] ?? 'designing')
    }
  }, [assignStages, assignStageId])

  function setTab(next: Tab) {
    setParams({ tab: next })
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!pin) return
    setBusy(true)
    setMsg(null)
    try {
      await createWorkshopOrder(pin, {
        orderNo,
        customerName,
        productLabel,
        notes,
        priority,
        quantity,
        material: material || undefined,
        finish: finish || undefined,
        bay: bay || undefined,
        dueDate: dueDate || null,
      })
      setOrderNo('')
      setCustomerName('')
      setProductLabel('')
      setNotes('')
      setMaterial('')
      setFinish('')
      setBay('')
      setDueDate('')
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
        managerNote: managerNote || undefined,
      })
      setManagerNote('')
      setMsg('Assignment sent to worker phone')
      await refresh()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Assign failed')
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
      setMsg('Demo floor reset')
      await refresh()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setBusy(false)
    }
  }

  if (!auth || auth.role !== 'manager') return null

  const totals = board?.totals
  const busyCount = board?.workingNow.length ?? 0

  return (
    <main className="ws-mgr">
      <header className="ws-detail-head">
        <div>
          <p className="ws-login__kicker">Live floor</p>
          <h2>Manager dashboard</h2>
          <p className="ws-live">
            <span className="ws-live__dot" />
            {board?.updatedAt
              ? `Updated ${new Date(board.updatedAt).toLocaleTimeString()}`
              : 'Connecting…'}
          </p>
        </div>
        <button type="button" className="ws__ghost" onClick={() => void onReset()} disabled={busy}>
          Reset demo
        </button>
      </header>

      <nav className="ws-tabs" aria-label="Manager sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'is-on' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {msg && <p className="ws-banner">{msg}</p>}

      {tab === 'floor' && board && (
        <div className="ws-tab-panel">
          <div className="ws-kpi-row">
            <KpiCard label="Open orders" value={totals?.open ?? 0} />
            <KpiCard label="Urgent / rush" value={totals?.urgent ?? 0} tone="urgent" />
            <KpiCard label="Workers busy" value={busyCount} tone="busy" />
            <KpiCard label="Idle" value={board.idleCount} tone="idle" />
            <KpiCard label="Avg progress" value={`${totals?.avgProgress ?? 0}%`} tone="ok" />
          </div>

          <section className="ws-panel">
            <h3>Stage pipeline</h3>
            <StagePipelineBars stats={board.stageStats} />
          </section>

          <section className="ws-panel">
            <h3>Working now</h3>
            {board.workingNow.length === 0 ? (
              <p className="ws-muted">No workers in progress — assign a stage or wait for starts.</p>
            ) : (
              <div className="ws-working-grid">
                {board.workingNow.map(({ worker, jobs }) => (
                  <Link
                    key={worker.id}
                    to={`/workers/manage/workers/${worker.id}`}
                    className="ws-working-card"
                  >
                    <div className="ws-working-card__head">
                      <strong>
                        {worker.code} · {worker.name}
                      </strong>
                      <span className="ws-muted">{worker.bay}</span>
                    </div>
                    {jobs.map((j) => (
                      <div key={`${j.order.id}-${j.stage.stageId}`} className="ws-working-card__job">
                        <span>{j.order.orderNo}</span>
                        <span>{stageLabel(j.stage.stageId)}</span>
                        <em>{j.stage.statement || j.stage.status.replace(/_/g, ' ')}</em>
                      </div>
                    ))}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="ws-panel">
            <h3>Recent activity</h3>
            <EventTimeline events={board.events} limit={8} />
          </section>

          <section className="ws-panel ws-quick-actions">
            <h3>Quick actions</h3>
            <div className="ws-quick-actions__grid">
              <form className="ws-form" onSubmit={onCreate}>
                <h4>New order</h4>
                <label>
                  Order no.
                  <input
                    value={orderNo}
                    onChange={(e) => setOrderNo(e.target.value)}
                    placeholder="PBH-2410"
                    required
                  />
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
                <div className="ws-form__row">
                  <label>
                    Priority
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as OrderPriority)}
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="rush">Rush</option>
                    </select>
                  </label>
                  <label>
                    Qty
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                    />
                  </label>
                </div>
                <div className="ws-form__row">
                  <label>
                    Material
                    <input value={material} onChange={(e) => setMaterial(e.target.value)} />
                  </label>
                  <label>
                    Finish
                    <input value={finish} onChange={(e) => setFinish(e.target.value)} />
                  </label>
                </div>
                <div className="ws-form__row">
                  <label>
                    Bay
                    <input value={bay} onChange={(e) => setBay(e.target.value)} />
                  </label>
                  <label>
                    Due date
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </label>
                </div>
                <label>
                  Notes
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                </label>
                <button type="submit" className="ws__primary" disabled={busy}>
                  Post order
                </button>
              </form>

              <form className="ws-form" onSubmit={onAssign}>
                <h4>Assign stage</h4>
                <label>
                  Order
                  <select
                    value={assignOrderId}
                    onChange={(e) => setAssignOrderId(e.target.value)}
                    required
                  >
                    {board.orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNo} — {o.productLabel}
                      </option>
                    ))}
                  </select>
                </label>
                {assignOrder && (
                  <p className="ws-muted">
                    Pipeline: {assignStages.map(stageLabel).join(' → ')}
                  </p>
                )}
                <label>
                  Stage
                  <select
                    value={assignStageId}
                    onChange={(e) => setAssignStageId(e.target.value as WorkStageId)}
                  >
                    {assignStages.map((id) => (
                      <option key={id} value={id}>
                        {stageLabel(id)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Worker
                  <select
                    value={assignWorkerId}
                    onChange={(e) => setAssignWorkerId(e.target.value)}
                    required
                  >
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} · {w.name} ({w.role.replace(/_/g, ' ')})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Manager note
                  <textarea
                    value={managerNote}
                    onChange={(e) => setManagerNote(e.target.value)}
                    rows={2}
                    placeholder="Instructions for this stage…"
                  />
                </label>
                <button type="submit" className="ws__primary" disabled={busy || !board.orders.length}>
                  Send to worker
                </button>
              </form>
            </div>
          </section>
        </div>
      )}

      {tab === 'orders' && (
        <div className="ws-tab-panel">
          <div className="ws-filters">
            <input
              type="search"
              placeholder="Search orders…"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="ws-search"
            />
            <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value as typeof orderFilter)}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="all">All</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
            >
              <option value="all">All priorities</option>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="rush">Rush</option>
            </select>
          </div>

          <div className="ws-order-list">
            {filteredOrders.map((order) => (
              <OrderListCard key={order.id} order={order} />
            ))}
            {filteredOrders.length === 0 && <p className="ws-muted">No orders match your filters.</p>}
          </div>
        </div>
      )}

      {tab === 'workers' && (
        <div className="ws-tab-panel">
          <div className="ws-filters">
            <input
              type="search"
              placeholder="Search workers…"
              value={workerSearch}
              onChange={(e) => setWorkerSearch(e.target.value)}
              className="ws-search"
            />
          </div>
          <p className="ws-muted ws-workers-hint">
            Tap a worker to open their profile, then use <strong>Customise worker information</strong>{' '}
            to edit name, role, bay, or phone.
          </p>

          <div className="ws-worker-list">
            {filteredWorkers.map((w) => (
              <Link key={w.id} to={`/workers/manage/workers/${w.id}`} className="ws-worker-card">
                <div className="ws-worker-card__main">
                  <strong>{w.code}</strong>
                  <span>{w.name}</span>
                </div>
                <div className="ws-worker-card__meta">
                  <span>{w.role.replace(/_/g, ' ')}</span>
                  <span>{w.bay || '—'}</span>
                  <span className={w.busy ? 'ws-worker-card__busy' : 'ws-worker-card__idle'}>
                    {w.busy ? `${w.activeJobCount} active` : 'Idle'}
                  </span>
                </div>
                <span className="ws-worker-card__edit">Customise →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {tab === 'activity' && board && (
        <div className="ws-tab-panel">
          <div className="ws-filters">
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value as typeof eventFilter)}
            >
              <option value="all">All events</option>
              <option value="assigned">Assigned</option>
              <option value="started">Started</option>
              <option value="statement">Statement</option>
              <option value="completed">Completed</option>
              <option value="unassigned">Unassigned</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <section className="ws-panel ws-panel--feed">
            <EventTimeline events={board.events} filterKind={eventFilter} />
          </section>
        </div>
      )}
    </main>
  )
}

function OrderListCard({ order }: { order: WorkshopOrder }) {
  const { percent } = orderProgress(order)
  return (
    <Link to={`/workers/manage/orders/${order.id}`} className="ws-order-card">
      <div className="ws-order-card__head">
        <div>
          <h4>{order.orderNo}</h4>
          <p className="ws-muted">
            {order.productLabel} · {order.customerName}
          </p>
        </div>
        <div className="ws-order-card__badges">
          <PriorityBadge priority={order.priority} />
          <StatusPill status={order.status} />
        </div>
      </div>
      <ProgressBar percent={percent} size="sm" />
      <StageDots order={order} />
      <div className="ws-order-card__foot">
        <span>{order.bay}</span>
        {order.dueDate && <span>Due {new Date(order.dueDate).toLocaleDateString()}</span>}
      </div>
    </Link>
  )
}
