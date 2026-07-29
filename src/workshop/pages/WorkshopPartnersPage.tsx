import { type FormEvent, useEffect, useState } from 'react'
import { fetchWorkshopDb, upsertPartner } from '../api'
import type { Partner, WorkshopDb } from '../types'

export function WorkshopPartnersPage() {
  const [db, setDb] = useState<WorkshopDb | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const reload = () => fetchWorkshopDb().then(setDb)

  useEffect(() => {
    reload().catch(() => undefined)
  }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !phone.trim()) {
      setError('Name and phone required')
      return
    }
    const partner: Partner = {
      id: `partner_${crypto.randomUUID().slice(0, 8)}`,
      name: name.trim(),
      phone: phone.trim(),
      city: city.trim() || '—',
      active: true,
      notes: notes.trim() || undefined,
    }
    try {
      await upsertPartner(partner)
      setName('')
      setPhone('')
      setCity('')
      setNotes('')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  return (
    <div>
      <div className="ws-page-head">
        <div>
          <h1>Channel partners</h1>
          <p>Offline / dealer orders are tagged to a partner and flow into the same workshop</p>
        </div>
      </div>

      <div className="ws-stack">
        <form className="ws-card ws-form" onSubmit={onSubmit}>
          <h2>Add partner</h2>
          <div className="ws-form__row">
            <div className="ws-field">
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="ws-field">
              <label>Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="ws-form__row">
            <div className="ws-field">
              <label>City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="ws-field">
              <label>Notes</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          {error ? <p style={{ color: '#8a3b2b', margin: 0 }}>{error}</p> : null}
          <button type="submit" className="ws-btn ws-btn--primary">
            Save partner
          </button>
        </form>

        <div className="ws-card">
          <h2>Partner list</h2>
          {(db?.partners || []).length === 0 ? (
            <p className="ws-empty">No partners yet.</p>
          ) : (
            <table className="ws-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {(db?.partners || []).map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.phone}</td>
                    <td>{p.city}</td>
                    <td>
                      <span className={p.active ? 'ws-pill ws-pill--ok' : 'ws-pill'}>
                        {p.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
