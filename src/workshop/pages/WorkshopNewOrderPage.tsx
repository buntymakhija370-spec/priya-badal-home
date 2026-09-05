import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createOrder, fetchWorkshopDb } from '../api'
import { summarizeLineFinish } from '../jobSheet'
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
  widthFt: undefined,
  heightFt: undefined,
  depthFt: undefined,
  thicknessMm: undefined,
  finishType: 'laminate',
  coatingColor: '',
  coatingCode: '',
  innerLaminate: '',
  outerLaminate: '',
  leatherCode: '',
  leatherColor: '',
  viewSide: 'both',
  finish: '',
})

function patchLine(lines: DraftLine[], idx: number, patch: Partial<DraftLine>): DraftLine[] {
  const next = [...lines]
  const merged = { ...next[idx], ...patch }
  merged.finish = summarizeLineFinish(merged)
  next[idx] = merged
  return next
}

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
    const validLines = lines.filter((l) => l.productName.trim())
    if (!validLines.length) {
      setError('Add at least one product in this order.')
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
        lines: validLines.map((l) => ({
          ...l,
          qty: Number(l.qty) || 1,
          unitPrice: Number(l.unitPrice) || 0,
          thicknessMm: l.thicknessMm ? Number(l.thicknessMm) : undefined,
          widthFt: l.widthFt ? Number(l.widthFt) : undefined,
          heightFt: l.heightFt ? Number(l.heightFt) : undefined,
          depthFt: l.depthFt ? Number(l.depthFt) : undefined,
          finish: summarizeLineFinish(l) || l.finish || undefined,
          coatingColor: l.coatingColor?.trim() || undefined,
          coatingCode: l.coatingCode?.trim() || undefined,
          innerLaminate: l.innerLaminate?.trim() || undefined,
          outerLaminate: l.outerLaminate?.trim() || undefined,
          leatherCode: l.leatherCode?.trim() || undefined,
          leatherColor: l.leatherColor?.trim() || undefined,
          notes: l.notes?.trim() || undefined,
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
          <h1>New client order</h1>
          <p>
            One order for one client. Add multiple products inside it — each product can have its
            own coating colour/number, laminate, leather, thickness and view.
          </p>
        </div>
        <Link className="ws-btn ws-btn--ghost" to="/workshop/orders">
          Back to orders
        </Link>
      </div>

      <form className="ws-card ws-form" onSubmit={(e) => void onSubmit(e)}>
        <h2 className="ws-section-title">Client</h2>
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
            <label>Client name</label>
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

        <h2 className="ws-section-title">Products in this one order</h2>
        <p className="ws-hint">
          Same client order can hold many products. Example: shutter with laminate + wardrobe with
          coating colour + panel with leather — all inside this single order.
        </p>

        <div className="ws-product-list">
          {lines.map((line, idx) => (
            <section className="ws-product-card" key={idx}>
              <div className="ws-product-card__head">
                <h3>Product {idx + 1}</h3>
                <button
                  type="button"
                  className="ws-btn ws-btn--ghost"
                  disabled={lines.length === 1}
                  onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                >
                  Remove product
                </button>
              </div>

              <div className="ws-form__row">
                <div className="ws-field">
                  <label>Product name</label>
                  <input
                    value={line.productName}
                    onChange={(e) => setLines(patchLine(lines, idx, { productName: e.target.value }))}
                    placeholder="e.g. Kitchen shutter / Wardrobe door"
                    required={idx === 0}
                  />
                </div>
                <div className="ws-field">
                  <label>Category</label>
                  <input
                    value={line.category || ''}
                    onChange={(e) => setLines(patchLine(lines, idx, { category: e.target.value }))}
                    placeholder="Kitchen / Wardrobe / TV unit"
                  />
                </div>
              </div>

              <div className="ws-form__row3">
                <div className="ws-field">
                  <label>Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={line.qty}
                    onChange={(e) => setLines(patchLine(lines, idx, { qty: Number(e.target.value) }))}
                  />
                </div>
                <div className="ws-field">
                  <label>Thickness (mm)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={line.thicknessMm ?? ''}
                    onChange={(e) =>
                      setLines(
                        patchLine(lines, idx, {
                          thicknessMm: e.target.value ? Number(e.target.value) : undefined,
                        }),
                      )
                    }
                    placeholder="8 / 12 / 17 / 18"
                  />
                </div>
                <div className="ws-field">
                  <label>Unit ₹</label>
                  <input
                    type="number"
                    min={0}
                    value={line.unitPrice}
                    onChange={(e) =>
                      setLines(patchLine(lines, idx, { unitPrice: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>

              <div className="ws-form__row3">
                <div className="ws-field">
                  <label>Width (ft)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={line.widthFt ?? ''}
                    onChange={(e) =>
                      setLines(
                        patchLine(lines, idx, {
                          widthFt: e.target.value ? Number(e.target.value) : undefined,
                        }),
                      )
                    }
                  />
                </div>
                <div className="ws-field">
                  <label>Height (ft)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={line.heightFt ?? ''}
                    onChange={(e) =>
                      setLines(
                        patchLine(lines, idx, {
                          heightFt: e.target.value ? Number(e.target.value) : undefined,
                        }),
                      )
                    }
                  />
                </div>
                <div className="ws-field">
                  <label>Depth (ft)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={line.depthFt ?? ''}
                    onChange={(e) =>
                      setLines(
                        patchLine(lines, idx, {
                          depthFt: e.target.value ? Number(e.target.value) : undefined,
                        }),
                      )
                    }
                  />
                </div>
              </div>

              <div className="ws-form__row">
                <div className="ws-field">
                  <label>Finish type</label>
                  <select
                    value={line.finishType || 'laminate'}
                    onChange={(e) =>
                      setLines(
                        patchLine(lines, idx, {
                          finishType: e.target.value as DraftLine['finishType'],
                        }),
                      )
                    }
                  >
                    <option value="laminate">Laminate pasting</option>
                    <option value="coating">Colour coating</option>
                    <option value="leather">Leather</option>
                    <option value="mixed">Mixed (coat + laminate / leather)</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="ws-field">
                  <label>View / face</label>
                  <select
                    value={line.viewSide || 'both'}
                    onChange={(e) =>
                      setLines(
                        patchLine(lines, idx, {
                          viewSide: e.target.value as DraftLine['viewSide'],
                        }),
                      )
                    }
                  >
                    <option value="both">Both sides</option>
                    <option value="inner">Inner only</option>
                    <option value="outer">Outer only</option>
                    <option value="na">Not applicable</option>
                  </select>
                </div>
              </div>

              <div className="ws-form__row">
                <div className="ws-field">
                  <label>Coating number / code</label>
                  <input
                    value={line.coatingCode || ''}
                    onChange={(e) => setLines(patchLine(lines, idx, { coatingCode: e.target.value }))}
                    placeholder="e.g. C-12 / PU code"
                  />
                </div>
                <div className="ws-field">
                  <label>Coating colour</label>
                  <input
                    value={line.coatingColor || ''}
                    onChange={(e) => setLines(patchLine(lines, idx, { coatingColor: e.target.value }))}
                    placeholder="e.g. Matt grey / Soft white"
                  />
                </div>
              </div>

              <div className="ws-form__row">
                <div className="ws-field">
                  <label>Inner laminate (paste)</label>
                  <input
                    value={line.innerLaminate || ''}
                    onChange={(e) =>
                      setLines(patchLine(lines, idx, { innerLaminate: e.target.value }))
                    }
                    placeholder="e.g. 809"
                  />
                </div>
                <div className="ws-field">
                  <label>Outer laminate (paste)</label>
                  <input
                    value={line.outerLaminate || ''}
                    onChange={(e) =>
                      setLines(patchLine(lines, idx, { outerLaminate: e.target.value }))
                    }
                    placeholder="e.g. 8378"
                  />
                </div>
              </div>

              <div className="ws-form__row">
                <div className="ws-field">
                  <label>Leather code</label>
                  <input
                    value={line.leatherCode || ''}
                    onChange={(e) => setLines(patchLine(lines, idx, { leatherCode: e.target.value }))}
                    placeholder="If leather finish"
                  />
                </div>
                <div className="ws-field">
                  <label>Leather colour</label>
                  <input
                    value={line.leatherColor || ''}
                    onChange={(e) =>
                      setLines(patchLine(lines, idx, { leatherColor: e.target.value }))
                    }
                    placeholder="e.g. Brown tan"
                  />
                </div>
              </div>

              <div className="ws-field">
                <label>Special instruction for this product</label>
                <textarea
                  rows={2}
                  value={line.notes || ''}
                  onChange={(e) => setLines(patchLine(lines, idx, { notes: e.target.value }))}
                  placeholder="Anything finishing / cutting must follow for this product only"
                />
              </div>

              {summarizeLineFinish(line) ? (
                <p className="ws-product-card__summary">Summary: {summarizeLineFinish(line)}</p>
              ) : null}
            </section>
          ))}
        </div>

        <button
          type="button"
          className="ws-btn ws-btn--primary"
          style={{ marginTop: '0.75rem' }}
          onClick={() => setLines([...lines, blankLine()])}
        >
          + Add another product in this same order
        </button>

        <div className="ws-field" style={{ marginTop: '1rem' }}>
          <label>Order-level production notes</label>
          <textarea
            value={productionNotes}
            onChange={(e) => setProductionNotes(e.target.value)}
            placeholder="Common notes for whole order (delivery, site, packing…)"
          />
        </div>

        <p>
          <strong>
            {lines.filter((l) => l.productName.trim()).length} product(s) · Order total:{' '}
            {formatInr(total)}
          </strong>
          {advancePaid > 0 ? (
            <span style={{ color: '#3a4a40' }}>
              {' '}
              · Balance {formatInr(Math.max(0, total - advancePaid))}
            </span>
          ) : null}
        </p>

        {error ? <p className="ws-error">{error}</p> : null}

        <div className="ws-actions">
          <button type="submit" className="ws-btn ws-btn--primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save client order & open job sheet'}
          </button>
        </div>
      </form>
    </div>
  )
}
