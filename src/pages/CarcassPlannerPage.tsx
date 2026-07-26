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
  getProductCarcassImage,
  getProductExteriorImage,
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

type ViewMode = 'carcass' | 'exterior'

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
    () => products.filter((p) => p.categoryId === category),
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

  const carcassImage = getProductCarcassImage(product)
  const exteriorImage = getProductExteriorImage(product)

  const [viewMode, setViewMode] = useState<ViewMode>('carcass')
  const [width, setWidth] = useState(sizeLimits.defaultWidth)
  const [height, setHeight] = useState(sizeLimits.defaultHeight)
  const [depth, setDepth] = useState(sizeLimits.defaultDepth)
  const [finishId, setFinishId] = useState(rates.finishId)
  const [thicknessId, setThicknessId] = useState(rates.thicknessId)
  const [preset, setPreset] = useState<LayoutPresetId>('balanced')
  const [prompt, setPrompt] = useState('')
  const [aiNote, setAiNote] = useState(() =>
    aiExplanation(
      initialCategory,
      'balanced',
      suggestLayout(initialCategory, sizeLimits.defaultWidth, 'balanced'),
      sizeLimits.defaultWidth,
    ),
  )
  const [bays, setBays] = useState<CarcassBay[]>(() =>
    suggestLayout(initialCategory, sizeLimits.defaultWidth, 'balanced'),
  )
  const [showBayEdit, setShowBayEdit] = useState(false)

  const widths = bayWidthsFt(bays, width)

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

  const heroImage =
    viewMode === 'exterior'
      ? exteriorImage ?? carcassImage
      : carcassImage ?? exteriorImage

  const whatsapp = buildCarcassWhatsAppUrl({
    category,
    productName: product?.name,
    productId: product?.id,
    quote,
    finishId,
    thicknessId,
    notes: prompt,
  })

  const selectProduct = (id: string) => {
    setProductId(id)
    const p = getProductById(id)
    const r = ratesFromProduct(category, p)
    setFinishId(r.finishId)
    setThicknessId(r.thicknessId)
    setViewMode('carcass')
  }

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
    setViewMode('carcass')
  }

  const runLayout = (nextPreset?: LayoutPresetId) => {
    const resolved = nextPreset ?? parsePromptToPreset(prompt)
    setPreset(resolved)
    const next = suggestLayout(category, width, resolved, prompt)
    setBays(next)
    setAiNote(aiExplanation(category, resolved, next, width))
  }

  const addBay = (kind: BayKind) => setBays((prev) => [...prev, makeBay(kind)])
  const removeBay = (id: string) =>
    setBays((prev) => (prev.length <= 1 ? prev : prev.filter((b) => b.id !== id)))
  const changeBayKind = (id: string, kind: BayKind) =>
    setBays((prev) =>
      prev.map((b) => (b.id === id ? { ...b, kind, label: bayMeta(kind).label } : b)),
    )

  return (
    <main className="carcass page-pad">
      <header className="carcass__header">
        <p className="carcass__eyebrow">Real carcass · Size · Price</p>
        <h1>Carcass Planner</h1>
        <p>
          Set your wall size, pick a layout, review the catalog carcass photo, and send a clear
          WhatsApp quote with size, layout, and price.
        </p>
      </header>

      <ol className="carcass__steps" aria-label="How to use">
        <li>
          <strong>1</strong> Choose wardrobe or kitchen + a style
        </li>
        <li>
          <strong>2</strong> Enter live size (width × height × depth)
        </li>
        <li>
          <strong>3</strong> Pick layout → WhatsApp quote
        </li>
      </ol>

      <div className="carcass__tabs" role="tablist" aria-label="Carcass type">
        <button
          type="button"
          role="tab"
          aria-selected={category === 'wardrobe'}
          className={category === 'wardrobe' ? 'is-active' : ''}
          onClick={() => switchCategory('wardrobe')}
        >
          Wardrobe
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={category === 'kitchen'}
          className={category === 'kitchen' ? 'is-active' : ''}
          onClick={() => switchCategory('kitchen')}
        >
          Kitchen
        </button>
      </div>

      <div className="carcass__grid">
        <section className="carcass__stage" aria-label="Carcass and price">
          <div className="carcass__hero">
            <div className="carcass__view-toggle" role="group" aria-label="Photo view">
              <button
                type="button"
                className={viewMode === 'carcass' ? 'is-active' : ''}
                onClick={() => setViewMode('carcass')}
              >
                Catalog carcass
              </button>
              <button
                type="button"
                className={viewMode === 'exterior' ? 'is-active' : ''}
                onClick={() => setViewMode('exterior')}
                disabled={!exteriorImage}
              >
                Closed look
              </button>
            </div>

            {heroImage ? (
              <figure className="carcass__photo">
                <img
                  key={`${productId}-${viewMode}-${heroImage}`}
                  src={heroImage}
                  alt={
                    viewMode === 'carcass'
                      ? `${product?.name ?? category} catalog carcass`
                      : `${product?.name ?? category} closed exterior`
                  }
                />
                <figcaption>
                  {viewMode === 'carcass' ? 'Catalog carcass reference' : 'Closed façade'}
                  {product ? ` · ${product.name}` : ''}
                  {` · ${quote.width} × ${quote.height} × ${quote.depth} ft`}
                </figcaption>
              </figure>
            ) : (
              <div className="carcass__photo carcass__photo--empty">
                <p>Select a style to load the carcass photo.</p>
              </div>
            )}
          </div>

          <div className="carcass__bay-strip" aria-label="Storage layout across the wall">
            <p className="carcass__bay-strip-label">
              Your storage plan across {quote.width} ft
            </p>
            <div className="carcass__bay-row">
              {bays.map((bay, i) => {
                const meta = bayMeta(bay.kind)
                const ft = widths[i] ?? 0
                return (
                  <div
                    key={bay.id}
                    className="carcass__bay-chip"
                    style={{ flexGrow: bay.weight, background: meta.tone }}
                  >
                    <span>{meta.label}</span>
                    <em>{ft} ft</em>
                  </div>
                )
              })}
            </div>
            {aiNote ? <p className="carcass__ai-note">{aiNote}</p> : null}
          </div>

          <aside className="carcass__quote">
            <p className="carcass__quote-label">Estimated with carcass</p>
            <p className="carcass__quote-price">{formatPrice(quote.unitPrice)}</p>
            <ul className="carcass__quote-meta">
              <li>
                {quote.sqft.toFixed(1)} sq ft · shutter {formatPrice(quote.shutterRate)} +
                carcass {formatPrice(quote.carcassRate)} / sq ft
              </li>
              <li>
                Board {formatPrice(quote.boardPrice)}
                {quote.moduleAddOn > 0
                  ? ` · layout extras +${formatPrice(quote.moduleAddOn)}`
                  : ''}
              </li>
            </ul>
            <div className="carcass__quote-actions">
              <a
                className="whatsapp-quote-btn"
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp quote
              </a>
              {product ? (
                <Link className="btn btn--outline" to={`/product/${product.id}`}>
                  View product
                </Link>
              ) : null}
            </div>
            <p className="carcass__disclaimer">
              Catalog photos show the style. Final fit, hardware, and price are confirmed after
              site measure on WhatsApp. The quote message includes product link, size, and price.
            </p>
          </aside>
        </section>

        <section className="carcass__controls" aria-label="Planner controls">
          <div className="carcass__block">
            <h2>1. Style</h2>
            <p className="carcass__hint">Tap a real product — carcass photo loads as reference.</p>
            <div className="carcass__styles">
              {styleProducts.map((p) => {
                const thumb =
                  getProductCarcassImage(p) ?? getProductExteriorImage(p) ?? p.image
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`carcass__style ${productId === p.id ? 'is-active' : ''}`}
                    onClick={() => selectProduct(p.id)}
                  >
                    <img src={thumb} alt="" loading="lazy" />
                    <span>{p.name}</span>
                  </button>
                )
              })}
            </div>
            {product ? (
              <p className="carcass__ref">
                Selected: {product.name}
                {getCategory(product.categoryId)
                  ? ` · ${getCategory(product.categoryId)!.name}`
                  : ''}
              </p>
            ) : null}
          </div>

          <div className="carcass__block">
            <h2>2. Live size</h2>
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
            <div className="carcass__dims carcass__dims--2">
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
          </div>

          <div className="carcass__block">
            <h2>3. Storage layout</h2>
            <p className="carcass__hint">
              Choose a ready plan, or describe what you need — then update the bay plan.
            </p>
            <div className="carcass__presets">
              {LAYOUT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={preset === p.id ? 'is-active' : ''}
                  title={p.hint}
                  onClick={() => runLayout(p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              placeholder={
                category === 'kitchen'
                  ? 'e.g. tall pantry, sink centre, more drawers'
                  : 'e.g. more hanging, shoe racks, open display'
              }
            />
            <button
              type="button"
              className="btn btn--outline carcass__ai-run"
              onClick={() => runLayout()}
            >
              Update bay plan
            </button>

            <button
              type="button"
              className="carcass__edit-toggle"
              onClick={() => setShowBayEdit((v) => !v)}
            >
              {showBayEdit ? 'Hide bay editor' : 'Fine-tune bay types'}
            </button>

            {showBayEdit ? (
              <div className="carcass__bays">
                <div className="carcass__bays-head">
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
                        onChange={(e) =>
                          changeBayKind(bay.id, e.target.value as BayKind)
                        }
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
            ) : null}
          </div>

          <Link className="btn btn--outline" to={`/shop/${category}`}>
            Browse {category} products
          </Link>
        </section>
      </div>
    </main>
  )
}
