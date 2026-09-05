import { useEffect, useMemo, useState } from 'react'
import { WHATSAPP_CHAT_URL } from '../../lib/whatsapp'
import { DEMO_MATERIAL_TEXT, parseMaterialRequisition } from '../../lib/cutRecordParser'
import {
  inventoryWhatsAppText,
  makeDailyUpdate,
  type WorkshopProject as LibProject,
} from '../../lib/projectInventory'
import {
  createProject,
  deleteProject,
  fetchProjects,
  postProjectUpdate,
  updateProject,
} from '../api'
import type { WorkshopProject } from '../types'

export function WorkshopProjectsPage() {
  const [projects, setProjects] = useState<WorkshopProject[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  // new project form
  const [newName, setNewName] = useState('')
  const [newClient, setNewClient] = useState('')
  const [newOrderNo, setNewOrderNo] = useState('')

  // daily paste form
  const [materialText, setMaterialText] = useState(DEMO_MATERIAL_TEXT)
  const [sawWidthMm, setSawWidthMm] = useState(9)
  const [utilizationPercent, setUtilizationPercent] = useState(81.45)
  const [updateNotes, setUpdateNotes] = useState('')
  const [postedBy, setPostedBy] = useState('Operator')

  const selected = projects.find((p) => p.id === selectedId) || null
  const previewBoards = useMemo(() => parseMaterialRequisition(materialText), [materialText])

  async function reload() {
    const res = await fetchProjects()
    setProjects(res.projects || [])
  }

  useEffect(() => {
    void reload().catch((e: Error) => setError(e.message))
  }, [])

  async function onCreateProject() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (!newName.trim()) throw new Error('Enter project name')
      const project = await createProject({
        name: newName.trim(),
        clientName: newClient.trim(),
        orderNo: newOrderNo.trim() || undefined,
      })
      setNewName('')
      setNewClient('')
      setNewOrderNo('')
      setSelectedId(project.id)
      setMessage('Project created — paste today’s cutting list below')
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create project')
    } finally {
      setBusy(false)
    }
  }

  async function onPostUpdate() {
    if (!selected) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (!previewBoards.length) {
        throw new Error('Paste cutting list from your software first')
      }
      const draft = makeDailyUpdate({
        materialText,
        sawWidthMm,
        utilizationPercent,
        notes: updateNotes,
        postedBy,
      })
      const res = await postProjectUpdate(selected.id, {
        materialText: draft.materialText,
        sawWidthMm: draft.sawWidthMm,
        utilizationPercent: draft.utilizationPercent,
        notes: draft.notes,
        postedBy: draft.postedBy,
        date: draft.date,
        boards: draft.boards,
        totals: draft.totals,
      })
      setSelectedId(res.project.id)
      setUpdateNotes('')
      setMessage(`Saved today’s update · ${draft.totals.totalSheets} sheets added to project inventory`)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save update')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ws-projects">
      <div className="ws-page-head">
        <div>
          <h1>Project inventory</h1>
          <p>
            Day-to-day cutting list paste. One person posts — software manages plywood, inner
            laminate, outer laminate, and totals for that project.
          </p>
        </div>
        {selected ? (
          <div className="ws-actions">
            <button
              type="button"
              className="ws-btn ws-btn--ghost no-print"
              onClick={() =>
                void navigator.clipboard?.writeText(inventoryWhatsAppText(selected as unknown as LibProject))
              }
            >
              Copy inventory
            </button>
            <button
              type="button"
              className="ws-btn ws-btn--ghost no-print"
              onClick={() => {
                window.open(
                  `${WHATSAPP_CHAT_URL}?text=${encodeURIComponent(inventoryWhatsAppText(selected as unknown as LibProject))}`,
                  '_blank',
                  'noopener,noreferrer',
                )
              }}
            >
              WhatsApp
            </button>
            <button type="button" className="ws-btn ws-btn--print no-print" onClick={() => window.print()}>
              Print
            </button>
          </div>
        ) : null}
      </div>

      {error ? <p className="ws-error">{error}</p> : null}
      {message ? <p className="ws-hint">{message}</p> : null}

      <div className="ws-projects__grid">
        <aside className="ws-card no-print">
          <h2>Projects</h2>
          <ul className="ws-cut-list">
            {projects.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={p.id === selectedId ? 'is-active' : undefined}
                  onClick={() => setSelectedId(p.id)}
                >
                  <strong>{p.name}</strong>
                  <span>
                    {p.clientName || 'No client'} · {p.inventory.totalSheets} sheets · {p.dailyUpdates.length}{' '}
                    posts
                  </span>
                </button>
              </li>
            ))}
            {!projects.length ? <li className="ws-hint">No projects yet — create one below.</li> : null}
          </ul>

          <h2>New project</h2>
          <label>
            Project name
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Sharma kitchen" />
          </label>
          <label>
            Client
            <input value={newClient} onChange={(e) => setNewClient(e.target.value)} />
          </label>
          <label>
            Order no.
            <input value={newOrderNo} onChange={(e) => setNewOrderNo(e.target.value)} placeholder="PBH-1002" />
          </label>
          <button type="button" className="ws-btn ws-btn--primary" disabled={busy} onClick={() => void onCreateProject()}>
            Create project
          </button>
        </aside>

        <section className="ws-projects__main">
          {!selected ? (
            <div className="ws-card">
              <h2>Select or create a project</h2>
              <p className="ws-hint">
                Each project keeps its own plywood + laminate inventory. Operator pastes cutting list
                every day; software adds it up.
              </p>
            </div>
          ) : (
            <>
              <div className="ws-card">
                <div className="ws-projects__head">
                  <div>
                    <p className="ws-eyebrow">{selected.status.replace('_', ' ')}</p>
                    <h2>{selected.name}</h2>
                    <p className="ws-hint">
                      {selected.clientName || '—'}
                      {selected.orderNo ? ` · ${selected.orderNo}` : ''}
                    </p>
                  </div>
                  <div className="ws-actions no-print">
                    <select
                      value={selected.status}
                      onChange={(e) =>
                        void updateProject(selected.id, {
                          status: e.target.value as WorkshopProject['status'],
                        }).then(reload)
                      }
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In progress</option>
                      <option value="on_hold">On hold</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button
                      type="button"
                      className="ws-btn ws-btn--ghost"
                      onClick={() =>
                        void deleteProject(selected.id).then(async () => {
                          setSelectedId(null)
                          await reload()
                        })
                      }
                    >
                      Delete project
                    </button>
                  </div>
                </div>

                <div className="ws-modular__kpi-grid">
                  <div>
                    <span>Total sheets</span>
                    <strong>{selected.inventory.totalSheets}</strong>
                    <em>~ {selected.inventory.totalAreaSqft} sqft</em>
                  </div>
                  <div>
                    <span>Inner laminate</span>
                    <strong>
                      {Object.values(selected.inventory.innerByCode).reduce((a, b) => a + b, 0)}
                    </strong>
                    <em>boards</em>
                  </div>
                  <div>
                    <span>Outer laminate</span>
                    <strong>
                      {Object.values(selected.inventory.outerByCode).reduce((a, b) => a + b, 0)}
                    </strong>
                    <em>boards</em>
                  </div>
                  <div>
                    <span>Daily posts</span>
                    <strong>{selected.dailyUpdates.length}</strong>
                    <em>updates</em>
                  </div>
                </div>
              </div>

              <div className="ws-card no-print">
                <h2>Today — paste cutting list</h2>
                <label>
                  Material text from cutting software
                  <textarea
                    rows={6}
                    value={materialText}
                    onChange={(e) => setMaterialText(e.target.value)}
                    placeholder="Size:2440×1220×8,Quantity:32 Inner 809, ..."
                  />
                </label>
                <p className="ws-hint">
                  Parsed lines: <strong>{previewBoards.length}</strong>
                  {' · '}
                  <button type="button" className="ws-linkish" onClick={() => setMaterialText(DEMO_MATERIAL_TEXT)}>
                    Load sample
                  </button>
                </p>
                <div className="ws-modular__row3">
                  <label>
                    Saw width mm
                    <input
                      type="number"
                      value={sawWidthMm}
                      onChange={(e) => setSawWidthMm(Number(e.target.value) || 0)}
                    />
                  </label>
                  <label>
                    Utilization %
                    <input
                      type="number"
                      step={0.01}
                      value={utilizationPercent}
                      onChange={(e) => setUtilizationPercent(Number(e.target.value) || 0)}
                    />
                  </label>
                  <label>
                    Posted by
                    <input value={postedBy} onChange={(e) => setPostedBy(e.target.value)} />
                  </label>
                </div>
                <label>
                  Notes
                  <textarea rows={2} value={updateNotes} onChange={(e) => setUpdateNotes(e.target.value)} />
                </label>
                <button
                  type="button"
                  className="ws-btn ws-btn--primary"
                  disabled={busy}
                  onClick={() => void onPostUpdate()}
                >
                  {busy ? 'Saving…' : 'Post today’s cutting update'}
                </button>
              </div>

              <div className="ws-card">
                <h2>Project inventory (managed by software)</h2>
                <div className="ws-inv-grid">
                  <InvTable title="Plywood by thickness" rows={selected.inventory.plywoodByThickness} unit="sheets" />
                  <InvTable title="Inner laminate codes" rows={selected.inventory.innerByCode} unit="boards" />
                  <InvTable title="Outer laminate codes" rows={selected.inventory.outerByCode} unit="boards" />
                  <InvTable title="Both-side laminate" rows={selected.inventory.bothByCode} unit="boards" />
                </div>
                {selected.inventory.plainSheets ? (
                  <p className="ws-hint">Plain / other boards: {selected.inventory.plainSheets}</p>
                ) : null}
              </div>

              <div className="ws-card">
                <h2>Daily history</h2>
                {!selected.dailyUpdates.length ? (
                  <p className="ws-hint">No cutting posts yet for this project.</p>
                ) : (
                  <div className="ws-table-wrap">
                    <table className="ws-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>By</th>
                          <th>Sheets</th>
                          <th>Inner</th>
                          <th>Outer</th>
                          <th>Util %</th>
                          <th>Saw</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.dailyUpdates.map((u) => (
                          <tr key={u.id}>
                            <td>{u.date}</td>
                            <td>{u.postedBy || '—'}</td>
                            <td>{u.totals.totalSheets}</td>
                            <td>{u.totals.byFace.inner}</td>
                            <td>{u.totals.byFace.outer}</td>
                            <td>{u.utilizationPercent}%</td>
                            <td>{u.sawWidthMm} mm</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

function InvTable({
  title,
  rows,
  unit,
}: {
  title: string
  rows: Record<string, number>
  unit: string
}) {
  const entries = Object.entries(rows)
  return (
    <div className="ws-inv-card">
      <h3>{title}</h3>
      {!entries.length ? <p className="ws-hint">None yet</p> : null}
      <ul>
        {entries.map(([k, v]) => (
          <li key={k}>
            <span>{k}</span>
            <strong>
              {v} {unit}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  )
}
