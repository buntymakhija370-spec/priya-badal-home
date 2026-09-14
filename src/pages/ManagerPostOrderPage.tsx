import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { createWorkshopOrder, type WorkshopAuth } from '../lib/workshopClient'
import {
  FLOOR_TYPES,
  type FloorType,
  type OrderPriority,
  stagesForFloor,
  stageLabel,
} from '../lib/workshopTypes'
import './WorkersApp.css'

type Ctx = { auth: WorkshopAuth | null }

const BAYS = [
  'Bay A',
  'Bay B',
  'Bay C',
  'Bay D',
  'Paint booth',
  'Dispatch dock',
  'CNC cell',
  'Assembly',
]

export function ManagerPostOrderPage() {
  const { auth } = useOutletContext<Ctx>()
  const pin = auth?.role === 'manager' ? auth.pin : ''
  const navigate = useNavigate()

  const [floorType, setFloorType] = useState<FloorType>('modular')
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
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const pipeline = useMemo(() => stagesForFloor(floorType).map(stageLabel), [floorType])
  const selectedFloor = FLOOR_TYPES.find((f) => f.id === floorType)!

  if (!auth || auth.role !== 'manager') return null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!pin) return
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
        floorType,
      })
      navigate(`/workers/manage/orders/${order.id}`, { replace: true })
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
            Choose the work floor first — Modular and Hand Crafted Panels use different stage
            pipelines.
          </p>
        </div>
      </header>

      {msg && <p className="ws-banner ws-banner--error">{msg}</p>}

      <form className="ws-form ws-panel" onSubmit={onSubmit}>
        <fieldset className="ws-floor-pick">
          <legend>Work floor section</legend>
          <div className="ws-floor-pick__grid">
            {FLOOR_TYPES.map((floor) => (
              <label
                key={floor.id}
                className={`ws-floor-card ${floorType === floor.id ? 'is-on' : ''}`}
              >
                <input
                  type="radio"
                  name="floorType"
                  value={floor.id}
                  checked={floorType === floor.id}
                  onChange={() => setFloorType(floor.id)}
                />
                <strong>{floor.label}</strong>
                <span>{floor.summary}</span>
              </label>
            ))}
          </div>
          <ol className="ws-floor-pick__pipe" aria-label={`${selectedFloor.label} stages`}>
            {pipeline.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ol>
        </fieldset>

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
            placeholder={
              floorType === 'modular'
                ? 'Modular kitchen carcass — oak matt'
                : 'Hand crafted fluted TV panel'
            }
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
            <input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="BWP 18mm" />
          </label>
          <label>
            Finish
            <input
              value={finish}
              onChange={(e) => setFinish(e.target.value)}
              placeholder={floorType === 'modular' ? 'Matt laminate' : 'Paint / polish'}
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
        <button type="submit" className="ws__primary" disabled={busy}>
          {busy ? 'Posting…' : `Post ${selectedFloor.label} order`}
        </button>
      </form>
    </main>
  )
}
