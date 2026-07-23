import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { categories, formatPrice, getCategory } from '../data/catalog'
import { getAllProducts, getProductById } from '../lib/products'
import {
  VISUALISE_COLOURS,
  buildVisualiseWhatsAppUrl,
  fetchVisualiseStatus,
  fileToDataUrl,
  generateVisualise,
  type VisualiseColour,
} from '../lib/visualise'
import './VisualisePage.css'

export function VisualisePage() {
  const [params] = useSearchParams()
  const products = useMemo(() => getAllProducts(), [])
  const preselect = params.get('product')

  const [roomDataUrl, setRoomDataUrl] = useState<string | null>(null)
  const [productId, setProductId] = useState(
    preselect && getProductById(preselect) ? preselect : products[0]?.id || '',
  )
  const [colour, setColour] = useState<VisualiseColour>(VISUALISE_COLOURS[0]!)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultSource, setResultSource] = useState<'ai' | 'preview' | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [aiConfigured, setAiConfigured] = useState(false)

  const product = productId ? getProductById(productId) : undefined
  const category = product ? getCategory(product.categoryId) : undefined

  const kitchenFirst = useMemo(() => {
    const kitchen = products.filter((p) => p.categoryId === 'kitchen')
    const rest = products.filter((p) => p.categoryId !== 'kitchen')
    return [...kitchen, ...rest]
  }, [products])

  useEffect(() => {
    void fetchVisualiseStatus().then((s) => setAiConfigured(s.configured))
  }, [])

  useEffect(() => {
    if (preselect && getProductById(preselect)) {
      setProductId(preselect)
    }
  }, [preselect])

  const onRoomChange = async (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setStatusMsg('Please upload a room photo (JPG/PNG).')
      return
    }
    setBusy(true)
    setStatusMsg(null)
    try {
      const dataUrl = await fileToDataUrl(file)
      setRoomDataUrl(dataUrl)
      setResultUrl(null)
      setResultSource(null)
    } catch {
      setStatusMsg('Could not read that photo. Try another image.')
    } finally {
      setBusy(false)
    }
  }

  const onGenerate = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!roomDataUrl || !product || !category) {
      setStatusMsg('Upload a room photo and select a product first.')
      return
    }
    setBusy(true)
    setStatusMsg('Creating your product-matched visual…')
    try {
      const result = await generateVisualise({
        roomDataUrl,
        product,
        colour,
        notes: notes.trim() || undefined,
        categoryName: category.name,
      })
      setResultUrl(result.imageUrl)
      setResultSource(result.source)
      setStatusMsg(result.message || null)
    } finally {
      setBusy(false)
    }
  }

  const waHref =
    product &&
    buildVisualiseWhatsAppUrl({
      product,
      colour,
      notes: notes.trim() || undefined,
      usedAi: resultSource === 'ai',
    })

  return (
    <main className="visualise page-pad">
      <header className="visualise__header">
        <p className="eyebrow">Interior AI</p>
        <h1>Visualise with our products</h1>
        <p>
          Upload your empty kitchen or room photo. We place a{' '}
          <strong>Priyabadal Homes</strong> product into the space and apply your
          chosen colour — not random AI furniture.
        </p>
        <p className={`visualise__mode ${aiConfigured ? 'is-live' : ''}`}>
          {aiConfigured
            ? 'Paid AI connected · product-referenced renders'
            : 'Preview mode ready · add FAL_KEY for full paid AI renders'}
        </p>
      </header>

      <form className="visualise__layout" onSubmit={onGenerate}>
        <section className="visualise__panel">
          <h2>1. Room photo</h2>
          <label className="visualise__upload">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => void onRoomChange(e.target.files?.[0] || null)}
            />
            {roomDataUrl ? (
              <img src={roomDataUrl} alt="Your room" />
            ) : (
              <span>Tap to upload empty kitchen / room photo</span>
            )}
          </label>

          <h2>2. Our product</h2>
          <label className="visualise__field">
            <span>Product</span>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value)
                setResultUrl(null)
                setResultSource(null)
              }}
            >
              {kitchenFirst.map((p) => (
                <option key={p.id} value={p.id}>
                  {categories.find((c) => c.id === p.categoryId)?.name} — {p.name}
                </option>
              ))}
            </select>
          </label>

          {product && (
            <div className="visualise__product">
              <img src={product.image} alt="" />
              <div>
                <strong>{product.name}</strong>
                <em>From {formatPrice(product.price)}</em>
                <Link to={`/product/${product.id}`}>View product</Link>
              </div>
            </div>
          )}

          <h2>3. Finish colour</h2>
          <div className="visualise__colours" role="listbox" aria-label="Finish colour">
            {VISUALISE_COLOURS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={
                  colour.id === c.id
                    ? 'visualise__swatch is-active'
                    : 'visualise__swatch'
                }
                style={{ background: c.hex }}
                aria-label={c.label}
                title={c.label}
                onClick={() => setColour(c)}
              />
            ))}
          </div>
          <p className="visualise__colour-label">{colour.label}</p>

          <label className="visualise__field">
            <span>Note (optional)</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. L-shape left wall, hide old chimney…"
            />
          </label>

          <button className="btn btn--dark" type="submit" disabled={busy}>
            {busy ? 'Working…' : 'Generate with our product'}
          </button>
          {statusMsg && <p className="visualise__status">{statusMsg}</p>}
        </section>

        <section className="visualise__result-panel">
          <h2>Result</h2>
          <div className="visualise__result">
            {resultUrl ? (
              <img src={resultUrl} alt="Visualise result" />
            ) : (
              <p>Your AI / preview result will appear here.</p>
            )}
          </div>

          {resultUrl && product && waHref && (
            <div className="visualise__actions">
              <a
                className="btn visualise__wa"
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp this look for quote
              </a>
              <Link className="btn btn--outline" to={`/product/${product.id}`}>
                Customise &amp; price
              </Link>
              {resultSource === 'ai' && (
                <a className="btn btn--outline" href={resultUrl} download="priyabadal-visualise.jpg">
                  Download image
                </a>
              )}
            </div>
          )}
        </section>
      </form>
    </main>
  )
}
