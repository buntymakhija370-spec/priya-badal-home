import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  createWorkshopOrder,
  fetchWorkers,
  type WorkerRosterEntry,
  type WorkshopAuth,
} from '../lib/workshopClient'
import {
  WORK_STAGES,
  stageHint,
  stageLabel,
  type OrderPriority,
  type WorkStageId,
} from '../lib/workshopTypes'
import './WorkersApp.css'

type Ctx = { auth: WorkshopAuth | null }

const BAYS = [
  'Bay A',
  'Bay B',
  'Bay C',
  'Bay D',
  'Paint booth',
  'CNC cell',
  'Assembly',
  'Polish room',
]

type StagePick = {
  enabled: boolean
  workerId: string
  note: string
}

function emptyPicks(): Record<string, StagePick> {
  const picks: Record<string, StagePick> = {}
  for (const stage of WORK_STAGES) {
    picks[stage.id] = { enabled: false, workerId: '', note: '' }
  }
  return picks
}

export function ManagerPostOrderPage() {
  const { auth } = useOutletContext<Ctx>()
  const pin = auth?.role === 'manager' ? auth.pin : ''
  const navigate = useNavigate()

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
  const [stagePicks, setStagePicks] = useState<Record<string, StagePick>>(() => emptyPicks())
  const [workers, setWorkers] = useState<WorkerRosterEntry[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const pipeline = useMemo(() => WORK_STAGES.map((s) => s.id), [])
  const selectedCount = pipeline.filter((id) => stagePicks[id]?.enabled).length

  useEffect(() => {
    if (!pin) return
    void fetchWorkers(pin)
      .then((roster) => setWorkers(roster.workers.filter((w) => w.active !== false)))
      .catch((e) => setMsg(e instanceof Error ? e.message : 'Could not load workers'))
  }, [pin])

  function toggleStage(stageId: WorkStageId, enabled: boolean) {
    setStagePicks((prev) => ({
      ...prev,
      [stageId]: { ...(prev[stageId] || { enabled: false, workerId: '', note: '' }), enabled },
    }))
  }

  function setStageWorker(stageId: WorkStageId, workerId: string) {
    setStagePicks((prev) => ({
      ...prev,
      [stageId]: {
        ...(prev[stageId] || { enabled: true, workerId: '', note: '' }),
        workerId,
        enabled: true,
      },
    }))
  }

  function setStageNote(stageId: WorkStageId, note: string) {
    setStagePicks((prev) => ({
      ...prev,
      [stageId]: { ...(prev[stageId] || { enabled: true, workerId: '', note: '' }), note },
    }))
  }

  function workersForStage(stageId: WorkStageId) {
    const preferred = workers.filter((w) => w.role === stageId || w.role === 'multi')
    return preferred.length ? preferred : workers
  }

  if (!auth || auth.role !== 'manager') return null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!pin) return

    const assignments = pipeline
      .filter((stageId) => stagePicks[stageId]?.enabled)
      .map((stageId) => ({
        stageId,
        workerId: stagePicks[stageId].workerId,
        managerNote: stagePicks[stageId].note || undefined,
      }))

    for (const a of assignments) {
      if (!a.workerId) {
        setMsg(`Select a worker for ${stageLabel(a.stageId)} (or untick that work)`)
        return
      }
    }

    setBusy(true)
    setMsg(null)
    try {
      const { order } = await createWorkshopOrder(pin, {
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
        assignments,
      })
      navigate(`/workers/manage/orders/${order.id}/labels?print=1`, { replace: true })
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not create order')
      setBusy(false)
    }
  }

  return (
    <main className="ws-mgr ws-page">
      <header className="ws-detail-head">
        <div>
          <p className="ws-login__kicker">New work</p>
          <h2>Post order</h2>
          <p className="ws-muted">
            Tick which processes join this order and pick the worker for each stage.
          </p>
        </div>
      </header>

      {msg && <p className="ws-banner ws-banner--error">{msg}</p>}

      <form className="ws-form ws-panel" onSubmit={onSubmit}>
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
            placeholder="Kitchen carcass — oak matt"
            required
          />
        </label>
        <label>
          Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </label>
        <div className="ws-form__row">
          <label>
            Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value as OrderPriority)}>
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
            <input
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="BWP 18mm"
            />
          </label>
          <label>
            Finish
            <input
              value={finish}
              onChange={(e) => setFinish(e.target.value)}
              placeholder="Matt laminate / paint / polish"
            />
          </label>
        </div>
        <div className="ws-form__row">
          <label>
            Bay
            <select value={bay} onChange={(e) => setBay(e.target.value)}>
              <option value="">— Select —</option>
              {BAYS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        </div>

        <fieldset className="ws-stage-join">
          <legend>
            Join work to this order <span className="ws-muted">({selectedCount} selected)</span>
          </legend>
          <p className="ws-muted ws-stage-join__hint">
            Tick the process stages that should start on this order, then select the worker for each
            ticked stage.
          </p>
          <div className="ws-stage-join__list">
            {pipeline.map((stageId) => {
              const pick = stagePicks[stageId] || { enabled: false, workerId: '', note: '' }
              return (
                <div
                  key={stageId}
                  className={`ws-stage-join__row ${pick.enabled ? 'is-on' : ''}`}
                >
                  <label className="ws-stage-join__tick">
                    <input
                      type="checkbox"
                      checked={pick.enabled}
                      onChange={(e) => toggleStage(stageId, e.target.checked)}
                    />
                    <span>
                      <strong>{stageLabel(stageId)}</strong>
                      <em>{stageHint(stageId)}</em>
                    </span>
                  </label>
                  {pick.enabled && (
                    <div className="ws-stage-join__assign">
                      <label>
                        Worker
                        <select
                          value={pick.workerId}
                          onChange={(e) => setStageWorker(stageId, e.target.value)}
                          required
                        >
                          <option value="">— Select worker —</option>
                          {workersForStage(stageId).map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.code} · {w.name} ({w.role.replace(/_/g, ' ')})
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Note (optional)
                        <input
                          value={pick.note}
                          onChange={(e) => setStageNote(stageId, e.target.value)}
                          placeholder="Instruction for this stage"
                        />
                      </label>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </fieldset>

        <button type="submit" className="ws__primary" disabled={busy}>
          {busy
            ? 'Posting…'
            : selectedCount
              ? `Post order · ${selectedCount} work joined`
              : 'Post order'}
        </button>
      </form>
    </main>
  )
}
