import { useEffect, useMemo, useState } from 'react'
import { WHATSAPP_CHAT_URL } from '../../lib/whatsapp'
import {
  DEMO_MATERIAL_TEXT,
  buildCutRecord,
  cutRecordWhatsAppText,
  parseMaterialRequisition,
  type CutRecordParsed,
} from '../../lib/cutRecordParser'
import { deleteCutRecord, fetchCutRecords, saveCutRecord } from '../api'
import type { CutRecord } from '../types'

export function WorkshopCutRecordsPage() {
  const [jobName, setJobName] = useState('Modular cut job')
  const [orderNo, setOrderNo] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [materialText, setMaterialText] = useState(DEMO_MATERIAL_TEXT)
  const [sawWidthMm, setSawWidthMm] = useState(9)
  const [utilizationPercent, setUtilizationPercent] = useState(81.45)
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState<CutRecord[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const preview = useMemo(
    () =>
      buildCutRecord({
        jobName,
        materialText,
        sawWidthMm,
        utilizationPercent,
        notes,
        orderNo: orderNo || undefined,
        customerName: customerName || undefined,
      }),
    [jobName, materialText, sawWidthMm, utilizationPercent, notes, orderNo, customerName],
  )

  async function reload() {
    const res = await fetchCutRecords()
    setSaved(res.cutRecords || [])
  }

  useEffect(() => {
    void reload().catch((e: Error) => setError(e.message))
  }, [])

  async function onSave() {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      if (!preview.boards.length) {
        throw new Error('Paste material text from your cutting software first')
      }
      const record = await saveCutRecord({
        jobName: preview.jobName,
        materialText: preview.materialText,
        sawWidthMm: preview.sawWidthMm,
        utilizationPercent: preview.utilizationPercent,
        notes: preview.notes,
        orderNo: preview.orderNo,
        customerName: preview.customerName,
        boards: preview.boards,
        totals: preview.totals,
      })
      setMessage('Cut record saved for supervisor tracking')
      setSelectedId(record.id)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const selected = saved.find((r) => r.id === selectedId) || null

  return (
    <div className="ws-cuts">
      <div className="ws-page-head">
        <div>
          <h1>Cut records tracker</h1>
          <p>
            Paste the material list from your cutting software. Track Inner / Outer / Both laminate
            boards, saw width, and utilization for your supervisor.
          </p>
        </div>
        <div className="ws-actions">
          <button
            type="button"
            className="ws-btn ws-btn--ghost no-print"
            onClick={() => void navigator.clipboard?.writeText(cutRecordWhatsAppText(preview))}
          >
            Copy sheet
          </button>
          <button
            type="button"
            className="ws-btn ws-btn--ghost no-print"
            onClick={() => {
              window.open(
                `${WHATSAPP_CHAT_URL}?text=${encodeURIComponent(cutRecordWhatsAppText(preview))}`,
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
      </div>

      <div className="ws-modular__grid">
        <section className="ws-card ws-modular__form no-print">
          <h2>1. Paste from cutting software</h2>
          <label>
            Material requisition text
            <textarea
              rows={7}
              value={materialText}
              onChange={(e) => setMaterialText(e.target.value)}
              placeholder="Size:2440×1220×8,Quantity:32 Inner 809, Size:..."
            />
          </label>
          <p className="ws-hint">
            Parsed lines: <strong>{parseMaterialRequisition(materialText).length}</strong>
            {' · '}
            <button
              type="button"
              className="ws-linkish"
              onClick={() => {
                setMaterialText(DEMO_MATERIAL_TEXT)
                setSawWidthMm(9)
                setUtilizationPercent(81.45)
              }}
            >
              Load your software sample
            </button>
          </p>

          <h2>2. Job info</h2>
          <label>
            Job name
            <input value={jobName} onChange={(e) => setJobName(e.target.value)} />
          </label>
          <div className="ws-modular__row3">
            <label>
              Order no.
              <input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="PBH-1002" />
            </label>
            <label>
              Client
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </label>
            <label>
              Saw width mm
              <input
                type="number"
                min={0}
                step={0.1}
                value={sawWidthMm}
                onChange={(e) => setSawWidthMm(Number(e.target.value) || 0)}
              />
            </label>
          </div>
          <label>
            Total utilization %
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={utilizationPercent}
              onChange={(e) => setUtilizationPercent(Number(e.target.value) || 0)}
            />
          </label>
          <label>
            Notes
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>

          {error ? <p className="ws-error">{error}</p> : null}
          {message ? <p className="ws-hint">{message}</p> : null}

          <button type="button" className="ws-btn ws-btn--primary" disabled={saving} onClick={() => void onSave()}>
            {saving ? 'Saving…' : 'Save cut record'}
          </button>
        </section>

        <section className="ws-modular__result">
          <SummaryCard title="Parsed preview" record={preview} />

          <div className="ws-card">
            <h2>Board lines</h2>
            <div className="ws-table-wrap">
              <table className="ws-table">
                <thead>
                  <tr>
                    <th>Size (mm)</th>
                    <th>Qty</th>
                    <th>Face</th>
                    <th>Code</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.boards.map((b, i) => (
                    <tr key={`${b.raw}-${i}`}>
                      <td>
                        {b.lengthMm}×{b.widthMm}×{b.thicknessMm}
                      </td>
                      <td>{b.quantity}</td>
                      <td className={`ws-face--${b.face}`}>{b.face}</td>
                      <td>{b.materialCode || '—'}</td>
                    </tr>
                  ))}
                  {!preview.boards.length ? (
                    <tr>
                      <td colSpan={4}>Paste software text to see boards</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="ws-card">
            <h2>Saved records</h2>
            {!saved.length ? <p className="ws-hint">No saved cut records yet.</p> : null}
            <ul className="ws-cut-list">
              {saved.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className={r.id === selectedId ? 'is-active' : undefined}
                    onClick={() => setSelectedId(r.id)}
                  >
                    <strong>{r.jobName}</strong>
                    <span>
                      {r.totals.totalSheets} sheets · {r.utilizationPercent}% · Inner{' '}
                      {r.totals.byFace.inner} / Outer {r.totals.byFace.outer}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="ws-btn ws-btn--ghost"
                    onClick={() =>
                      void deleteCutRecord(r.id).then(async () => {
                        if (selectedId === r.id) setSelectedId(null)
                        await reload()
                      })
                    }
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
            {selected ? (
              <SummaryCard
                title="Selected saved record"
                record={{
                  id: selected.id,
                  jobName: selected.jobName,
                  materialText: selected.materialText,
                  sawWidthMm: selected.sawWidthMm,
                  utilizationPercent: selected.utilizationPercent,
                  notes: selected.notes,
                  orderNo: selected.orderNo,
                  customerName: selected.customerName,
                  createdAt: selected.createdAt,
                  updatedAt: selected.updatedAt,
                  boards: selected.boards,
                  totals: selected.totals,
                }}
              />
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}

function SummaryCard({ title, record }: { title: string; record: CutRecordParsed }) {
  return (
    <div className="ws-card ws-modular__kpis">
      <h2>{title}</h2>
      <div className="ws-modular__kpi-grid">
        <div>
          <span>Total sheets</span>
          <strong>{record.totals.totalSheets}</strong>
          <em>~ {record.totals.areaSqft} sqft</em>
        </div>
        <div>
          <span>Inner laminate</span>
          <strong>{record.totals.byFace.inner}</strong>
          <em>boards</em>
        </div>
        <div>
          <span>Outer laminate</span>
          <strong>{record.totals.byFace.outer}</strong>
          <em>boards</em>
        </div>
        <div>
          <span>Utilization</span>
          <strong>{record.utilizationPercent}%</strong>
          <em>Saw {record.sawWidthMm} mm</em>
        </div>
      </div>
      <ul className="ws-modular__summary">
        <li>
          Both-side: {record.totals.byFace.both} · Plain/other: {record.totals.byFace.plain}
        </li>
        {Object.entries(record.totals.byMaterial).map(([k, v]) => (
          <li key={k}>
            {k}: {v} sheets
          </li>
        ))}
      </ul>
    </div>
  )
}
