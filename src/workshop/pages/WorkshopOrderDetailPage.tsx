import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchWorkshopDb, setChecklistItem, setJobStatus, updateOrder } from '../api'
import { PIPELINE_STAGES, checklistProgress } from '../pipeline'
import type {
  DepartmentId,
  JobStatus,
  OrderStatus,
  TransportDetails,
  WorkshopDb,
  WorkshopOrder,
} from '../types'
import { DEPARTMENTS, ORDER_STATUSES, emptyJobs, formatInr } from '../types'

export function WorkshopOrderDetailPage() {
  const { orderId = '' } = useParams()
  const [db, setDb] = useState<WorkshopDb | null>(null)
  const [order, setOrder] = useState<WorkshopOrder | null>(null)
  const [tab, setTab] = useState<'pipeline' | 'jobsheet' | 'transport'>('pipeline')
  const [activeStage, setActiveStage] = useState<DepartmentId>('review')
  const [assignee, setAssignee] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [transport, setTransport] = useState<TransportDetails>({})

  async function reload() {
    const next = await fetchWorkshopDb()
    setDb(next)
    const found = next.orders.find((o) => o.id === orderId) || null
    setOrder(found)
    if (found?.transport) setTransport(found.transport)
  }

  useEffect(() => {
    void reload().catch((e: Error) => setError(e.message))
  }, [orderId])

  const reports = useMemo(
    () => (db?.reports || []).filter((r) => r.orderId === orderId).slice(0, 40),
    [db, orderId],
  )

  if (!order) return <p className="ws-empty">{error || 'Loading order…'}</p>

  const jobs = { ...emptyJobs(), ...(order.jobs || {}) }
  const stage = PIPELINE_STAGES.find((s) => s.id === activeStage) || PIPELINE_STAGES[0]
  const stageChecks = order.checklists?.[activeStage] || {}
  const progress = checklistProgress(activeStage, stageChecks)

  async function patchStatus(status: OrderStatus) {
    setBusy(true)
    setError('')
    try {
      setOrder(await updateOrder(order!.id, { status }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  async function updateJob(departmentId: DepartmentId, status: JobStatus) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await setJobStatus(order!.id, departmentId, status, note, assignee || undefined)
      setOrder(res.order)
      setNote('')
      setMessage(
        `${DEPARTMENTS.find((d) => d.id === departmentId)?.name || departmentId} → ${status.replace('_', ' ')}`,
      )
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Job update failed')
    } finally {
      setBusy(false)
    }
  }

  async function toggleTick(departmentId: DepartmentId, itemId: string, done: boolean) {
    setBusy(true)
    setError('')
    try {
      const res = await setChecklistItem(order!.id, departmentId, itemId, done, assignee || undefined)
      setOrder(res.order)
      const prog = checklistProgress(departmentId, res.order.checklists?.[departmentId])
      if (prog.complete && res.order.jobs?.[departmentId] !== 'done') {
        await setJobStatus(
          order!.id,
          departmentId,
          'done',
          note || 'Checklist complete',
          assignee || undefined,
        )
        setMessage('All ticks done — stage marked complete')
        await reload()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checklist update failed')
    } finally {
      setBusy(false)
    }
  }

  async function saveTransport() {
    setBusy(true)
    setError('')
    try {
      const next = await updateOrder(order!.id, {
        transport,
        vehicleNo: transport.vehicleNo || order!.vehicleNo,
        dispatchNotes: transport.notes || order!.dispatchNotes,
      })
      setOrder(next)
      setMessage('Transport details saved')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save transport')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ws-order-detail">
      <div className="ws-page-head">
        <div>
          <h1>{order.orderNo}</h1>
          <p>
            Client: <strong>{order.customerName}</strong> · {order.customerPhone}
            {order.customerCity ? ` · ${order.customerCity}` : ''}
            {order.partnerName ? ` · Partner: ${order.partnerName}` : ''}
          </p>
        </div>
        <div className="ws-actions">
          <Link className="ws-btn ws-btn--ghost" to="/workshop/orders">
            All orders
          </Link>
          <button type="button" className="ws-btn ws-btn--print" onClick={() => window.print()}>
            Print job sheet
          </button>
        </div>
      </div>

      {error ? <p className="ws-error">{error}</p> : null}
      {message ? <p className="ws-hint">{message}</p> : null}

      <div className="ws-actions" style={{ marginBottom: '1rem' }}>
        {(
          [
            ['pipeline', 'Workshop pipeline'],
            ['jobsheet', 'Client job sheet'],
            ['transport', 'Transport'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`ws-btn ${tab === id ? 'ws-btn--primary' : 'ws-btn--ghost'}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'jobsheet' ? (
        <div className="ws-card">
          <h2>Client order / job sheet</h2>
          <div className="ws-meta-grid">
            <div>
              <span>Client name</span>
              <strong>{order.customerName}</strong>
            </div>
            <div>
              <span>Phone</span>
              <strong>{order.customerPhone}</strong>
            </div>
            <div>
              <span>Order no.</span>
              <strong>{order.orderNo}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{order.status.replace(/_/g, ' ')}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{formatInr(order.totalAmount)}</strong>
            </div>
            <div>
              <span>Advance</span>
              <strong>{formatInr(order.advancePaid)}</strong>
            </div>
          </div>

          <label className="ws-field" style={{ marginTop: '0.75rem', display: 'grid', gap: '0.35rem' }}>
            Order status
            <select
              value={order.status}
              disabled={busy}
              onChange={(e) => void patchStatus(e.target.value as OrderStatus)}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <h3>Products on this job</h3>
          <div className="ws-table-wrap">
            <table className="ws-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Size (ft)</th>
                  <th>Finish</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((line) => (
                  <tr key={line.id}>
                    <td>
                      <strong>{line.productName}</strong>
                      {line.sku ? <div className="ws-hint">{line.sku}</div> : null}
                      {line.category ? <div className="ws-hint">{line.category}</div> : null}
                    </td>
                    <td>
                      {[line.widthFt, line.heightFt, line.depthFt].some((n) => n)
                        ? `${line.widthFt || '—'} × ${line.heightFt || '—'} × ${line.depthFt || '—'}`
                        : '—'}
                    </td>
                    <td>{line.finish || '—'}</td>
                    <td>{line.qty}</td>
                    <td>{formatInr(line.unitPrice)}</td>
                    <td>{line.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {order.productionNotes ? (
            <p className="ws-hint" style={{ marginTop: '0.75rem' }}>
              Production notes: {order.productionNotes}
            </p>
          ) : null}
        </div>
      ) : null}

      {tab === 'pipeline' ? (
        <>
          <div className="ws-card">
            <h2>Workshop management pipeline</h2>
            <p className="ws-hint">
              Order posted for this client → Priya & Badal review → Designing → Cutting → Phase 2
              Finishing → QC → Dispatch → Transport handover. Each stage ticks its checklist.
            </p>
            <div className="ws-pipeline">
              {PIPELINE_STAGES.map((s) => {
                const st = jobs[s.id] || 'queued'
                const prog = checklistProgress(s.id, order.checklists?.[s.id])
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`ws-pipeline__stage is-${st} ${activeStage === s.id ? 'is-active' : ''}`}
                    onClick={() => setActiveStage(s.id)}
                  >
                    <strong>{s.short}</strong>
                    <span>{st.replace('_', ' ')}</span>
                    <em>
                      {prog.done}/{prog.total} ticks
                    </em>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="ws-card">
            <div className="ws-projects__head">
              <div>
                <p className="ws-eyebrow">{(jobs[activeStage] || 'queued').replace('_', ' ')}</p>
                <h2>{stage.name}</h2>
                <p className="ws-hint">{stage.description}</p>
              </div>
              <div className="ws-actions no-print">
                <button
                  type="button"
                  className="ws-btn ws-btn--ghost"
                  disabled={busy}
                  onClick={() => void updateJob(activeStage, 'in_progress')}
                >
                  Start stage
                </button>
                <button
                  type="button"
                  className="ws-btn ws-btn--primary"
                  disabled={busy}
                  onClick={() => void updateJob(activeStage, 'done')}
                >
                  Mark stage done
                </button>
              </div>
            </div>

            <div className="ws-form__row no-print" style={{ marginBottom: '0.75rem' }}>
              <label className="ws-field">
                Person working
                <input
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="Designer / cutter / finisher name"
                />
              </label>
              <label className="ws-field">
                Note
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note for report"
                />
              </label>
            </div>

            <h3>
              Tick list ({progress.done}/{progress.total})
            </h3>
            <p className="ws-hint">
              See the client job sheet, then tick each item when done. When all ticks are complete,
              stage auto-marks done.
            </p>
            <ul className="ws-ticks">
              {stage.checklist.map((item) => {
                const checked = Boolean(stageChecks[item.id])
                return (
                  <li key={item.id} className={checked ? 'is-done' : undefined}>
                    <label>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={busy}
                        onChange={(e) => void toggleTick(activeStage, item.id, e.target.checked)}
                      />
                      <span>{item.label}</span>
                    </label>
                  </li>
                )
              })}
            </ul>

            {activeStage === 'design' ? (
              <div className="ws-card" style={{ marginTop: '1rem', background: '#f4f7f5' }}>
                <h3>Product details for designer</h3>
                <ul className="ws-hint" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                  {order.lines.map((line) => (
                    <li key={line.id}>
                      <strong>{line.productName}</strong>
                      {line.finish ? ` · Finish: ${line.finish}` : ''}
                      {[line.widthFt, line.heightFt, line.depthFt].some((n) => n)
                        ? ` · Size: ${line.widthFt || '—'}×${line.heightFt || '—'}×${line.depthFt || '—'} ft`
                        : ''}
                      {line.notes ? ` · ${line.notes}` : ''} · qty {line.qty}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="ws-card">
            <h2>Department reports</h2>
            {!reports.length ? (
              <p className="ws-hint">No reports yet.</p>
            ) : (
              <div className="ws-table-wrap">
                <table className="ws-table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Stage</th>
                      <th>Status</th>
                      <th>By</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id}>
                        <td>{new Date(r.at).toLocaleString('en-IN')}</td>
                        <td>
                          {DEPARTMENTS.find((d) => d.id === r.departmentId)?.short || r.departmentId}
                        </td>
                        <td>{r.status.replace('_', ' ')}</td>
                        <td>{r.assignee || '—'}</td>
                        <td>{r.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}

      {tab === 'transport' ? (
        <div className="ws-card">
          <h2>Transport & handover details</h2>
          <p className="ws-hint">
            After QC and dispatch, enter vehicle / driver details for finished product handover.
          </p>
          <div className="ws-form__row">
            <label className="ws-field">
              Vehicle no.
              <input
                value={transport.vehicleNo || ''}
                onChange={(e) => setTransport({ ...transport, vehicleNo: e.target.value })}
              />
            </label>
            <label className="ws-field">
              Driver name
              <input
                value={transport.driverName || ''}
                onChange={(e) => setTransport({ ...transport, driverName: e.target.value })}
              />
            </label>
          </div>
          <div className="ws-form__row">
            <label className="ws-field">
              Driver phone
              <input
                value={transport.driverPhone || ''}
                onChange={(e) => setTransport({ ...transport, driverPhone: e.target.value })}
              />
            </label>
            <label className="ws-field">
              LR / bilty no.
              <input
                value={transport.lrNo || ''}
                onChange={(e) => setTransport({ ...transport, lrNo: e.target.value })}
              />
            </label>
          </div>
          <div className="ws-form__row">
            <label className="ws-field">
              Received by (client)
              <input
                value={transport.receivedBy || ''}
                onChange={(e) => setTransport({ ...transport, receivedBy: e.target.value })}
              />
            </label>
            <label className="ws-field">
              Handover date
              <input
                type="datetime-local"
                value={transport.handoverAt?.slice(0, 16) || ''}
                onChange={(e) =>
                  setTransport({
                    ...transport,
                    handoverAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  })
                }
              />
            </label>
          </div>
          <label className="ws-field">
            Notes
            <textarea
              rows={3}
              value={transport.notes || ''}
              onChange={(e) => setTransport({ ...transport, notes: e.target.value })}
            />
          </label>
          <div className="ws-actions" style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="ws-btn ws-btn--primary"
              disabled={busy}
              onClick={() => void saveTransport()}
            >
              Save transport details
            </button>
            <button
              type="button"
              className="ws-btn ws-btn--ghost"
              disabled={busy}
              onClick={() => void updateJob('transport', 'done')}
            >
              Mark transport complete
            </button>
          </div>
        </div>
      ) : null}

      <div className="ws-card print-only" style={{ marginTop: '1rem' }}>
        <h2>Job sheet — {order.orderNo}</h2>
        <p>
          Client: {order.customerName} · {order.customerPhone}
        </p>
        <p>
          Pipeline:{' '}
          {PIPELINE_STAGES.map((s) => `${s.short}:${(jobs[s.id] || 'queued').replace('_', ' ')}`).join(
            ' · ',
          )}
        </p>
      </div>
    </div>
  )
}
