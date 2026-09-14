import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import {
  BackLink,
  EventTimeline,
  PriorityBadge,
  StatusPill,
} from '../components/workshop/WorkshopUi'
import { WORK_STAGES, stageLabel, type WorkerRole } from '../lib/workshopTypes'
import {
  fetchWorkerDetail,
  updateWorkshopWorker,
  type WorkerDetailResponse,
  type WorkshopAuth,
} from '../lib/workshopClient'
import './WorkersApp.css'

type Ctx = { auth: WorkshopAuth | null }

const BAYS = [
  'Bay A',
  'Bay B',
  'Bay C',
  'Bay D',
  'Polish room',
  'Dispatch dock',
  'CNC cell',
  'Assembly',
  'Paint booth',
]

const ROLE_OPTIONS: { id: WorkerRole; label: string }[] = [
  ...WORK_STAGES.map((s) => ({ id: s.id as WorkerRole, label: s.label })),
  { id: 'multi', label: 'Multi-skill' },
]

export function ManagerWorkerDetailPage() {
  const { workerId } = useParams<{ workerId: string }>()
  const { auth } = useOutletContext<Ctx>()
  const pin = auth?.role === 'manager' ? auth.pin : ''

  const [detail, setDetail] = useState<WorkerDetailResponse | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [showPin, setShowPin] = useState(false)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [role, setRole] = useState<WorkerRole>('multi')
  const [bay, setBay] = useState('')
  const [phone, setPhone] = useState('')
  const [workerPin, setWorkerPin] = useState('')
  const [active, setActive] = useState(true)

  const refresh = useCallback(async () => {
    if (!pin || !workerId) return
    const data = await fetchWorkerDetail(pin, workerId)
    setDetail(data)
    if (!editing) {
      setName(data.worker.name)
      setCode(data.worker.code)
      setRole(data.worker.role)
      setBay(data.worker.bay || '')
      setPhone(data.worker.phone || '')
      setWorkerPin(data.worker.pin)
      setActive(data.worker.active)
    }
  }, [pin, workerId, editing])

  useEffect(() => {
    void refresh().catch((e) => setMsg(e instanceof Error ? e.message : 'Load failed'))
    const t = window.setInterval(() => void refresh().catch(() => {}), 4000)
    return () => window.clearInterval(t)
  }, [refresh])

  function openCustomise() {
    if (!detail) return
    setName(detail.worker.name)
    setCode(detail.worker.code)
    setRole(detail.worker.role)
    setBay(detail.worker.bay || '')
    setPhone(detail.worker.phone || '')
    setWorkerPin(detail.worker.pin)
    setActive(detail.worker.active)
    setEditing(true)
    setMsg(null)
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!pin || !workerId) return
    setBusy(true)
    setMsg(null)
    try {
      await updateWorkshopWorker(pin, {
        workerId,
        name,
        code,
        role,
        bay,
        phone,
        pin: workerPin,
        active,
      })
      setEditing(false)
      setMsg('Worker information updated')
      await refresh()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not save worker')
    } finally {
      setBusy(false)
    }
  }

  if (!auth || auth.role !== 'manager') return null
  if (!detail) {
    return (
      <main className="ws-detail">
        <BackLink to="/workers/manage?tab=workers" label="Workers" />
        <p className="ws-muted">Loading worker…</p>
      </main>
    )
  }

  const { worker, activeJobs, completedJobs, events } = detail

  return (
    <main className="ws-detail">
      <header className="ws-detail-head ws-detail-head--sticky">
        <BackLink to="/workers/manage?tab=workers" label="Workers" />
        <div className="ws-detail-head__title">
          <h2>
            {worker.code} · {worker.name}
          </h2>
          <p className="ws-muted">
            {worker.role.replace(/_/g, ' ')} · {worker.bay || 'No bay'}
            {!worker.active ? ' · Inactive' : ''}
          </p>
        </div>
        {!editing && (
          <button type="button" className="ws__secondary" onClick={openCustomise}>
            Customise worker information
          </button>
        )}
      </header>

      {msg && <p className="ws-banner">{msg}</p>}

      {editing ? (
        <section className="ws-panel">
          <h3>Customise worker information</h3>
          <form className="ws-form" onSubmit={onSave}>
            <div className="ws-form__row">
              <label>
                Worker code
                <input value={code} onChange={(e) => setCode(e.target.value)} required />
              </label>
              <label>
                Name
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
            </div>
            <div className="ws-form__row">
              <label>
                Role / skill
                <select value={role} onChange={(e) => setRole(e.target.value as WorkerRole)}>
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
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
            </div>
            <div className="ws-form__row">
              <label>
                Phone
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                />
              </label>
              <label>
                Login PIN (4 digits)
                <input
                  value={workerPin}
                  onChange={(e) => setWorkerPin(e.target.value)}
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  required
                />
              </label>
            </div>
            <label className="ws-check">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Active on floor (can log in and take jobs)
            </label>
            <div className="ws-form__actions">
              <button type="submit" className="ws__primary" disabled={busy}>
                {busy ? 'Saving…' : 'Save worker information'}
              </button>
              <button
                type="button"
                className="ws__ghost"
                disabled={busy}
                onClick={() => {
                  setEditing(false)
                  setMsg(null)
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="ws-panel ws-profile">
          <div className="ws-panel__head">
            <h3>Profile</h3>
            <button type="button" className="ws__ghost ws__ghost--sm" onClick={openCustomise}>
              Customise
            </button>
          </div>
          <dl className="ws-meta">
            <div>
              <dt>Code</dt>
              <dd>{worker.code}</dd>
            </div>
            <div>
              <dt>Name</dt>
              <dd>{worker.name}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{worker.role.replace(/_/g, ' ')}</dd>
            </div>
            <div>
              <dt>Bay</dt>
              <dd>{worker.bay || '—'}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{worker.phone || '—'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{worker.active ? 'Active' : 'Inactive'}</dd>
            </div>
            <div>
              <dt>PIN</dt>
              <dd>
                <button type="button" className="ws__ghost" onClick={() => setShowPin((v) => !v)}>
                  {showPin ? worker.pin : '••••'}
                </button>
              </dd>
            </div>
          </dl>
        </section>
      )}

      <section className="ws-panel">
        <h3>Active jobs ({activeJobs.length})</h3>
        {activeJobs.length === 0 ? (
          <p className="ws-muted">No active assignments.</p>
        ) : (
          <ul className="ws-jobs ws-jobs--compact">
            {activeJobs.map((j) => (
              <li key={`${j.order.id}-${j.stage.stageId}`}>
                <Link to={`/workers/manage/orders/${j.order.id}`} className="ws-job-link">
                  <div className="ws-job-link__head">
                    <strong>{j.order.orderNo}</strong>
                    <PriorityBadge priority={j.order.priority} />
                    <StatusPill status={j.stage.status} />
                  </div>
                  <p>{j.order.productLabel}</p>
                  <p className="ws-muted">
                    {stageLabel(j.stage.stageId)} · {j.stage.statement || 'No statement yet'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ws-panel">
        <h3>Completed history</h3>
        {completedJobs.length === 0 ? (
          <p className="ws-muted">No completed stages yet.</p>
        ) : (
          <ul className="ws-jobs ws-jobs--compact">
            {completedJobs.map((j) => (
              <li key={`${j.order.id}-${j.stage.stageId}-done`}>
                <Link to={`/workers/manage/orders/${j.order.id}`} className="ws-job-link">
                  <strong>{j.order.orderNo}</strong>
                  <p className="ws-muted">
                    {stageLabel(j.stage.stageId)} ·{' '}
                    {j.completedAt
                      ? new Date(j.completedAt).toLocaleString()
                      : j.stage.completedAt
                        ? new Date(j.stage.completedAt).toLocaleString()
                        : '—'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ws-panel">
        <h3>Personal activity</h3>
        <EventTimeline events={events} />
      </section>
    </main>
  )
}
