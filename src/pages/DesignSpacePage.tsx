import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllProducts, getProductById } from '../lib/products'
import {
  DESIGN_ROOMS,
  buildDesignSpaceWhatsAppUrl,
  designRoomDefaults,
  productsForRoom,
  quoteDesignSpace,
  type DesignRoomId,
} from '../lib/designSpace'
import {
  getFinish,
  getFinishOptionsForProduct,
  getThicknessOptionsForProduct,
  productHasCarcass,
  type BuildScopeId,
} from '../lib/pricing'
import { formatPrice } from '../lib/currency'
import { useCurrency } from '../hooks/useCurrency'
import { getCategory } from '../data/catalog'
import './DesignSpacePage.css'

const STEPS = ['Space', 'Size', 'Style', 'Quote'] as const

export function DesignSpacePage() {
  useCurrency()
  const products = useMemo(() => getAllProducts(), [])

  const [step, setStep] = useState(0)
  const [room, setRoom] = useState<DesignRoomId | null>(null)
  const [width, setWidth] = useState(8)
  const [height, setHeight] = useState(7)
  const [depth, setDepth] = useState(2)
  const [notes, setNotes] = useState('')
  const [productId, setProductId] = useState('')
  const [finishId, setFinishId] = useState('')
  const [thicknessId, setThicknessId] = useState('')
  const [buildScope, setBuildScope] = useState<BuildScopeId>('with-carcass')

  const roomProducts = useMemo(
    () => (room ? productsForRoom(products, room) : []),
    [products, room],
  )
  const product = productId ? getProductById(productId) : undefined
  const category = product ? getCategory(product.categoryId) : undefined
  const sizeLimits = room ? designRoomDefaults(room) : null
  const finishOpts = product ? getFinishOptionsForProduct(product) : []
  const thicknessOpts = product ? getThicknessOptionsForProduct(product) : []
  const hasCarcass = productHasCarcass(product)

  const quote = useMemo(() => {
    if (!product || !room) return null
    return quoteDesignSpace({
      product,
      width,
      height,
      depth,
      finishId: finishId || undefined,
      thicknessId: thicknessId || undefined,
      buildScope: hasCarcass ? buildScope : 'shutter',
    })
  }, [product, room, width, height, depth, finishId, thicknessId, buildScope, hasCarcass])

  const selectRoom = (id: DesignRoomId) => {
    setRoom(id)
    const limits = designRoomDefaults(id)
    setWidth(limits.defaultWidth)
    setHeight(limits.defaultHeight)
    setDepth(limits.defaultDepth)
    setProductId('')
    setFinishId('')
    setThicknessId('')
    setStep(1)
  }

  const selectProduct = (id: string) => {
    setProductId(id)
    const p = getProductById(id)
    if (!p) return
    const finishes = getFinishOptionsForProduct(p)
    const thicknesses = getThicknessOptionsForProduct(p)
    setFinishId(finishes[0]?.id ?? p.defaultFinishId ?? 'pu')
    setThicknessId(thicknesses[0]?.id ?? p.defaultThicknessId ?? '25')
    setBuildScope(productHasCarcass(p) ? 'with-carcass' : 'shutter')
  }

  const goNext = () => {
    if (step === 0 && room) setStep(1)
    else if (step === 1) setStep(2)
    else if (step === 2 && product) setStep(3)
  }

  const whatsapp =
    product && quote
      ? buildDesignSpaceWhatsAppUrl({
          room: room!,
          product,
          width,
          height,
          depth,
          finishId: finishId || quote.config.finishId,
          thicknessId: thicknessId || quote.config.thicknessId,
          unitPrice: quote.unitPrice,
          buildScope: hasCarcass ? buildScope : 'shutter',
          notes,
        })
      : null

  const previewImage =
    product?.image || (room ? DESIGN_ROOMS.find((r) => r.id === room)?.image : null)

  return (
    <main className="design page-pad">
      <header className="design__header">
        <p className="eyebrow">Renovate or build new</p>
        <h1>Design my space</h1>
        <p>
          Tell us the room and size, pick a Priyabadal look, get an instant estimate, then send a
          clear WhatsApp quote — product, size, and price together.
        </p>
      </header>

      <ol className="design__steps" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? 'is-active' : i < step ? 'is-done' : ''}>
            <button type="button" onClick={() => i < step && setStep(i)} disabled={i > step}>
              <span>{i + 1}</span>
              {label}
            </button>
          </li>
        ))}
      </ol>

      <div className="design__layout">
        <section className="design__main" aria-label={`Step ${step + 1}`}>
          {step === 0 ? (
            <div className="design__block">
              <h2>What are you planning?</h2>
              <p className="design__hint">Choose the space you want to renovate or build.</p>
              <div className="design__rooms">
                {DESIGN_ROOMS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`design__room ${room === r.id ? 'is-active' : ''}`}
                    onClick={() => selectRoom(r.id)}
                  >
                    <img src={r.image} alt="" />
                    <span>
                      <strong>{r.name}</strong>
                      <em>{r.blurb}</em>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 1 && room && sizeLimits ? (
            <div className="design__block">
              <h2>Your area</h2>
              <p className="design__hint">
                Enter approximate size in feet. Exact measure is confirmed before production.
              </p>
              <div className="design__dims">
                <label>
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
                <label>
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
                <label>
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
              <label className="design__notes">
                <span>Want to change something? (optional)</span>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    room === 'kitchen'
                      ? 'e.g. L-shape, more drawers, keep the window, lighter colour'
                      : room === 'wardrobe'
                        ? 'e.g. more hanging, shoe racks, no handles, different colour'
                        : 'e.g. wall mandir niche, warm gold accents, taller height'
                  }
                />
              </label>
              <div className="design__nav">
                <button type="button" className="btn btn--outline" onClick={() => setStep(0)}>
                  Back
                </button>
                <button type="button" className="btn btn--dark" onClick={goNext}>
                  Next · Pick a style
                </button>
              </div>
            </div>
          ) : null}

          {step === 2 && room ? (
            <div className="design__block">
              <h2>Choose a style</h2>
              <p className="design__hint">
                These are real Priyabadal Homes products. Price uses your size from step 2.
              </p>
              <div className="design__styles">
                {roomProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`design__style ${productId === p.id ? 'is-active' : ''}`}
                    onClick={() => selectProduct(p.id)}
                  >
                    <img src={p.image} alt="" loading="lazy" />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>

              {product ? (
                <div className="design__options">
                  {finishOpts.length > 0 ? (
                    <label>
                      <span>Finish</span>
                      <select
                        value={finishId}
                        onChange={(e) => setFinishId(e.target.value)}
                      >
                        {finishOpts.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {thicknessOpts.length > 0 ? (
                    <label>
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
                  ) : null}
                  {hasCarcass ? (
                    <label>
                      <span>Scope</span>
                      <select
                        value={buildScope}
                        onChange={(e) => setBuildScope(e.target.value as BuildScopeId)}
                      >
                        <option value="with-carcass">With carcass</option>
                        <option value="shutter">Shutter / façade only</option>
                      </select>
                    </label>
                  ) : null}
                </div>
              ) : null}

              <div className="design__nav">
                <button type="button" className="btn btn--outline" onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn--dark"
                  disabled={!product}
                  onClick={goNext}
                >
                  Next · Get quote
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 && product && quote ? (
            <div className="design__block">
              <h2>Review & WhatsApp quote</h2>
              <p className="design__hint">
                Your estimate uses {width} × {height} × {depth} ft
                {category ? ` · ${category.name}` : ''}. Send this on WhatsApp — product photo is
                on the product link in the message.
              </p>

              <ul className="design__summary">
                <li>
                  <strong>Product</strong> {product.name}
                </li>
                <li>
                  <strong>Size</strong> {width} × {height}
                  {sizeLimits?.usesDepth ? ` × ${depth}` : ''} ft
                  {product.pricingMode === 'per-sqft'
                    ? ` · ${quote.sqft.toFixed(1)} sq ft`
                    : ''}
                </li>
                <li>
                  <strong>Finish</strong> {getFinish(finishId || quote.config.finishId).name}
                  {hasCarcass
                    ? ` · ${
                        buildScope === 'with-carcass'
                          ? 'With carcass'
                          : 'Shutter / façade only'
                      }`
                    : ''}
                </li>
                <li>
                  <strong>Estimate</strong> {formatPrice(quote.unitPrice)}
                </li>
              </ul>

              <div className="design__nav">
                <button type="button" className="btn btn--outline" onClick={() => setStep(2)}>
                  Back
                </button>
                {whatsapp ? (
                  <a
                    className="whatsapp-quote-btn"
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp quote
                  </a>
                ) : null}
              </div>

              <p className="design__links">
                Need more detail?{' '}
                <Link to={`/carcass?type=${room}&product=${product.id}`}>Carcass planner</Link>
                {' · '}
                <Link to={`/product/${product.id}`}>Product page</Link>
              </p>
            </div>
          ) : null}
        </section>

        <aside className="design__aside" aria-label="Live preview and estimate">
          <div className="design__preview">
            {previewImage ? (
              <img
                key={previewImage}
                src={previewImage}
                alt={product ? product.name : 'Space preview'}
              />
            ) : (
              <div className="design__preview-empty">
                <p>Your look and estimate appear here as you go.</p>
              </div>
            )}
            <p className="design__preview-cap">
              {product
                ? `Style · ${product.name}`
                : room
                  ? DESIGN_ROOMS.find((r) => r.id === room)?.name
                  : 'Start with a space'}
            </p>
          </div>

          {quote && product ? (
            <div className="design__quote">
              <p className="design__quote-label">Instant estimate</p>
              <p className="design__quote-price">{formatPrice(quote.unitPrice)}</p>
              <ul>
                <li>
                  {width} × {height}
                  {sizeLimits?.usesDepth ? ` × ${depth}` : ''} ft
                  {product.pricingMode === 'per-sqft'
                    ? ` · ${quote.sqft.toFixed(1)} sq ft`
                    : ' · package base'}
                </li>
                <li>
                  {hasCarcass
                    ? buildScope === 'with-carcass'
                      ? 'With carcass'
                      : 'Shutter / façade only'
                    : 'Product estimate'}
                  {' · '}
                  {quote.finish.name}
                </li>
                <li>{product.name}</li>
              </ul>
              {whatsapp ? (
                <a
                  className="whatsapp-quote-btn"
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp quote
                </a>
              ) : null}
              <p className="design__disclaimer">
                Estimate only. Final price after site measure. WhatsApp sends product, size, and
                price clearly — open the product link in the message to see the catalog photo.
              </p>
            </div>
          ) : (
            <div className="design__quote design__quote--idle">
              <p>Select a space, size, and style to see your estimate.</p>
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}
