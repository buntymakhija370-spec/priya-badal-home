import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  fetchMachines,
  updateMachine,
  type MachinesResponse,
  type WorkshopAuth,
} from '../lib/workshopClient'
import type { Machine, MachineStatus, WorkStageId } from '../lib/workshopTypes'
import { WORK_STAGES } from '../lib/workshopTypes'
import './WorkersApp.css'

type Ctx = { auth: WorkshopAuth | null }

const STATUS_OPTIONS: MachineStatus[] = ['idle', 'running', 'maintenance', 'offline']

export function ManagerMachineryPage() {
  const { auth } = useOutletContext<Ctx>()
  const pin = auth?.role === 'manager' ? auth.pin : ''
  const [data, setData] = useState<MachinesResponse | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [editStatus, setEditStatus] = useState<MachineStatus>('idle')
  const [editNote, setEditNote] = useState('')
  const [editOrderId, setEditOrderId] = useState('')
  const [editStageId, setEditStageId] = useState<WorkStageId | ''>('')
  const [editOperatorId, setEditOperatorId] = useState('')

  const refresh = useCallback(async () => {
    if (!pin) return
    setData(await fetchMachines(pin))
  }, [pin])

  useEffect(() => {
    void refresh().catch((e) => setMsg(e instanceof Error ? e.message : 'Load failed'))
    const t = window.setInterval(() => void refresh().catch(() => {}), 4000)
    return () => window.clearInterval(t)
  }, [refresh])

  const orderMap = useMemo(
    () => new Map((data?.orders ?? []).map((o) => [o.id, o])),
    [data?.orders],
  )
  const workerMap = useMemo(
    () => new Map((data?.workers ?? []).map((w) => [w.id, w])),
    [data?.workers],
  )

  function openMachine(m: Machine) {
    setExpandedId(m.id)
    setEditStatus(m.status)
    setEditNote(m.note)
    setEditOrderId(m.orderId || '')
    setEditStageId(m.stageId || '')
    setEditOperatorId(m.operatorId || '')
  }

  async function saveMachine(machineId: string) {
    if (!pin) return
    setBusy(true)
    setMsg(null)
    try {
      await updateMachine(pin, {
        machineId,
        status: editStatus,
        note: editNote,
        orderId: editOrderId || null,
        stageId: editStageId || null,
        operatorId: editOperatorId || null,
      })
      await refresh()
      setMsg('Machine updated')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  if (!auth || auth.role !== 'manager') return null

  const counts = STATUS_OPTIONS.reduce(
    (acc, s) => {
      acc[s] = (data?.machines ?? []).filter((m) => m.status === s).length
      return acc
    },
    {} as Record<MachineStatus, number>,
  )

  return (
    <main className="ws-mgr ws-page">
      <header className="ws-detail-head">
        <div>
          <p className="ws-login__kicker">Equipment</p>
          <h2>Machinery tracking</h2>
          <p className="ws-live">
            <span className="ws-live__dot" />
            {data?.updatedAt
              ? `Updated ${new Date(data.updatedAt).toLocaleTimeString()}`
              : 'Connecting…'}
          </p>
        </div>
      </header>

      <div className="ws-machine-stats">
        {STATUS_OPTIONS.map((s) => (
          <span key={s} className={`ws-machine-stat ws-machine-stat--${s}`}>
            {counts[s]} {s}
          </span>
        ))}
      </div>

      {msg && <p className="ws-banner">{msg}</p>}

      <div className="ws-machine-grid">
        {(data?.machines ?? []).map((m) => {
          const order = m.orderId ? orderMap.get(m.orderId) : undefined
          const operator = m.operatorId ? workerMap.get(m.operatorId) : undefined
          const expanded = expandedId === m.id

          return (
            <article key={m.id} className={`ws-machine-card ws-machine-card--${m.status}`}>
              <button type="button" className="ws-machine-card__tap" onClick={() => openMachine(m)}>
                <div className="ws-machine-card__head">
                  <strong>{m.code}</strong>
                  <span className={`ws-machine-pill ws-machine-pill--${m.status}`}>{m.status}</span>
                </div>
                <h4>{m.name}</h4>
                <p className="ws-muted">{m.type} · {m.bay}</p>
                {order && (
                  <p className="ws-machine-card__link">
                    {order.orderNo} — {order.productLabel}
                  </p>
                )}
                {operator && (
                  <p className="ws-machine-card__op">
                    {operator.code} · {operator.name}
                  </p>
                )}
                {m.note && <p className="ws-machine-card__note">{m.note}</p>}
              </button>

              {expanded && (
                <div className="ws-machine-card__edit">
                  <label>
                    Status
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as MachineStatus)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Note
                    <textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} rows={2} />
                  </label>
                  <label>
                    Linked order
                    <select value={editOrderId} onChange={(e) => setEditOrderId(e.target.value)}>
                      <option value="">— None —</option>
                      {(data?.orders ?? []).map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.orderNo} — {o.productLabel}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Stage
                    <select
                      value={editStageId}
                      onChange={(e) => setEditStageId(e.target.value as WorkStageId | '')}
                    >
                      <option value="">— None —</option>
                      {WORK_STAGES.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Operator
                    <select value={editOperatorId} onChange={(e) => setEditOperatorId(e.target.value)}>
                      <option value="">— None —</option>
                      {(data?.workers ?? []).map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.code} · {w.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="ws-machine-card__btns">
                    <button
                      type="button"
                      className="ws__primary"
                      disabled={busy}
                      onClick={() => void saveMachine(m.id)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="ws__secondary"
                      onClick={() => setExpandedId(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </main>
  )
}
