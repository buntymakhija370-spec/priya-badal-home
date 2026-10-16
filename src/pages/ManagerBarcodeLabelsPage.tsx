import { useEffect, useMemo, useRef } from 'react'
import { Link, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import JsBarcode from 'jsbarcode'
import { BackLink } from '../components/workshop/WorkshopUi'
import { fetchOrderDetail, type WorkshopAuth } from '../lib/workshopClient'
import { stageLabel, type WorkshopOrder } from '../lib/workshopTypes'
import { useCallback, useState } from 'react'
import './WorkersApp.css'
import './BarcodeLabels.css'

type Ctx = { auth: WorkshopAuth | null }

function BarcodeSvg({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement | null>(null)
  useEffect(() => {
    if (!ref.current || !value) return
    try {
      JsBarcode(ref.current, value, {
        format: 'CODE128',
        displayValue: true,
        fontSize: 12,
        height: 56,
        margin: 4,
        background: '#ffffff',
        lineColor: '#111111',
      })
    } catch {
      /* ignore invalid */
    }
  }, [value])
  return <svg ref={ref} className="ws-barcode-svg" role="img" aria-label={value} />
}

export function ManagerBarcodeLabelsPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { auth } = useOutletContext<Ctx>()
  const pin = auth?.role === 'manager' ? auth.pin : ''
  const [params] = useSearchParams()
  const [order, setOrder] = useState<WorkshopOrder | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const autoPrint = params.get('print') === '1'

  const refresh = useCallback(async () => {
    if (!pin || !orderId) return
    const detail = await fetchOrderDetail(pin, orderId)
    setOrder(detail.order)
  }, [pin, orderId])

  useEffect(() => {
    void refresh().catch((e) => setMsg(e instanceof Error ? e.message : 'Load failed'))
  }, [refresh])

  useEffect(() => {
    if (!autoPrint || !order) return
    const t = window.setTimeout(() => window.print(), 600)
    return () => window.clearTimeout(t)
  }, [autoPrint, order])

  const labels = useMemo(() => order?.stages ?? [], [order])

  if (!auth || auth.role !== 'manager') return null
  if (!order) {
    return (
      <main className="ws-detail">
        <BackLink to="/workers/manage?tab=orders" label="Orders" />
        <p className="ws-muted">{msg || 'Loading labels…'}</p>
      </main>
    )
  }

  return (
    <main className="ws-labels">
      <header className="ws-labels__toolbar no-print">
        <BackLink to={`/workers/manage/orders/${order.id}`} label="Order" />
        <div>
          <h2>Print barcodes — {order.orderNo}</h2>
          <p className="ws-muted">
            One label per department. Stick on the job / panel, then workers scan to claim work.
          </p>
        </div>
        <button type="button" className="ws__primary" onClick={() => window.print()}>
          Print labels
        </button>
      </header>

      {msg && <p className="ws-banner no-print">{msg}</p>}

      <div className="ws-labels__sheet">
        {labels.map((stage) => (
          <article key={stage.stageId} className="ws-label-card">
            <div className="ws-label-card__head">
              <strong>{order.orderNo}</strong>
              <span>{stageLabel(stage.stageId)}</span>
            </div>
            <p className="ws-label-card__product">{order.productLabel}</p>
            <p className="ws-label-card__customer">{order.customerName}</p>
            <BarcodeSvg value={stage.barcode} />
            <p className="ws-label-card__code">{stage.barcode}</p>
          </article>
        ))}
      </div>

      <p className="ws-muted no-print" style={{ marginTop: '1rem' }}>
        Tip: after printing, go to worker app → <Link to="/workers">Scan barcode</Link> (workers use
        Scan on their home menu).
      </p>
    </main>
  )
}
