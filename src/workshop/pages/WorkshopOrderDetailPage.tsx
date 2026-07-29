import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchWorkshopDb, setJobStatus, updateOrder } from '../api'
import type { DepartmentId, JobStatus, OrderStatus, WorkshopDb, WorkshopOrder } from '../types'
import { DEPARTMENTS, ORDER_STATUSES, formatInr } from '../types'

export function WorkshopOrderDetailPage() {
  const { orderId = '' } = useParams()
  const [db, setDb] = useState<WorkshopDb | null>(null)
  const [order, setOrder] = useState<WorkshopOrder | null>(null)
  const [tab, setTab] = useState<'overview' | 'production' | 'dispatch'>('overview')
  const [assignee, setAssignee] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const reload = async () => {
    const next = await fetchWorkshopDb()
    setDb(next)
    setOrder(next.orders.find((o) => o.id === orderId) || null)
  }

  useEffect(() => {
    reload().catch((e: Error) => setError(e.message))
  }, [orderId])

  const reports = useMemo(
    () => (db?.reports || []).filter((r) => r.orderId === orderId).slice(0, 20),
    [db, orderId],
  )

  if (error) return <p className="ws-empty">{error}</p>
  if (!order) return <p className="ws-empty">Loading order…</p>

  const patchStatus = async (status: OrderStatus) => {
    setBusy(true)
    try {
      const next = await updateOrder(order.id, { status })
      setOrder(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const updateJob = async (departmentId: DepartmentId, status: JobStatus) => {
    setBusy(true)
    try {
      const res = await setJobStatus(order.id, departmentId, status, note, assignee || undefined)
      setOrder(res.order)
      setNote('')
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Job update failed')
    } finally {
      setBusy(false)
    }
  }

  const markDispatched = async () => {
    setBusy(true)
    try {
      const next = await updateOrder(order.id, {
        status: 'dispatched',
        dispatchedAt: new Date().toISOString(),
        jobs: { ...order.jobs, packing: 'done', dispatch: 'done' },
      })
      setOrder(next)
      setTab('dispatch')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dispatch failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="ws-page-head">
        <div>
          <h1>{order.orderNo}</h1>
          <p>
            {order.customerName} · {order.customerPhone}
            {order.partnerName ? ` · Partner: ${order.partnerName}` : ''}
          </p>
        </div>
        <div className="ws-actions">
          <Link className="ws-btn ws-btn--ghost" to="/workshop/orders">
            All orders
          </Link>
          <button type="button" className="ws-btn ws-btn--print" onClick={() => window.print()}>
            Print / PDF
          </button>
        </div>
      </div>

      <div className="ws-actions" style={{ marginBottom: '1rem' }}>
        {(['overview', 'production', 'dispatch'] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={tab === t ? 'ws-btn ws-btn--primary' : 'ws-btn ws-btn--ghost'}
            onClick={() => setTab(t)}
          >
            {t === 'overview' ? 'Overview' : t === 'production' ? 'Production copy' : 'Dispatch copy'}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="ws-stack">
          <div className="ws-card">
            <div className="ws-form__row">
              <div>
                <div className="ws-field">
                  <label>Status</label>
                  <select
                    value={order.status}
                    disabled={busy}
                    onChange={(e) => patchStatus(e.target.value as OrderStatus)}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <p style={{ margin: '0 0 0.35rem' }}>
                  <span className="ws-pill ws-pill--info">{order.source.replace('_', ' ')}</span>
                </p>
                <p style={{ margin: 0, color: '#3a4a40' }}>
                  Total {formatInr(order.totalAmount)} · Advance {formatInr(order.advancePaid)} · Balance{' '}
                  {formatInr(Math.max(0, order.totalAmount - order.advancePaid))}
                </p>
                <p style={{ margin: '0.35rem 0 0', color: '#3a4a40' }}>
                  Due {order.dueDate || '—'} · City {order.customerCity || '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="ws-card">
            <h2>Lines</h2>
            <table className="ws-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((l) => (
                  <tr key={l.id}>
                    <td>
                      {l.productName}
                      {l.notes ? (
                        <div style={{ fontSize: '0.8rem', color: '#3a4a40' }}>{l.notes}</div>
                      ) : null}
                    </td>
                    <td>{l.sku || '—'}</td>
                    <td>{l.qty}</td>
                    <td>{formatInr(l.unitPrice)}</td>
                    <td>{formatInr(l.qty * l.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {order.productionNotes ? (
              <p style={{ marginTop: '0.75rem' }}>
                <strong>Production notes:</strong> {order.productionNotes}
              </p>
            ) : null}
          </div>

          <div className="ws-card">
            <h2>Department jobs</h2>
            <div className="ws-field" style={{ marginBottom: '0.65rem' }}>
              <label>Assignee (optional)</label>
              <input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Worker name" />
            </div>
            <div className="ws-field" style={{ marginBottom: '0.75rem' }}>
              <label>Report note</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What changed…" />
            </div>
            <div className="ws-jobs">
              {DEPARTMENTS.map((d) => (
                <div className="ws-job" key={d.id}>
                  <strong>{d.name}</strong>
                  <span className="ws-pill">{(order.jobs?.[d.id] || 'queued').replace('_', ' ')}</span>
                  <div className="ws-actions">
                    <button
                      type="button"
                      className="ws-btn ws-btn--ghost"
                      disabled={busy}
                      onClick={() => updateJob(d.id, 'in_progress')}
                    >
                      Start
                    </button>
                    <button
                      type="button"
                      className="ws-btn ws-btn--primary"
                      disabled={busy}
                      onClick={() => updateJob(d.id, 'done')}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ws-card">
            <h2>Department reports</h2>
            {reports.length === 0 ? (
              <p className="ws-empty">No reports yet.</p>
            ) : (
              <table className="ws-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Dept</th>
                    <th>Status</th>
                    <th>By</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.at).toLocaleString('en-IN')}</td>
                      <td>{r.departmentId}</td>
                      <td>{r.status}</td>
                      <td>{r.assignee || '—'}</td>
                      <td>{r.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'production' ? (
        <div className="ws-doc">
          <div className="ws-doc__top">
            <div>
              <h1>PRODUCTION COPY</h1>
              <div className="ws-doc__meta">Priyabadal Homes · Workshop</div>
            </div>
            <div className="ws-doc__meta" style={{ textAlign: 'right' }}>
              <strong>{order.orderNo}</strong>
              <span>{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
              <span>Due: {order.dueDate || 'TBC'}</span>
            </div>
          </div>
          <p>
            <strong>Customer:</strong> {order.customerName} · {order.customerPhone}
            {order.customerCity ? ` · ${order.customerCity}` : ''}
          </p>
          <p>
            <strong>Source:</strong> {order.source.replace('_', ' ')}
            {order.partnerName ? ` · Partner ${order.partnerName}` : ''}
          </p>
          <table className="ws-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>SKU</th>
                <th>Size / finish</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((l, i) => (
                <tr key={l.id}>
                  <td>{i + 1}</td>
                  <td>{l.productName}</td>
                  <td>{l.sku || '—'}</td>
                  <td>
                    {[l.widthFt && `W ${l.widthFt}ft`, l.heightFt && `H ${l.heightFt}ft`, l.depthFt && `D ${l.depthFt}ft`, l.finish]
                      .filter(Boolean)
                      .join(' · ') || l.notes || 'As confirmed'}
                  </td>
                  <td>{l.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: '1rem' }}>
            <strong>Workshop notes:</strong> {order.productionNotes || '—'}
          </p>
          <p>
            <strong>Dept checklist:</strong>{' '}
            {DEPARTMENTS.map((d) => `${d.short}:${(order.jobs?.[d.id] || 'queued').replace('_', ' ')}`).join(' · ')}
          </p>
          <p style={{ marginTop: '1.5rem', color: '#3a4a40' }}>
            Sign-off Cutting _____ CNC _____ Carcass _____ Finish _____ Hardware _____ QC _____
          </p>
        </div>
      ) : null}

      {tab === 'dispatch' ? (
        <div className="ws-stack">
          <div className="ws-actions">
            <button type="button" className="ws-btn ws-btn--primary" disabled={busy} onClick={markDispatched}>
              Mark dispatched
            </button>
          </div>
          <div className="ws-doc">
            <div className="ws-doc__top">
              <div>
                <h1>DISPATCH COPY</h1>
                <div className="ws-doc__meta">Priyabadal Homes · Outward</div>
              </div>
              <div className="ws-doc__meta" style={{ textAlign: 'right' }}>
                <strong>{order.orderNo}</strong>
                <span>{order.dispatchedAt ? new Date(order.dispatchedAt).toLocaleString('en-IN') : 'Not yet dispatched'}</span>
              </div>
            </div>
            <p>
              <strong>Deliver to:</strong> {order.customerName}
            </p>
            <p>
              <strong>Phone:</strong> {order.customerPhone}
            </p>
            <p>
              <strong>City:</strong> {order.customerCity || '—'}
            </p>
            <table className="ws-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Packed</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((l) => (
                  <tr key={l.id}>
                    <td>
                      {l.productName} {l.sku ? `(${l.sku})` : ''}
                    </td>
                    <td>{l.qty}</td>
                    <td>☐ </td>
                    <td>☐ </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ marginTop: '1rem' }}>
              <strong>Balance due:</strong> {formatInr(Math.max(0, order.totalAmount - order.advancePaid))}
            </p>
            <p>
              <strong>Vehicle / LR:</strong> {order.vehicleNo || '________________'}
            </p>
            <p>
              <strong>Dispatch notes:</strong> {order.dispatchNotes || '________________'}
            </p>
            <p style={{ marginTop: '1.5rem' }}>
              Packed by _________ · Driver _________ · Customer sign _________
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
