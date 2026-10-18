import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  WORK_STAGES,
  formatDuration,
  orderProgress,
  priorityLabel,
  stageHint,
  stageLabel,
  type OrderPriority,
  type OrderStage,
  type StageStatus,
  type StatusEvent,
  type WorkStageId,
  type WorkshopOrder,
} from '../../lib/workshopTypes'

export function PriorityBadge({ priority }: { priority: OrderPriority }) {
  return <span className={`ws-priority ws-priority--${priority}`}>{priorityLabel(priority)}</span>
}

export function StatusPill({ status }: { status: StageStatus | WorkshopOrder['status'] }) {
  const label = status.replace(/_/g, ' ')
  return <span className={`ws-pill ws-pill--${status}`}>{label}</span>
}

export function ProgressBar({ percent, size = 'md' }: { percent: number; size?: 'sm' | 'md' }) {
  return (
    <div className={`ws-progress ws-progress--${size}`} role="progressbar" aria-valuenow={percent}>
      <div className="ws-progress__fill" style={{ width: `${percent}%` }} />
      <span className="ws-progress__label">{percent}%</span>
    </div>
  )
}

export function StageDots({ order }: { order: WorkshopOrder }) {
  return (
    <div className="ws-dots" aria-label="Stage progress">
      {order.stages.map((s) => (
        <span
          key={s.stageId}
          className={`ws-dots__dot ws-dots__dot--${s.status}`}
          title={`${stageLabel(s.stageId)}: ${s.status.replace(/_/g, ' ')}`}
        />
      ))}
    </div>
  )
}

type PipelineProps = {
  order: WorkshopOrder
  highlightStageId?: WorkStageId
  workerName?: (id: string | null) => string
  compact?: boolean
}

