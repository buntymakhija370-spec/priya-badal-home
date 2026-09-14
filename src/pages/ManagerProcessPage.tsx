import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { FloorBadge, PriorityBadge } from '../components/workshop/WorkshopUi'
import {
  fetchProcessBoard,
  type ProcessBoardResponse,
  type WorkshopAuth,
} from '../lib/workshopClient'
import { FLOOR_TYPES, stageLabel, type FloorType } from '../lib/workshopTypes'
import './WorkersApp.css'

type Ctx = { auth: WorkshopAuth | null }
type FloorFilter = FloorType | 'all'

export function ManagerProcessPage() {
  const { auth } = useOutletContext<Ctx>()
  const pin = auth?.role === 'manager' ? auth.pin : ''
  const [floor, setFloor] = useState<FloorFilter>('all')
  const [board, setBoard] = useState<ProcessBoardResponse | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!pin) return
    setBoard(await fetchProcessBoard(pin, floor))
  }, [pin, floor])

  useEffect(() => {
    void refresh().catch((e) => setMsg(e instanceof Error ? e.message : 'Load failed'))
    const t = window.setInterval(() => void refresh().catch(() => {}), 4000)
    return () => window.clearInterval(t)
  }, [refresh])

  if (!auth || auth.role !== 'manager') return null

  return (
    <main className="ws-mgr ws-page">
      <header className="ws-detail-head">
        <div>
          <p className="ws-login__kicker">Pipeline</p>
          <h2>Process tracking</h2>
          <p className="ws-live">
            <span className="ws-live__dot" />
            {board?.updatedAt
              ? `Updated ${new Date(board.updatedAt).toLocaleTimeString()}`
              : 'Connecting…'}
          </p>
        </div>
      </header>

      <nav className="ws-floor-tabs" aria-label="Work floor filter">
        <button
          type="button"
          className={floor === 'all' ? 'is-on' : ''}
          onClick={() => setFloor('all')}
        >
          All floors
        </button>
        {FLOOR_TYPES.map((f) => (
          <button
            key={f.id}
            type="button"
            className={floor === f.id ? 'is-on' : ''}
            onClick={() => setFloor(f.id)}
          >
            {f.label}
          </button>
        ))}
      </nav>

      {floor !== 'all' && (
        <p className="ws-muted ws-floor-hint">{FLOOR_TYPES.find((f) => f.id === floor)?.summary}</p>
      )}

      {msg && <p className="ws-banner">{msg}</p>}

      <div className="ws-process-board">
        {board?.columns.map((col) => (
          <section key={col.stageId} className="ws-process-col">
            <header className="ws-process-col__head">
              <h3>{col.short}</h3>
              <span className="ws-process-col__count">
                {col.active.length + col.pending.length}
              </span>
            </header>
            <p className="ws-process-col__label">{col.label}</p>

            <div className="ws-process-col__cards">
              {col.active.map(({ order, stage, worker }) => (
                <Link
                  key={`${order.id}-active`}
                  to={`/workers/manage/orders/${order.id}`}
                  className={`ws-process-card is-${stage.status}`}
                >
                  <div className="ws-process-card__head">
                    <strong>{order.orderNo}</strong>
                    <PriorityBadge priority={order.priority} />
                  </div>
                  <FloorBadge floorType={order.floorType} />
                  <p className="ws-muted">{order.customerName}</p>
                  <p>{order.productLabel}</p>
                  {worker && (
                    <p className="ws-process-card__worker">
                      {worker.code} · {worker.name}
                    </p>
                  )}
                  {stage.statement && (
                    <p className="ws-process-card__stmt">{stage.statement}</p>
                  )}
                  <span className="ws-pill ws-pill--in_progress">
                    {stage.status.replace(/_/g, ' ')}
                  </span>
                </Link>
              ))}

              {col.pending.map(({ order }) => (
                <Link
                  key={`${order.id}-pending`}
                  to={`/workers/manage/orders/${order.id}`}
                  className="ws-process-card is-pending"
                >
                  <div className="ws-process-card__head">
                    <strong>{order.orderNo}</strong>
                    <PriorityBadge priority={order.priority} />
                  </div>
                  <FloorBadge floorType={order.floorType} />
                  <p className="ws-muted">{order.customerName}</p>
                  <p>{order.productLabel}</p>
                  <span className="ws-pill ws-pill--pending">Not started</span>
                </Link>
              ))}

              {col.active.length === 0 && col.pending.length === 0 && (
                <p className="ws-process-col__empty">No orders at {stageLabel(col.stageId)}</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
