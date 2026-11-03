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

type SizeRow = {
  key: string
  sizeLabel: string
  quantity: number
}

function emptyPicks(): Record<string, StagePick> {
  const picks: Record<string, StagePick> = {}
  for (const stage of WORK_STAGES) {
    picks[stage.id] = { enabled: false, workerId: '', note: '' }
  }
  return picks
}

function newSizeRow(): SizeRow {
  return { key: `sz_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, sizeLabel: '', quantity: 1 }
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
  const [sizeRows, setSizeRows] = useState<SizeRow[]>(() => [newSizeRow()])
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
  const totalPieces = sizeRows.reduce((sum, row) => {
    const q = Math.max(0, Math.floor(Number(row.quantity) || 0))
    return row.sizeLabel.trim() && q > 0 ? sum + q : sum
  }, 0)

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

  function updateSizeRow(key: string, patch: Partial<SizeRow>) {
    setSizeRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function removeSizeRow(key: string) {
    setSizeRows((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.key !== key)))
  }

  if (!auth || auth.role !== 'manager') return null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!pin) return

    const sizes = sizeRows
      .map((r) => ({
        sizeLabel: r.sizeLabel.trim(),
        quantity: Math.max(0, Math.floor(Number(r.quantity) || 0)),
      }))
      .filter((r) => r.sizeLabel && r.quantity > 0)

    if (!sizes.length) {
      setMsg('Add at least one size with quantity — one unique barcode is printed per piece')
      return
    }

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
        sizes,
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
            Add every custom size for this product. One unique barcode is generated for each piece —
            kitchen, wardrobe, shutters, or any category.
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
            placeholder="Kitchen shutters — oak matt"
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
            Total pieces
            <input type="text" value={String(totalPieces)} readOnly />
          </label>
        </div>

        <fieldset className="ws-size-lines">
          <legend>
            Sizes to manufacture <span className="ws-muted">({totalPieces} barcodes)</span>
          </legend>
          <p className="ws-muted ws-stage-join__hint">
            Each size × quantity becomes separate stickers. Scan any sticker to see client, product,
            size, and order.
          </p>
          <div className="ws-size-lines__list">
            {sizeRows.map((row, index) => (
              <div key={row.key} className="ws-size-lines__row">
                <label>
                  Size {index + 1}
                  <input
                    value={row.sizeLabel}
                    onChange={(e) => updateSizeRow(row.key, { sizeLabel: e.target.value })}
                    placeholder="e.g. 600 × 450 mm / W 2ft × H 4ft"
                    required={index === 0}
                  />
                </label>
                <label>
                  Pieces
                  <input
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) =>
                      updateSizeRow(row.key, { quantity: Number(e.target.value) || 1 })
                    }
                    required
                  />
                </label>
                <button
                  type="button"
                  className="ws__ghost"
                  onClick={() => removeSizeRow(row.key)}
                  disabled={sizeRows.length <= 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="ws__secondary" onClick={() => setSizeRows((r) => [...r, newSizeRow()])}>
            Add another size
          </button>
        </fieldset>

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

        <button type="submit" className="ws__primary" disabled={busy || totalPieces < 1}>
          {busy
            ? 'Posting…'
            : `Post order · print ${totalPieces} piece barcode${totalPieces === 1 ? '' : 's'}`}
        </button>
      </form>
    </main>
  )
}
