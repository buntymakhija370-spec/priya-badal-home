import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import {
  EventTimeline,
  KpiCard,
  PriorityBadge,
  StagePipelineBars,
} from '../components/workshop/WorkshopUi'
import {
  fetchBoard,
  fetchMachines,
  type BoardResponse,
  type MachinesResponse,
  type WorkshopAuth,
} from '../lib/workshopClient'
import { stageLabel } from '../lib/workshopTypes'
import './WorkersApp.css'

type Ctx = { auth: WorkshopAuth | null }

export function ManagerOverviewPage() {
  const { auth } = useOutletContext<Ctx>()
  const pin = auth?.role === 'manager' ? auth.pin : ''
  const [board, setBoard] = useState<BoardResponse | null>(null)
  const [machines, setMachines] = useState<MachinesResponse | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!pin) return
    const [b, m] = await Promise.all([fetchBoard(pin), fetchMachines(pin)])
    setBoard(b)
    setMachines(m)
  }, [pin])

  useEffect(() => {
    void refresh().catch((e) => setMsg(e instanceof Error ? e.message : 'Load failed'))
    const t = window.setInterval(() => void refresh().catch(() => {}), 4000)
    return () => window.clearInterval(t)
  }, [refresh])

  const machineCounts = useMemo(() => {
    const counts = { idle: 0, running: 0, maintenance: 0, offline: 0 }
    for (const m of machines?.machines ?? []) counts[m.status]++
    return counts
  }, [machines?.machines])

  const urgentOrders = useMemo(
    () => (board?.orders ?? []).filter((o) => o.priority !== 'normal').slice(0, 6),
    [board?.orders],
  )

  if (!auth || auth.role !== 'manager') return null

  const totals = board?.totals

  return (
    <main className="ws-mgr ws-page">
      <header className="ws-detail-head">
        <div>
          <p className="ws-login__kicker">Dashboard</p>
          <h2>Track everything</h2>
          <p className="ws-live">
            <span className="ws-live__dot" />
            {board?.updatedAt
              ? `Updated ${new Date(board.updatedAt).toLocaleTimeString()}`
              : 'Connecting…'}
          </p>
        </div>
        <Link to="/workers/manage?tab=floor" className="ws__secondary">
          Live floor
        </Link>
      </header>

      {msg && <p className="ws-banner">{msg}</p>}

      <div className="ws-kpi-row">
        <KpiCard label="Open orders" value={totals?.open ?? 0} />
        <KpiCard label="Urgent / rush" value={totals?.urgent ?? 0} tone="urgent" />
        <KpiCard label="Workers busy" value={board?.workingNow.length ?? 0} tone="busy" />
        <KpiCard label="Machines running" value={machineCounts.running} tone="ok" />
        <KpiCard label="Avg progress" value={`${totals?.avgProgress ?? 0}%`} tone="idle" />
      </div>

      <div className="ws-overview-grid">
        <section className="ws-panel">
          <div className="ws-panel__row">
            <h3>Process summary</h3>
            <Link to="/workers/manage/process" className="ws__ghost ws__ghost--sm">View board →</Link>
          </div>
          {board && <StagePipelineBars stats={board.stageStats} />}
        </section>

        <section className="ws-panel">
          <div className="ws-panel__row">
            <h3>Machinery summary</h3>
            <Link to="/workers/manage/machinery" className="ws__ghost ws__ghost--sm">All machines →</Link>
          </div>
          <div className="ws-machine-stats ws-machine-stats--inline">
            <span className="ws-machine-stat ws-machine-stat--running">{machineCounts.running} running</span>
            <span className="ws-machine-stat ws-machine-stat--idle">{machineCounts.idle} idle</span>
            <span className="ws-machine-stat ws-machine-stat--maintenance">{machineCounts.maintenance} maintenance</span>
            <span className="ws-machine-stat ws-machine-stat--offline">{machineCounts.offline} offline</span>
          </div>
        </section>
      </div>

      <section className="ws-panel">
        <h3>Working now</h3>
        {board?.workingNow.length === 0 ? (
          <p className="ws-muted">No workers in progress.</p>
        ) : (
          <div className="ws-working-grid">
            {board?.workingNow.map(({ worker, jobs }) => (
              <Link
                key={worker.id}
                to={`/workers/manage/workers/${worker.id}`}
                className="ws-working-card"
              >
                <div className="ws-working-card__head">
                  <strong>{worker.code} · {worker.name}</strong>
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
        <div className="ws-panel__row">
          <h3>Urgent orders</h3>
          <Link to="/workers/manage?tab=orders" className="ws__ghost ws__ghost--sm">All orders →</Link>
        </div>
        {urgentOrders.length === 0 ? (
          <p className="ws-muted">No urgent or rush orders right now.</p>
        ) : (
          <div className="ws-order-list">
            {urgentOrders.map((order) => (
              <Link key={order.id} to={`/workers/manage/orders/${order.id}`} className="ws-order-card ws-order-card--compact">
                <div className="ws-order-card__head">
                  <div>
                    <h4>{order.orderNo}</h4>
                    <p className="ws-muted">{order.productLabel}</p>
                  </div>
                  <PriorityBadge priority={order.priority} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="ws-panel">
        <div className="ws-panel__row">
          <h3>Recent activity</h3>
          <Link to="/workers/manage?tab=activity" className="ws__ghost ws__ghost--sm">Full feed →</Link>
        </div>
        {board && <EventTimeline events={board.events} limit={10} />}
      </section>
    </main>
  )
}
