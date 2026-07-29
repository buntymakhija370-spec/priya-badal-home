import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createOrder, fetchWorkshopDb } from '../api'
import type { OrderLine, OrderSource, WorkshopDb } from '../types'
import { ORDER_SOURCES, formatInr } from '../types'

type DraftLine = Omit<OrderLine, 'id'>

const blankLine = (): DraftLine => ({
  productName: '',
  sku: '',
  category: '',
  qty: 1,
  unitPrice: 0,
  notes: '',
})

export function WorkshopNewOrderPage() {
  const navigate = useNavigate()
  const [db, setDb] = useState<WorkshopDb | null>(null)
  const [source, setSource] = useState<OrderSource>('whatsapp')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerCity, setCustomerCity] = useState('')
  const [partnerId, setPartnerId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [advancePaid, setAdvancePaid] = useState(0)
  const [productionNotes, setProductionNotes] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([blankLine()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchWorkshopDb().then(setDb).catch(() => undefined)
  }, [])

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + Number(l.qty || 0) * Number(l.unitPrice || 0), 0),
    [lines],
  )

  const partner = db?.partners.find((p) => p.id === partnerId)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Customer name and phone are required.')
      return
    }
    if (!lines.some((l) => l.productName.trim())) {
      setError('Add at least one product line.')
      return
    }
    setSaving(true)
    try {
      const order = await createOrder({
        source,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerCity: customerCity.trim() || undefined,
        partnerId: source === 'channel_partner' ? partnerId || undefined : undefined,
        partnerName: source === 'channel_partner' ? partner?.name : undefined,
        lines: lines
          .filter((l) => l.productName.trim())
          .map((l) => ({
            ...l,
            qty: Number(l.qty) || 1,
            unitPrice: Number(l.unitPrice) || 0,
          })),
        advancePaid: Number(advancePaid) || 0,
        totalAmount: total,
        dueDate: dueDate || undefined,
        productionNotes: productionNotes.trim() || undefined,
        status: 'confirmed',
      })
      navigate(`/workshop/orders/${order.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save order')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="ws-page-head">
        <div>
          <h1>New order</h1>
          <p>Post WhatsApp, offline, website, or partner orders into the workshop</p>
        </div>
        <Link className="ws-btn ws-btn--ghost" to="/workshop/orders">
          Back to orders
        </Link>
      </div>

      <form className="ws-card ws-form" onSubmit={onSubmit}>
        <div className="ws-form__row">
          <div className="ws-field">
            <label>Order source</label>
            <select value={source} onChange={(e) => setSource(e.target.value as OrderSource)}>
              {ORDER_SOURCES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="ws-field">
            <label>Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        {source === 'channel_partner' ? (
          <div className="ws-field">
            <label>Channel partner</label>
            <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
              <option value="">Select partner</option>
              {(db?.partners || [])
                .filter((p) => p.active)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.city}
                  </option>
                ))}
            </select>
          </div>
        ) : null}

        <div className="ws-form__row">
          <div className="ws-field">
            <label>Customer name</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
          </div>
          <div className="ws-field">
            <label>WhatsApp / phone</label>
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
          </div>
        </div>

        <div className="ws-form__row">
          <div className="ws-field">
            <label>City</label>
            <input value={customerCity} onChange={(e) => setCustomerCity(e.target.value)} />
          </div>
          <div className="ws-field">
            <label>Advance paid (₹)</label>
            <input
              type="number"
              min={0}
              value={advancePaid}
              onChange={(e) => setAdvancePaid(Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <h2 style={{ margin: '0 0 0.55rem', fontSize: '1rem' }}>Products / lines</h2>
          <div className="ws-lines">
            {lines.map((line, idx) => (
              <div className="ws-line" key={idx}>
                <div className="ws-field">
                  <label>Product</label>
                  <input
                    value={line.productName}
                    onChange={(e) => {
                      const next = [...lines]
                      next[idx] = { ...line, productName: e.target.value }
                      setLines(next)
                    }}
                    placeholder="e.g. Taupe Reeded Kitchen"
                  />
                </div>
                <div className="ws-field">
                  <label>SKU</label>
                  <input
                    value={line.sku || ''}
                    onChange={(e) => {
                      const next = [...lines]
                      next[idx] = { ...line, sku: e.target.value }
                      setLines(next)
                    }}
                  />
                </div>
                <div className="ws-field">
                  <label>Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={line.qty}
                    onChange={(e) => {
                      const next = [...lines]
                      next[idx] = { ...line, qty: Number(e.target.value) }
                      setLines(next)
                    }}
                  />
                </div>
                <div className="ws-field">
                  <label>Unit ₹</label>
                  <input
                    type="number"
                    min={0}
                    value={line.unitPrice}
                    onChange={(e) => {
                      const next = [...lines]
                      next[idx] = { ...line, unitPrice: Number(e.target.value) }
                      setLines(next)
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="ws-btn ws-btn--ghost"
                  onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                  disabled={lines.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="ws-btn ws-btn--ghost"
            style={{ marginTop: '0.55rem' }}
            onClick={() => setLines([...lines, blankLine()])}
          >
            + Add line
          </button>
        </div>

        <div className="ws-field">
          <label>Production notes (for workshop)</label>
          <textarea
            value={productionNotes}
            onChange={(e) => setProductionNotes(e.target.value)}
            placeholder="Finish, size confirmation, special instructions…"
          />
        </div>

        <p>
          <strong>Order total: {formatInr(total)}</strong>
          {advancePaid > 0 ? (
            <span style={{ color: '#3a4a40' }}> · Balance {formatInr(Math.max(0, total - advancePaid))}</span>
          ) : null}
        </p>

        {error ? <p style={{ color: '#8a3b2b', margin: 0 }}>{error}</p> : null}

        <div className="ws-actions">
          <button type="submit" className="ws-btn ws-btn--primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save & open production copy'}
          </button>
        </div>
      </form>
      {/* keep helper referenced for tree-shaking clarity */}
    </div>
  )
}
