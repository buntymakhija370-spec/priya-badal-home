import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { categories, formatPrice, getCategory } from '../data/catalog'
import { getAllProducts, getProductById } from '../lib/products'
import {
  VISUALISE_COLOURS,
  buildVisualiseWhatsAppUrl,
  connectFalKey,
  fetchVisualiseStatus,
  fileToDataUrl,
  generateVisualise,
  type VisualiseColour,
} from '../lib/visualise'
import { useCurrency } from '../hooks/useCurrency'
import './VisualisePage.css'

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
  const [busy, setBusy] = useState(false)
  const [savingKey, setSavingKey] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [keyMsg, setKeyMsg] = useState<string | null>(null)
  const [falKeyInput, setFalKeyInput] = useState('')
  const [aiConfigured, setAiConfigured] = useState(false)
  const [aiModel, setAiModel] = useState('fal-ai/nano-banana-pro/edit')

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

  const onConnectKey = async (e: FormEvent) => {
    e.preventDefault()
    setSavingKey(true)
    setKeyMsg(null)
    setStatusMsg(null)
    try {
      const next = await connectFalKey(falKeyInput.trim())
      setAiConfigured(next.configured)
      if (next.model) setAiModel(next.model)
      setFalKeyInput('')
      setKeyMsg('Professional AI connected. You can generate now.')
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Could not save AI key.')
    } finally {
      setSavingKey(false)
    }
  }

  const onGenerate = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!roomDataUrl || !product || !category) {
      setStatusMsg('Upload a room photo and select a product first.')
      return
    }
    if (!aiConfigured) {
      setStatusMsg('Connect your Fal.ai key first for professional renders.')
      return
    }

    setBusy(true)
    setResultUrl(null)
    setStatusMsg('Uploading photos and running professional AI edit…')
    try {
      const result = await generateVisualise({
        roomDataUrl,
        product,
        colour,
        notes: notes.trim() || undefined,
        categoryName: category.name,
      })

      if (result.source === 'ai' && result.imageUrl) {
        setResultUrl(result.imageUrl)
        setStatusMsg(result.message)
      } else {
        setResultUrl(null)
        setStatusMsg(result.message)
        if (result.code === 'MISSING_FAL_KEY') {
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
    })

  return (
    <main className="visualise page-pad">
      <header className="visualise__header">
        <p className="eyebrow">Professional AI</p>
        <h1>Visualise with our products</h1>
        <p>
          Upload your kitchen or room photo. We use a paid AI model to redesign the
          space with a real <strong>Priyabadal Homes</strong> product — not a sticker
          collage.
        </p>
        <p className={`visualise__mode ${aiConfigured ? 'is-live' : ''}`}>
          {aiConfigured
            ? `Professional AI ready · ${aiModel}`
            : 'AI key required · connect Fal below (no fake previews)'}
        </p>
      </header>

      {!aiConfigured ? (
        <section className="visualise__keybox" aria-labelledby="connect-ai">
          <h2 id="connect-ai">Connect professional AI</h2>
          <p>
            Get a paid key from{' '}
            <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noreferrer">
              fal.ai/dashboard/keys
            </a>
            , then paste it here. We only show real AI renders — never a cheap overlay.
          </p>
          <form className="visualise__key-form" onSubmit={onConnectKey}>
            <label className="visualise__field">
              <span>Fal API key</span>
              <input
                type="password"
                value={falKeyInput}
                onChange={(e) => setFalKeyInput(e.target.value)}
                placeholder="Paste Fal key"
                autoComplete="off"
                required
              />
            </label>
            <button className="btn btn--dark" type="submit" disabled={savingKey}>
              {savingKey ? 'Connecting…' : 'Connect AI'}
            </button>
          </form>
          {keyMsg ? <p className="visualise__key-ok">{keyMsg}</p> : null}
        </section>
      ) : null}

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
              placeholder="e.g. change only lower cabinets; keep existing granite"
            />
          </label>

          <button
            className="btn btn--dark"
            type="submit"
            disabled={busy || !aiConfigured}
          >
            {busy ? 'Generating professional render…' : 'Generate with AI'}
          </button>
          {!aiConfigured ? (
            <p className="visualise__status">
              Connect your Fal key above to unlock generation.
            </p>
          ) : null}
          {statusMsg ? <p className="visualise__status">{statusMsg}</p> : null}
        </section>

        <section className="visualise__result-panel">
          <h2>Result</h2>
          <div className="visualise__result">
            {busy ? (
              <div className="visualise__result-empty">
                <strong>Working…</strong>
                <span>
                  Uploading your photos and running a professional AI edit. Usually
                  20–60 seconds.
                </span>
              </div>
            ) : null}
            {!busy && resultUrl ? (
              <img src={resultUrl} alt="Professional AI visualisation" />
            ) : null}
            {!busy && !resultUrl ? (
              <div className="visualise__result-empty">
                <strong>No sticker previews</strong>
                <span>
                  Your photorealistic room edit will appear here after professional AI
                  generation.
                </span>
              </div>
            ) : null}
          </div>

          {resultUrl && product && waHref ? (
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
              <a
                className="btn btn--outline"
                href={resultUrl}
                download="priyabadal-visualise.jpg"
              >
                Download image
              </a>
            </div>
          ) : null}
        </section>
      </form>
    </main>
  )
}
