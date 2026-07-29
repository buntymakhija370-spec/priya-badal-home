import { useEffect, useMemo, useState } from 'react'
import { fetchWorkshopDb } from '../api'
import type { WorkshopDb } from '../types'

export function WorkshopDisplayPage() {
  const [db, setDb] = useState<WorkshopDb | null>(null)
  const [clock, setClock] = useState(new Date())

  useEffect(() => {
    const load = () => fetchWorkshopDb().then(setDb).catch(() => undefined)
    load()
    const poll = window.setInterval(load, 8000)
    const tick = window.setInterval(() => setClock(new Date()), 1000)
    return () => {
      window.clearInterval(poll)
      window.clearInterval(tick)
    }
  }, [])

  const boards = useMemo(() => {
    const orders = db?.orders || []
    return {
      production: orders.filter((o) => o.status === 'in_production' || o.status === 'confirmed'),
      qc: orders.filter((o) => o.status === 'qc'),
      ready: orders.filter((o) => o.status === 'ready'),
    }
  }, [db])

  return (
    <div className="ws-display">
      <div className="ws-display__head">
        <div>
          <div style={{ letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.75rem', color: '#9db4b8' }}>
            Priyabadal Homes · Live floor board
          </div>
          <h1 style={{ margin: '0.25rem 0 0', fontFamily: 'var(--font-display, Georgia, serif)' }}>
            Workshop display
          </h1>
        </div>
        <div style={{ textAlign: 'right', color: '#9db4b8' }}>
          <div>{clock.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
          <strong style={{ color: '#e8f0ea', fontSize: '1.4rem' }}>
            {clock.toLocaleTimeString('en-IN')}
          </strong>
        </div>
      </div>

      <div className="ws-display__grid">
        <section>
          <h2 style={{ margin: '0 0 0.65rem', color: '#9db4b8', fontSize: '0.85rem', letterSpacing: '0.1em' }}>
            IN PRODUCTION ({boards.production.length})
          </h2>
          <div className="ws-stack">
            {boards.production.length === 0 ? (
              <div className="ws-display-card">No jobs</div>
            ) : (
              boards.production.map((o) => (
                <div className="ws-display-card" key={o.id}>
                  <h3>{o.orderNo}</h3>
                  <div>{o.customerName}</div>
                  <div style={{ color: '#9db4b8', marginTop: '0.35rem' }}>
                    {o.lines.map((l) => l.productName).join(' · ')}
                  </div>
                  <div style={{ marginTop: '0.45rem', fontSize: '0.85rem' }}>Due {o.dueDate || '—'}</div>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 style={{ margin: '0 0 0.65rem', color: '#9db4b8', fontSize: '0.85rem', letterSpacing: '0.1em' }}>
            QC ({boards.qc.length})
          </h2>
          <div className="ws-stack">
            {boards.qc.length === 0 ? (
              <div className="ws-display-card">No jobs</div>
            ) : (
              boards.qc.map((o) => (
                <div className="ws-display-card" key={o.id}>
                  <h3>{o.orderNo}</h3>
                  <div>{o.customerName}</div>
                  <div style={{ color: '#9db4b8', marginTop: '0.35rem' }}>
                    {o.lines.map((l) => l.productName).join(' · ')}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 style={{ margin: '0 0 0.65rem', color: '#9db4b8', fontSize: '0.85rem', letterSpacing: '0.1em' }}>
            READY / DISPATCH ({boards.ready.length})
          </h2>
          <div className="ws-stack">
            {boards.ready.length === 0 ? (
              <div className="ws-display-card">No jobs</div>
            ) : (
              boards.ready.map((o) => (
                <div className="ws-display-card" key={o.id}>
                  <h3>{o.orderNo}</h3>
                  <div>{o.customerName}</div>
                  <div style={{ color: '#9db4b8', marginTop: '0.35rem' }}>{o.customerCity || 'City TBC'}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
