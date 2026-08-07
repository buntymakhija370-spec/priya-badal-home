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
  type VisualiseMode,
} from '../lib/visualise'
import { AiAccessBanner } from '../components/AiAccessBanner'
import { useCurrency } from '../hooks/useCurrency'
import './VisualisePage.css'

const VISUALISE_MODES: { id: VisualiseMode; label: string; hint: string }[] = [
  {
    id: 'replace',
    label: 'Replace existing',
    hint: 'Swap the current kitchen / wardrobe with our product — same room photo.',
  },
  {
    id: 'install',
    label: 'Install in room',
    hint: 'Place our product into your room on the right wall / niche.',
  },
  {
    id: 'redesign',
    label: 'Presentable redesign',
    hint: 'Polished client-ready interior look with our product as the hero.',
  },
]

export function VisualisePage() {
  useCurrency()
  const [params] = useSearchParams()
  const products = useMemo(() => getAllProducts(), [])
  const preselect = params.get('product')

  const [roomDataUrl, setRoomDataUrl] = useState<string | null>(null)
  const [productId, setProductId] = useState(
    preselect && getProductById(preselect) ? preselect : products[0]?.id || '',
  )
  const [colour, setColour] = useState<VisualiseColour>(VISUALISE_COLOURS[0]!)
  const [notes, setNotes] = useState('')
  const [visualiseMode, setVisualiseMode] = useState<VisualiseMode>('replace')
  const [busy, setBusy] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [aiConfigured, setAiConfigured] = useState(false)
  const [aiModel, setAiModel] = useState('gemini-2.5-flash-image')
  const [aiQuality, setAiQuality] = useState('2K')
  const [aiEngine, setAiEngine] = useState('Priyabadal Interior AI')

  const product = productId ? getProductById(productId) : undefined
  const category = product ? getCategory(product.categoryId) : undefined

  const kitchenFirst = useMemo(() => {
    const kitchen = products.filter((p) => p.categoryId === 'kitchen')
    const rest = products.filter((p) => p.categoryId !== 'kitchen')
    return [...kitchen, ...rest]
  }, [products])

  useEffect(() => {
    void fetchVisualiseStatus().then((s) => {
      setAiConfigured(s.configured)
      if (s.model) setAiModel(s.model)
      if (s.quality) setAiQuality(s.quality)
      if (s.engine) setAiEngine(s.engine)
    })
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
    if (!aiConfigured) {
      setStatusMsg('Unlock paid AI with your access code first.')
      return
    }

    setBusy(true)
    setResultUrl(null)
    setStatusMsg('Creating a client-ready 2K interior visualisation…')
    try {
      const result = await generateVisualise({
        roomDataUrl,
        product,
        colour,
        notes: notes.trim() || undefined,
        categoryName: category.name,
        visualiseMode,
      })

      if (result.source === 'ai' && result.imageUrl) {
        setResultUrl(result.imageUrl)
        setStatusMsg(result.message)
      } else {
        setResultUrl(null)
        setStatusMsg(result.message)
        if (
          result.code === 'MISSING_FAL_KEY' ||
          result.code === 'SUBSCRIPTION_REQUIRED' ||
          result.code === 'QUOTA_EXCEEDED'
        ) {
          setAiConfigured(false)
        }
      }
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
      usedAi: Boolean(resultUrl),
      aiImageUrl: resultUrl,
    })

  return (
    <main className="visualise page-pad">
      <header className="visualise__header">
        <p className="eyebrow">Professional AI</p>
        <h1>Visualise with our products</h1>
        <p>
          Upload a clear room photo and visualise a real <strong>Priyabadal Homes</strong>{' '}
          kitchen, wardrobe, or interior piece in place — precise enough to show clients
          before they buy.
        </p>
        <p className={`visualise__mode ${aiConfigured ? 'is-live' : ''}`}>
          {aiConfigured
            ? `${aiEngine} · ${aiQuality} · ready`
            : 'Paid Interior AI · unlock with access code'}
        </p>
      </header>

      <AiAccessBanner
        onStatus={(s) => {
          setAiConfigured(
            Boolean(s.falConfigured && (!s.requireSubscription || s.subscribed)),
          )
          void fetchVisualiseStatus().then((st) => {
            if (st.model) setAiModel(st.model)
            if (st.quality) setAiQuality(st.quality)
            if (st.engine) setAiEngine(st.engine)
          })
        }}
      />

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
              <span>Tap to upload kitchen / room photo</span>
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
              }}
            >
              {kitchenFirst.map((p) => (
                <option key={p.id} value={p.id}>
                  {categories.find((c) => c.id === p.categoryId)?.name} — {p.name}
                </option>
              ))}
            </select>
          </label>

          {product ? (
            <div className="visualise__product">
              <img src={product.image} alt="" />
              <div>
                <strong>{product.name}</strong>
                <em>From {formatPrice(product.price)}</em>
                <Link to={`/product/${product.id}`}>View product</Link>
              </div>
            </div>
          ) : null}

          <h2>3. Visualisation style</h2>
          <div className="visualise__modes" role="radiogroup" aria-label="Visualisation style">
            {VISUALISE_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={
                  visualiseMode === m.id
                    ? 'visualise__mode-card is-active'
                    : 'visualise__mode-card'
                }
                onClick={() => setVisualiseMode(m.id)}
              >
                <strong>{m.label}</strong>
                <span>{m.hint}</span>
              </button>
            ))}
          </div>

          <h2>4. Finish colour</h2>
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
              placeholder="e.g. replace only lower cabinets; keep granite; warmer lighting"
            />
          </label>

          <button
            className="btn btn--dark"
            type="submit"
            disabled={busy || !aiConfigured}
          >
            {busy ? 'Rendering presentation image…' : 'Generate presentation AI'}
          </button>
          {!aiConfigured ? (
            <p className="visualise__status">
              Unlock paid AI above (or on the AI Subscribe page) to generate.
            </p>
          ) : null}
          {statusMsg ? <p className="visualise__status">{statusMsg}</p> : null}
        </section>

        <section className="visualise__result-panel">
          <h2>Presentation result</h2>
          {resultUrl && roomDataUrl ? (
            <div className="visualise__compare" aria-label="Before and after">
              <figure>
                <img src={roomDataUrl} alt="Your room before" />
                <figcaption>Your room</figcaption>
              </figure>
              <figure>
                <img src={resultUrl} alt="Priyabadal AI visualisation" />
                <figcaption>AI visualisation · {aiQuality}</figcaption>
              </figure>
            </div>
          ) : (
            <div className="visualise__result">
              {busy ? (
                <div className="visualise__result-empty">
                  <strong>Creating presentation image…</strong>
                  <span>
                    Matching catalog product references into your room at {aiQuality}.
                    Usually 20–70 seconds.
                  </span>
                </div>
              ) : null}
              {!busy && !resultUrl ? (
                <div className="visualise__result-empty">
                  <strong>Client-ready interior AI</strong>
                  <span>
                    Replace existing furniture with our products, install into a room, or
                    create a presentable redesign — photoreal, not a sticker collage.
                  </span>
                </div>
              ) : null}
            </div>
          )}

          {resultUrl && product && waHref ? (
            <>
              <p className="visualise__present-note">
                Share this with your client as a design preview. Final size, finish, and
                quote are confirmed on WhatsApp after site measure.
              </p>
              <div className="visualise__actions">
                <a
                  className="btn visualise__wa"
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp quote + AI photo
                </a>
                <Link className="btn btn--outline" to={`/product/${product.id}`}>
                  Customise &amp; price
                </Link>
                <a
                  className="btn btn--outline"
                  href={resultUrl}
                  download={`priyabadal-${product.id}-visualise.jpg`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Download presentation image
                </a>
              </div>
            </>
          ) : null}
          <p className="visualise__engine-note">{aiModel}</p>
        </section>
      </form>
    </main>
  )
}
