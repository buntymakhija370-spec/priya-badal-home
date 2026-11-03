import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
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
import { fileToAttachmentPayload } from '../lib/workshopMedia'
import './WorkersApp.css'

type DesignDraft = { name: string; mimeType: string; dataUrl: string; preview?: string }

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
  sizeLabel: string
  quantity: string
}

function emptyPicks(): Record<string, StagePick> {
  const picks: Record<string, StagePick> = {}
  for (const stage of WORK_STAGES) {
    picks[stage.id] = { enabled: false, workerId: '', note: '' }
  }
  return picks
}

function blankRow(): SizeRow {
  return { sizeLabel: '', quantity: '1' }
}

function parseQty(raw: string): number {
  const n = Math.floor(Number(raw))
  return Number.isFinite(n) && n > 0 ? n : 0
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
  const [sizeRows, setSizeRows] = useState<SizeRow[]>(() => [blankRow(), blankRow()])
  const [designCode, setDesignCode] = useState('')
  const [designFiles, setDesignFiles] = useState<DesignDraft[]>([])
  const [designBusy, setDesignBusy] = useState(false)
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
    const q = parseQty(row.quantity)
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

  function updateSizeAt(index: number, patch: Partial<SizeRow>) {
    setSizeRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function setSizeCount(count: number) {
    const next = Math.max(1, Math.min(30, Math.floor(count) || 1))
    setSizeRows((rows) => {
      if (next === rows.length) return rows
      if (next > rows.length) {
        return [...rows, ...Array.from({ length: next - rows.length }, () => blankRow())]
      }
      return rows.slice(0, next)
    })
  }

  function removeSizeAt(index: number) {
    setSizeRows((rows) => {
      if (rows.length <= 1) return [blankRow()]
      return rows.filter((_, i) => i !== index)
    })
  }

  function blockEnterSubmit(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') e.preventDefault()
  }

  if (!auth || auth.role !== 'manager') return null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!pin) return

    const sizes = sizeRows
      .map((r) => ({
        sizeLabel: r.sizeLabel.trim(),
        quantity: parseQty(r.quantity),
      }))
      .filter((r) => r.sizeLabel && r.quantity > 0)

    if (!sizes.length) {
      setMsg('Add at least one size with pieces — one unique barcode is printed per piece')
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
        designCode: designCode.trim() || undefined,
        designFiles: designFiles.map(({ name, mimeType, dataUrl }) => ({ name, mimeType, dataUrl })),
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

  async function onDesignFilesPicked(fileList: FileList | null) {
    if (!fileList?.length) return
    setDesignBusy(true)
    setMsg(null)
    try {
      const next: DesignDraft[] = [...designFiles]
      for (const file of Array.from(fileList)) {
        if (next.length >= 8) break
        const payload = await fileToAttachmentPayload(file)
        next.push({
          ...payload,
          preview: payload.mimeType.startsWith('image/') ? payload.dataUrl : undefined,
        })
      }
      setDesignFiles(next)
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not read design file')
    } finally {
      setDesignBusy(false)
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

      <section className="ws-panel ws-design-files" aria-label="Design reference">
        <h3 className="ws-size-lines__title">
          Design reference <span className="ws-muted">(optional)</span>
        </h3>
        <p className="ws-muted ws-stage-join__hint">
          Use a design code for regular catalogue / quote designs, and/or attach JPG photos or CAD/PDF
          for the designer only — not shown to every worker.
        </p>
        <label className="ws-design-code">
          Design code
          <input
            value={designCode}
            onChange={(e) => setDesignCode(e.target.value)}
            onKeyDown={blockEnterSubmit}
            placeholder="e.g. LEENA-W01 / quote ref"
            autoComplete="off"
          />
        </label>
        <label className="ws-file-pick">
          <span>{designBusy ? 'Reading files…' : 'Add JPG / CAD / PDF (optional)'}</span>
          <input
            type="file"
            accept="image/*,application/pdf,.pdf,.dwg,.dxf,.step,.stp,.iges,.igs,.cdr,.ai"
            multiple
            disabled={designBusy || designFiles.length >= 8}
            onChange={(e) => {
              void onDesignFilesPicked(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
        {designFiles.length > 0 && (
          <ul className="ws-design-files__list">
            {designFiles.map((f, i) => (
              <li key={`${f.name}-${i}`} className="ws-design-files__item">
                {f.preview ? (
                  <img src={f.preview} alt="" className="ws-design-files__thumb" />
                ) : (
                  <span className="ws-design-files__badge">FILE</span>
                )}
                <span className="ws-design-files__name">{f.name}</span>
                <button
                  type="button"
                  className="ws__ghost"
                  onClick={() => setDesignFiles((list) => list.filter((_, idx) => idx !== i))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ws-panel ws-size-lines" aria-label="Sizes to manufacture">
        <div className="ws-size-lines__head">
          <h3 className="ws-size-lines__title">
            Sizes to manufacture <span className="ws-muted">({totalPieces} barcodes)</span>
          </h3>
          <label className="ws-size-count">
            How many sizes?
            <select
              value={sizeRows.length}
              onChange={(e) => setSizeCount(Number(e.target.value))}
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="ws-muted ws-stage-join__hint">
          Each filled size × pieces becomes unique barcodes. Empty size lines are ignored.
        </p>

        <div className="ws-size-lines__list">
          {sizeRows.map((row, index) => (
            <div key={`size-row-${index}`} className="ws-size-lines__row" data-size-index={index}>
              <div className="ws-size-field">
                <label htmlFor={`size-label-${index}`}>Size {index + 1}</label>
                <input
                  id={`size-label-${index}`}
                  type="text"
                  value={row.sizeLabel}
                  onChange={(e) => updateSizeAt(index, { sizeLabel: e.target.value })}
                  onKeyDown={blockEnterSubmit}
                  placeholder="e.g. 600 x 450 mm"
                  autoComplete="off"
                />
              </div>
              <div className="ws-size-field">
                <label htmlFor={`size-qty-${index}`}>Pieces</label>
                <input
                  id={`size-qty-${index}`}
                  type="text"
                  inputMode="numeric"
                  value={row.quantity}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === '' || /^\d{1,4}$/.test(v)) updateSizeAt(index, { quantity: v })
                  }}
                  onKeyDown={blockEnterSubmit}
                  placeholder="1"
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                className="ws__ghost ws-size-remove"
                onClick={() => removeSizeAt(index)}
              >
                {sizeRows.length <= 1 ? 'Clear' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      </section>

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
          <div className="ws-size-total">
            <span className="ws-size-total__label">Total barcodes</span>
            <strong className="ws-size-total__value">{totalPieces}</strong>
          </div>
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

        <section className="ws-stage-join" aria-label="Join work to this order">
          <h3 className="ws-size-lines__title">
            Join work to this order <span className="ws-muted">({selectedCount} selected)</span>
          </h3>
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
                          onKeyDown={blockEnterSubmit}
                          placeholder="Instruction for this stage"
                          autoComplete="off"
                        />
                      </label>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <button type="submit" className="ws__primary" disabled={busy || totalPieces < 1}>
          {busy
            ? 'Posting…'
            : `Post order · print ${totalPieces} piece barcode${totalPieces === 1 ? '' : 's'}`}
        </button>
      </form>
    </main>
  )
}
