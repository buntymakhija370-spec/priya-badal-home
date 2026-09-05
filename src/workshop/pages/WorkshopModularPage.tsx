import { useMemo, useState } from 'react'
import { WHATSAPP_CHAT_URL } from '../../lib/whatsapp'
import {
  MODULE_PRESETS,
  calculateModularTakeoff,
  defaultModularInput,
  takeoffWhatsAppText,
  type ModularInput,
  type ModuleKind,
  type PlywoodThicknessMm,
} from '../../lib/modularManufacturing'

function num(v: string, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function WorkshopModularPage() {
  const [input, setInput] = useState<ModularInput>(() => defaultModularInput('wardrobe'))
  const takeoff = useMemo(() => calculateModularTakeoff(input), [input])

  function patch<K extends keyof ModularInput>(key: K, value: ModularInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }))
  }

  function applyPreset(kind: ModuleKind) {
    setInput((prev) => ({
      ...defaultModularInput(kind),
      jobName: prev.jobName,
      notes: prev.notes,
    }))
  }

  return (
    <div className="ws-modular">
      <div className="ws-page-head">
        <div>
          <h1>Modular manufacturing</h1>
          <p>
            Internal supervisor sheet — plywood, inner laminate, outer laminate, hardware. Easy
            takeoff for modular jobs.
          </p>
        </div>
        <div className="ws-actions">
          <button
            type="button"
            className="ws-btn ws-btn--ghost no-print"
            onClick={() => void navigator.clipboard?.writeText(takeoffWhatsAppText(takeoff))}
          >
            Copy sheet
          </button>
          <button
            type="button"
            className="ws-btn ws-btn--ghost no-print"
            onClick={() => {
              window.open(
                `${WHATSAPP_CHAT_URL}?text=${encodeURIComponent(takeoffWhatsAppText(takeoff))}`,
                '_blank',
                'noopener,noreferrer',
              )
            }}
          >
            WhatsApp
          </button>
          <button type="button" className="ws-btn ws-btn--print no-print" onClick={() => window.print()}>
            Print for supervisor
          </button>
        </div>
      </div>

      <div className="ws-modular__grid">
        <section className="ws-card ws-modular__form no-print">
          <h2>1. Choose module</h2>
          <div className="ws-modular__presets">
            {MODULE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`ws-chip ${input.moduleKind === p.id ? 'is-active' : ''}`}
                onClick={() => applyPreset(p.id)}
                title={p.hint}
              >
                {p.label}
              </button>
            ))}
          </div>

          <h2>2. Job details</h2>
          <label>
            Job / client name
            <input
              value={input.jobName}
              onChange={(e) => patch('jobName', e.target.value)}
              placeholder="e.g. Sharma kitchen — base units"
            />
          </label>

          <div className="ws-modular__row3">
            <label>
              Width mm
              <input
                type="number"
                min={200}
                value={input.widthMm}
                onChange={(e) => patch('widthMm', num(e.target.value, input.widthMm))}
              />
            </label>
            <label>
              Height mm
              <input
                type="number"
                min={200}
                value={input.heightMm}
                onChange={(e) => patch('heightMm', num(e.target.value, input.heightMm))}
              />
            </label>
            <label>
              Depth mm
              <input
                type="number"
                min={150}
                value={input.depthMm}
                onChange={(e) => patch('depthMm', num(e.target.value, input.depthMm))}
              />
            </label>
          </div>

          <div className="ws-modular__row3">
            <label>
              Qty
              <input
                type="number"
                min={1}
                value={input.qty}
                onChange={(e) => patch('qty', num(e.target.value, 1))}
              />
            </label>
            <label>
              Plywood mm
              <select
                value={input.plywoodMm}
                onChange={(e) => patch('plywoodMm', Number(e.target.value) as PlywoodThicknessMm)}
              >
                <option value={12}>12 mm</option>
                <option value={16}>16 mm</option>
                <option value={18}>18 mm</option>
                <option value={25}>25 mm</option>
              </select>
            </label>
            <label>
              Waste %
              <input
                type="number"
                min={0}
                max={30}
                value={input.wastePercent}
                onChange={(e) => patch('wastePercent', num(e.target.value, 12))}
              />
            </label>
          </div>

          <div className="ws-modular__row3">
            <label>
              Shutters
              <input
                type="number"
                min={0}
                value={input.shutters}
                onChange={(e) => patch('shutters', num(e.target.value, 0))}
              />
            </label>
            <label>
              Shelves
              <input
                type="number"
                min={0}
                value={input.shelves}
                onChange={(e) => patch('shelves', num(e.target.value, 0))}
              />
            </label>
            <label>
              Drawers
              <input
                type="number"
                min={0}
                value={input.drawers}
                onChange={(e) => patch('drawers', num(e.target.value, 0))}
              />
            </label>
          </div>

          <label className="ws-check">
            <input
              type="checkbox"
              checked={input.includeBack}
              onChange={(e) => patch('includeBack', e.target.checked)}
            />
            Include back plywood panel
          </label>

          <label>
            Notes for supervisor
            <textarea
              rows={3}
              value={input.notes || ''}
              onChange={(e) => patch('notes', e.target.value)}
              placeholder="Laminate code, edge colour, special hardware…"
            />
          </label>
        </section>

        <section className="ws-modular__result">
          <div className="ws-card ws-modular__kpis">
            <h2>Supervisor summary</h2>
            <div className="ws-modular__kpi-grid">
              <div>
                <span>Plywood</span>
                <strong>{takeoff.plywoodSqftWithWaste} sqft</strong>
                <em>{takeoff.plywoodSheets} × 8×4 sheet(s)</em>
              </div>
              <div>
                <span>Inner laminate</span>
                <strong>{takeoff.innerLaminateSqft} sqft</strong>
                <em>Carcass + shelves</em>
              </div>
              <div>
                <span>Outer laminate</span>
                <strong>{takeoff.outerLaminateSqft} sqft</strong>
                <em>Shutters + ends</em>
              </div>
              <div>
                <span>Edge banding</span>
                <strong>{takeoff.edgeBandingRm} m</strong>
                <em>Running metres</em>
              </div>
            </div>
            <ul className="ws-modular__summary">
              {takeoff.summaryLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="ws-card">
            <h2>Cut panels</h2>
            <div className="ws-table-wrap">
              <table className="ws-table">
                <thead>
                  <tr>
                    <th>Panel</th>
                    <th>Qty</th>
                    <th>Size (mm)</th>
                    <th>Sqft</th>
                    <th>Material</th>
                  </tr>
                </thead>
                <tbody>
                  {takeoff.panels.map((p) => (
                    <tr key={`${p.name}-${p.widthMm}-${p.heightMm}`}>
                      <td>{p.name}</td>
                      <td>{p.qty}</td>
                      <td>
                        {p.widthMm} × {p.heightMm}
                      </td>
                      <td>{p.areaSqft}</td>
                      <td>{p.material === 'back' ? 'Back / thin' : `${input.plywoodMm} mm ply`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="ws-card">
            <h2>Hardware list</h2>
            <div className="ws-table-wrap">
              <table className="ws-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {takeoff.hardware.map((h) => (
                    <tr key={h.name}>
                      <td>{h.name}</td>
                      <td>{h.qty}</td>
                      <td>{h.unit}</td>
                      <td>{h.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
