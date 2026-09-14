import { useState, type FormEvent } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { createWorkshopOrder, type WorkshopAuth } from '../lib/workshopClient'
import type { OrderPriority } from '../lib/workshopTypes'
import './WorkersApp.css'

type Ctx = { auth: WorkshopAuth | null }

const BAYS = ['Bay A', 'Bay B', 'Bay C', 'Bay D', 'Polish room', 'Dispatch dock', 'CNC cell', 'Assembly']

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
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
          <p className="ws-muted">Create a job on the floor — assign stages after posting.</p>
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
            <input value={finish} onChange={(e) => setFinish(e.target.value)} placeholder="Matt laminate" />
          </label>
        </div>
        <div className="ws-form__row">
          <label>
            Bay
            <select value={bay} onChange={(e) => setBay(e.target.value)}>
              <option value="">— Select —</option>
              {BAYS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        </div>
        <button type="submit" className="ws__primary" disabled={busy}>
          {busy ? 'Posting…' : 'Post order'}
        </button>
      </form>
    </main>
  )
}
