import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getCategory } from '../data/catalog'
import { getAllProducts, getProductById } from '../lib/products'
import {
  LAYOUT_PRESETS,
  aiExplanation,
  bayMeta,
  bayWidthsFt,
  buildCarcassWhatsAppUrl,
  defaultSize,
  finishOptionsForPlanner,
  kindsForCategory,
  makeBay,
  parsePromptToPreset,
  quoteCarcass,
  ratesFromProduct,
  suggestLayout,
  thicknessOptionsForPlanner,
  type BayKind,
  type CarcassBay,
  type CarcassCategory,
  type LayoutPresetId,
} from '../lib/carcassPlanner'
import { formatPrice } from '../lib/currency'
import { useCurrency } from '../hooks/useCurrency'
import './CarcassPlannerPage.css'

function CarcassSvg({
  category,
  widthFt,
  heightFt,
  bays,
}: {
  category: CarcassCategory
  widthFt: number
  heightFt: number
  bays: CarcassBay[]
}) {
  const widths = bayWidthsFt(bays, widthFt)
  const viewW = 640
  const viewH = 420
  const pad = 28
  const innerW = viewW - pad * 2
  const innerH = viewH - pad * 2 - 24
  const totalWeight = widths.reduce((s, w) => s + w, 0) || 1

  let x = pad
  const cols = bays.map((bay, i) => {
    const w = (widths[i]! / totalWeight) * innerW
    const col = { bay, x, w, widthFt: widths[i]! }
    x += w
    return col
  })

  return (
    <svg
      className="carcass-svg"
      viewBox={`0 0 ${viewW} ${viewH}`}
      role="img"
      aria-label={`${category} carcass layout ${widthFt} by ${heightFt} feet`}
    >
      <defs>
        <linearGradient id="carcassWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4a882" />
          <stop offset="100%" stopColor="#9a7a55" />
        </linearGradient>
        <linearGradient id="carcassGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff6e8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fff6e8" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={viewW} height={viewH} fill="#e8efe9" />
      <text x={pad} y={22} className="carcass-svg__caption">
        {category === 'kitchen' ? 'Kitchen carcass' : 'Wardrobe carcass'} · {widthFt} ×{' '}
        {heightFt} ft elevation
      </text>

      <rect
        x={pad}
        y={pad + 8}
        width={innerW}
        height={innerH}
        rx="4"
        fill="url(#carcassWood)"
        stroke="#5c4632"
        strokeWidth="2"
      />

      {cols.map((col) => {
        const meta = bayMeta(col.bay.kind)
        const top = pad + 8
        const h = innerH
        return (
          <g key={col.bay.id}>
            <rect
              x={col.x}
              y={top}
              width={col.w}
              height={h}
              fill={meta.tone}
              fillOpacity="0.35"
              stroke="#3d2f22"
              strokeWidth="1.2"
            />
            <rect
              x={col.x + 4}
              y={top + 4}
              width={Math.max(0, col.w - 8)}
              height={36}
              fill="url(#carcassGlow)"
            />
            <BayGlyph kind={col.bay.kind} x={col.x} y={top} w={col.w} h={h} />
            <text
              x={col.x + col.w / 2}
              y={top + h - 18}
              textAnchor="middle"
              className="carcass-svg__bay-label"
            >
              {meta.short}
            </text>
            <text
              x={col.x + col.w / 2}
              y={top + h - 4}
              textAnchor="middle"
              className="carcass-svg__bay-ft"
            >
              {col.widthFt} ft
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function BayGlyph({
  kind,
  x,
  y,
  w,
  h,
}: {
  kind: BayKind
  x: number
  y: number
  w: number
  h: number
}) {
  const cx = x + w / 2
  const inset = 14
  const left = x + inset
  const right = x + w - inset
  const stroke = '#f7f1e6'
  const sw = 1.6

  if (kind === 'hanging' || kind === 'double-hanging') {
    const rods = kind === 'double-hanging' ? [0.28, 0.62] : [0.38]
    return (
      <g>
        {rods.map((t) => {
          const yy = y + h * t
          return (
            <g key={t}>
              <line x1={left} y1={yy} x2={right} y2={yy} stroke={stroke} strokeWidth={sw} />
              <line
                x1={cx - 8}
                y1={yy}
                x2={cx - 8}
                y2={yy + 28}
                stroke={stroke}
                strokeWidth={1.2}
              />
              <line
                x1={cx + 8}
                y1={yy}
                x2={cx + 8}
                y2={yy + 28}
                stroke={stroke}
                strokeWidth={1.2}
              />
            </g>
          )
        })}
      </g>
    )
  }

  if (kind === 'shelves' || kind === 'open-display' || kind === 'wall-cabinet') {
    const rows = kind === 'open-display' ? [0.25, 0.45, 0.65, 0.82] : [0.3, 0.5, 0.7]
    return (
      <g>
        {rows.map((t) => (
          <line
            key={t}
            x1={left}
            y1={y + h * t}
            x2={right}
            y2={y + h * t}
            stroke={stroke}
            strokeWidth={sw}
          />
        ))}
      </g>
    )
  }

  if (kind === 'drawers' || kind === 'combo' || kind === 'shoes') {
    const start = kind === 'combo' ? 0.48 : 0.28
    const rows = kind === 'shoes' ? 5 : 4
    return (
      <g>
        {kind === 'combo' ? (
          <line
            x1={left}
            y1={y + h * 0.28}
            x2={right}
            y2={y + h * 0.28}
            stroke={stroke}
            strokeWidth={sw}
          />
        ) : null}
        {Array.from({ length: rows }, (_, i) => {
          const t = start + i * ((0.9 - start) / rows)
          const yy = y + h * t
          return (
            <g key={i}>
              <rect
                x={left}
                y={yy}
                width={right - left}
                height={h * 0.08}
                fill="none"
                stroke={stroke}
                strokeWidth={1.2}
                rx="1"
              />
              <circle cx={cx} cy={yy + h * 0.04} r="2.2" fill={stroke} />
            </g>
          )
        })}
      </g>
    )
  }

  // kitchen-ish blocks
  return (
    <g>
      <rect
        x={left}
        y={y + h * 0.22}
        width={right - left}
        height={h * 0.55}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        rx="2"
      />
      <line
        x1={cx}
        y1={y + h * 0.22}
        x2={cx}
        y2={y + h * 0.77}
        stroke={stroke}
        strokeWidth={1.2}
      />
      {kind === 'sink-base' ? (
        <ellipse
          cx={cx}
          cy={y + h * 0.42}
          rx={Math.min(28, w * 0.28)}
          ry={10}
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
        />
      ) : null}
      {kind === 'tall-unit' ? (
        <>
          <line
            x1={left}
            y1={y + h * 0.4}
            x2={right}
            y2={y + h * 0.4}
            stroke={stroke}
            strokeWidth={1.2}
          />
          <line
            x1={left}
            y1={y + h * 0.58}
            x2={right}
            y2={y + h * 0.58}
            stroke={stroke}
            strokeWidth={1.2}
          />
        </>
      ) : null}
    </g>
  )
}

export function CarcassPlannerPage() {
  useCurrency()
  const [params] = useSearchParams()
  const products = useMemo(() => getAllProducts(), [])

  const initialCategory: CarcassCategory =
    params.get('type') === 'kitchen' ? 'kitchen' : 'wardrobe'
  const preProduct = params.get('product')

  const [category, setCategory] = useState<CarcassCategory>(initialCategory)
  const sizeLimits = defaultSize(category)

  const styleProducts = useMemo(
    () =>
      products.filter((p) =>
        category === 'wardrobe'
          ? p.categoryId === 'wardrobe'
          : p.categoryId === 'kitchen',
      ),
    [products, category],
  )

  const [productId, setProductId] = useState(() => {
    if (preProduct && getProductById(preProduct)) return preProduct
    return styleProducts[0]?.id ?? ''
  })

  const product = productId ? getProductById(productId) : undefined
  const rates = ratesFromProduct(category, product)
  const finishOpts = finishOptionsForPlanner(category, product)
  const thicknessOpts = thicknessOptionsForPlanner(category, product)

  const [width, setWidth] = useState(sizeLimits.defaultWidth)
  const [height, setHeight] = useState(sizeLimits.defaultHeight)
  const [depth, setDepth] = useState(sizeLimits.defaultDepth)
  const [finishId, setFinishId] = useState(rates.finishId)
  const [thicknessId, setThicknessId] = useState(rates.thicknessId)
  const [preset, setPreset] = useState<LayoutPresetId>('balanced')
  const [prompt, setPrompt] = useState('')
  const [aiNote, setAiNote] = useState('')
  const [bays, setBays] = useState<CarcassBay[]>(() =>
    suggestLayout(initialCategory, sizeLimits.defaultWidth, 'balanced'),
  )

  const quote = useMemo(
    () =>
      quoteCarcass({
        category,
        width,
        height,
        depth,
        bays,
        rates,
        finishId,
        thicknessId,
      }),
    [category, width, height, depth, bays, rates, finishId, thicknessId],
  )

  const whatsapp = buildCarcassWhatsAppUrl({
    category,
    productName: product?.name,
    quote,
    finishId,
    thicknessId,
    notes: prompt,
  })

  const switchCategory = (next: CarcassCategory) => {
    setCategory(next)
    const limits = defaultSize(next)
    setWidth(limits.defaultWidth)
    setHeight(limits.defaultHeight)
    setDepth(limits.defaultDepth)
    const nextProducts = products.filter((p) => p.categoryId === next)
    const nextProduct = nextProducts[0]
    setProductId(nextProduct?.id ?? '')
    const nextRates = ratesFromProduct(next, nextProduct)
    setFinishId(nextRates.finishId)
    setThicknessId(nextRates.thicknessId)
    const nextBays = suggestLayout(next, limits.defaultWidth, preset, prompt)
    setBays(nextBays)
    setAiNote(aiExplanation(next, preset, nextBays, limits.defaultWidth))
  }

  const runAi = (nextPreset?: LayoutPresetId) => {
    const resolved = nextPreset ?? parsePromptToPreset(prompt)
    setPreset(resolved)
    const next = suggestLayout(category, width, resolved, prompt)
    setBays(next)
    setAiNote(aiExplanation(category, resolved, next, width))
  }

  const addBay = (kind: BayKind) => {
    setBays((prev) => [...prev, makeBay(kind)])
  }

  const removeBay = (id: string) => {
    setBays((prev) => (prev.length <= 1 ? prev : prev.filter((b) => b.id !== id)))
  }

  const changeBayKind = (id: string, kind: BayKind) => {
    setBays((prev) =>
      prev.map((b) => (b.id === id ? { ...b, kind, label: bayMeta(kind).label } : b)),
    )
  }

  return (
    <main className="carcass page-pad">
      <header className="carcass__header">
        <p className="carcass__eyebrow">Structure · Price · WhatsApp quote</p>
        <h1>Carcass Planner</h1>
        <p>
          Design kitchen or wardrobe carcass bays, see a live elevation, and get an
          estimated shutter + carcass price. AI suggests a practical layout from your
          brief — you can edit every bay.
        </p>
      </header>

      <div className="carcass__tabs" role="tablist" aria-label="Carcass type">
        <button
          type="button"
          role="tab"
          aria-selected={category === 'wardrobe'}
          className={category === 'wardrobe' ? 'is-active' : ''}
          onClick={() => switchCategory('wardrobe')}
        >
          Wardrobe carcass
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={category === 'kitchen'}
          className={category === 'kitchen' ? 'is-active' : ''}
          onClick={() => switchCategory('kitchen')}
        >
          Kitchen structure
        </button>
      </div>

      <div className="carcass__grid">
        <section className="carcass__controls" aria-label="Planner controls">
          <label className="carcass__field">
            <span>Style reference</span>
            <select
              value={productId}
              onChange={(e) => {
                const id = e.target.value
                setProductId(id)
                const p = getProductById(id)
                const r = ratesFromProduct(category, p)
                setFinishId(r.finishId)
                setThicknessId(r.thicknessId)
              }}
            >
              {styleProducts.length === 0 ? (
                <option value="">Default rates</option>
              ) : (
                styleProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </label>

          <div className="carcass__dims">
            <label className="carcass__field">
              <span>Width (ft)</span>
              <input
                type="number"
                min={sizeLimits.minWidth}
                max={sizeLimits.maxWidth}
                step={0.1}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
            </label>
            <label className="carcass__field">
              <span>Height (ft)</span>
              <input
                type="number"
                min={sizeLimits.minHeight}
                max={sizeLimits.maxHeight}
                step={0.1}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </label>
            <label className="carcass__field">
              <span>Depth (ft)</span>
              <input
                type="number"
                min={sizeLimits.minDepth}
                max={sizeLimits.maxDepth}
                step={0.1}
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="carcass__dims">
            <label className="carcass__field">
              <span>Finish</span>
              <select value={finishId} onChange={(e) => setFinishId(e.target.value)}>
                {finishOpts.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="carcass__field">
              <span>Thickness</span>
              <select
                value={thicknessId}
                onChange={(e) => setThicknessId(e.target.value)}
              >
                {thicknessOpts.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="carcass__ai">
            <h2>AI layout</h2>
            <p>Describe how you use the space — hanging, drawers, shoes, sink, pantry…</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder={
                category === 'kitchen'
                  ? 'e.g. L-shape feel, tall pantry, sink in centre, more drawers'
                  : 'e.g. more hanging for shirts, shoe racks, open display with LED'
              }
            />
            <div className="carcass__presets">
              {LAYOUT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={preset === p.id ? 'is-active' : ''}
                  title={p.hint}
                  onClick={() => runAi(p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn--dark carcass__ai-run" onClick={() => runAi()}>
              Suggest layout
            </button>
            {aiNote ? <p className="carcass__ai-note">{aiNote}</p> : null}
          </div>

          <div className="carcass__bays">
            <div className="carcass__bays-head">
              <h2>Bays</h2>
              <select
                aria-label="Add bay type"
                defaultValue=""
                onChange={(e) => {
                  const kind = e.target.value as BayKind
                  if (!kind) return
                  addBay(kind)
                  e.target.value = ''
                }}
              >
                <option value="">Add bay…</option>
                {kindsForCategory(category).map((kind) => (
                  <option key={kind} value={kind}>
                    {bayMeta(kind).label}
                  </option>
                ))}
              </select>
            </div>
            <ul>
              {bays.map((bay, index) => (
                <li key={bay.id}>
                  <span className="carcass__bay-index">{index + 1}</span>
                  <select
                    value={bay.kind}
                    onChange={(e) => changeBayKind(bay.id, e.target.value as BayKind)}
                  >
                    {kindsForCategory(category).map((kind) => (
                      <option key={kind} value={kind}>
                        {bayMeta(kind).label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="carcass__bay-remove"
                    onClick={() => removeBay(bay.id)}
                    aria-label={`Remove bay ${index + 1}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="carcass__stage" aria-label="Carcass visualisation and price">
          <CarcassSvg
            category={category}
            widthFt={quote.width}
            heightFt={quote.height}
            bays={bays}
          />

          <aside className="carcass__quote">
            <p className="carcass__quote-label">Estimated with carcass</p>
            <p className="carcass__quote-price">{formatPrice(quote.unitPrice)}</p>
            <ul className="carcass__quote-meta">
              <li>
                {quote.sqft.toFixed(1)} sq ft · shutter {formatPrice(quote.shutterRate)} +
                carcass {formatPrice(quote.carcassRate)} / sq ft
              </li>
              <li>
                Board estimate {formatPrice(quote.boardPrice)}
                {quote.moduleAddOn > 0
                  ? ` · modules +${formatPrice(quote.moduleAddOn)}`
                  : ''}
              </li>
              <li>{quote.baySummary}</li>
            </ul>
            <div className="carcass__quote-actions">
              <a
                className="whatsapp-quote-btn"
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp this plan
              </a>
              {product ? (
                <Link className="btn btn--outline" to={`/product/${product.id}`}>
                  View {getCategory(product.categoryId)?.name ?? 'product'}
                </Link>
              ) : null}
              <Link className="btn btn--outline" to={`/shop/${category}`}>
                Browse {category}
              </Link>
            </div>
            <p className="carcass__disclaimer">
              Estimate only — final quote confirmed on WhatsApp after site measure,
              hardware, and finish selection.
            </p>
          </aside>
        </section>
      </div>
    </main>
  )
}