export function StagePipeline({ order, highlightStageId, workerName, compact }: PipelineProps) {
  const name = workerName ?? (() => '—')
  return (
    <ol className={`ws-pipeline ${compact ? 'ws-pipeline--compact' : ''}`}>
      {order.stages.map((stage, i) => {
        const active = stage.stageId === highlightStageId
        return (
          <li
            key={stage.stageId}
            className={`ws-pipeline__step is-${stage.status}${active ? ' is-highlight' : ''}`}
          >
            <div className="ws-pipeline__marker">
              <span className="ws-pipeline__num">{i + 1}</span>
            </div>
            <div className="ws-pipeline__body">
              <div className="ws-pipeline__head">
                <strong>{stageLabel(stage.stageId)}</strong>
                <StatusPill status={stage.status} />
              </div>
              {!compact && (
                <p className="ws-pipeline__hint">{stageHint(stage.stageId)}</p>
              )}
              {stage.workerId && (
                <p className="ws-pipeline__worker">{name(stage.workerId)}</p>
              )}
              {(stage.startedAt || stage.completedAt) && (
                <p className="ws-pipeline__time">
                  {stage.startedAt && (
                    <span>Started {new Date(stage.startedAt).toLocaleString()}</span>
                  )}
                  {stage.startedAt && (
                    <span> · {formatDuration(stage.startedAt, stage.completedAt)}</span>
                  )}
                </p>
              )}
              {stage.statement && (
                <p className="ws-pipeline__stmt">{stage.statement}</p>
              )}
              {stage.managerNote && (
                <p className="ws-pipeline__note">
                  <strong>Manager:</strong> {stage.managerNote}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function StageUpdateHistory({ stage }: { stage: OrderStage }) {
  if (!stage.updates.length) {
    return <p className="ws-muted">No updates yet for this stage.</p>
  }
  return (
    <ul className="ws-updates">
      {[...stage.updates].reverse().map((u) => (
        <li key={u.id} className={`ws-updates__item ws-updates__item--${u.kind}`}>
          <time>{new Date(u.at).toLocaleString()}</time>
          <span className="ws-updates__kind">{u.kind}</span>
          <p>{u.text}</p>
        </li>
      ))}
    </ul>
  )
}

export function EventTimeline({
  events,
  limit,
  filterKind,
}: {
  events: StatusEvent[]
  limit?: number
  filterKind?: StatusEvent['kind'] | 'all'
}) {
  const filtered =
    filterKind && filterKind !== 'all'
      ? events.filter((e) => e.kind === filterKind)
      : events
  const shown = limit ? filtered.slice(0, limit) : filtered

  if (!shown.length) {
    return <p className="ws-muted">No events to show.</p>
  }

  return (
    <ul className="ws-feed">
      {shown.map((ev) => (
        <li key={ev.id} className={`ws-feed__item ws-feed__item--${ev.kind}`}>
          <time>{new Date(ev.at).toLocaleString()}</time>
          <span>{ev.message}</span>
        </li>
      ))}
    </ul>
  )
}

export function OrderMetaGrid({ order }: { order: WorkshopOrder }) {
  const { percent } = orderProgress(order)
  return (
    <dl className="ws-meta">
      <div>
        <dt>Customer</dt>
        <dd>{order.customerName}</dd>
      </div>
      <div>
        <dt>Product</dt>
        <dd>{order.productLabel}</dd>
      </div>
      <div>
        <dt>Qty</dt>
        <dd>{order.quantity}</dd>
      </div>
      <div>
        <dt>Material</dt>
        <dd>{order.material || '—'}</dd>
      </div>
      <div>
        <dt>Finish</dt>
        <dd>{order.finish || '—'}</dd>
      </div>
      <div>
        <dt>Bay</dt>
        <dd>{order.bay || '—'}</dd>
      </div>
      <div>
        <dt>Due</dt>
        <dd>{order.dueDate ? new Date(order.dueDate).toLocaleDateString() : '—'}</dd>
      </div>
      <div>
        <dt>Priority</dt>
        <dd>
          <PriorityBadge priority={order.priority} />
        </dd>
      </div>
      <div>
        <dt>Progress</dt>
        <dd>
          <ProgressBar percent={percent} size="sm" />
        </dd>
      </div>
      {order.notes && (
        <div className="ws-meta__wide">
          <dt>Notes</dt>
          <dd>{order.notes}</dd>
        </div>
      )}
    </dl>
  )
}

export function BackLink({ to, label }: { to: string; label?: string }) {
  return (
    <Link to={to} className="ws-back">
      ← {label ?? 'Back'}
    </Link>
  )
}

export function KpiCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string | number
  sub?: string
  tone?: 'default' | 'urgent' | 'busy' | 'idle' | 'ok'
}) {
  return (
    <div className={`ws-kpi ws-kpi--${tone ?? 'default'}`}>
      <strong>{value}</strong>
      <span>{label}</span>
      {sub && <em>{sub}</em>}
    </div>
  )
}

export function StagePipelineBars({
  stats,
}: {
  stats: {
    stageId: WorkStageId
    label: string
    pending: number
    assigned: number
    inProgress: number
    done: number
  }[]
}) {
  return (
    <div className="ws-stage-bars">
      {stats.map((s) => {
        const total = s.pending + s.assigned + s.inProgress + s.done || 1
        return (
          <div key={s.stageId} className="ws-stage-bar">
            <div className="ws-stage-bar__head">
              <span>{WORK_STAGES.find((x) => x.id === s.stageId)?.short ?? s.label}</span>
              <span className="ws-muted">
                {s.inProgress} active · {s.done} done
              </span>
            </div>
            <div className="ws-stage-bar__track">
              <span
                className="ws-stage-bar__seg ws-stage-bar__seg--done"
                style={{ width: `${(s.done / total) * 100}%` }}
              />
              <span
                className="ws-stage-bar__seg ws-stage-bar__seg--active"
                style={{ width: `${(s.inProgress / total) * 100}%` }}
              />
              <span
                className="ws-stage-bar__seg ws-stage-bar__seg--assigned"
                style={{ width: `${(s.assigned / total) * 100}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function LiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(t)
  }, [])
  return (
    <time className="ws-clock" dateTime={now.toISOString()}>
      {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </time>
  )
}
