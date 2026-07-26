import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  buildChatWhatsAppUrl,
  colourFromBrief,
  createWelcomeMessage,
  messageForPhotoAttached,
  messageForProductSelected,
  processConsultTurn,
  type ChatMessage,
  type ConsultBrief,
} from '../lib/interiorAI'
import {
  VISUALISE_COLOURS,
  connectFalKey,
  fetchVisualiseStatus,
  fileToDataUrl,
  generateVisualise,
} from '../lib/visualise'
import { getCategory, formatPrice, type Product } from '../data/catalog'
import { getProductById } from '../lib/products'
import { useCurrency } from '../hooks/useCurrency'
import './ChatPage.css'

export function ChatPage() {
  useCurrency()
  const [messages, setMessages] = useState<ChatMessage[]>([createWelcomeMessage()])
  const [brief, setBrief] = useState<ConsultBrief>({})
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [aiConfigured, setAiConfigured] = useState(false)
  const [falKeyInput, setFalKeyInput] = useState('')
  const [savingKey, setSavingKey] = useState(false)
  const [keyMsg, setKeyMsg] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    void fetchVisualiseStatus().then((s) => setAiConfigured(s.configured))
  }, [])

  const push = (...next: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...next])
  }

  const runVisualise = async (current: ConsultBrief) => {
    const product = current.selectedProductId
      ? getProductById(current.selectedProductId)
      : undefined
    if (!product || !current.roomPhotoDataUrl) {
      push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'I need a selected product and a room photo before I can visualise.',
        suggestions: ['I will upload a photo', 'Suggest products'],
      })
      return
    }

    if (!aiConfigured) {
      push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Connect your Fal.ai key below (same as Visualise) so I can generate the room look in this chat.',
        suggestions: ['Suggest other styles'],
      })
      return
    }

    setBusy(true)
    try {
      const category = getCategory(product.categoryId)
      const colour = colourFromBrief(current)
      const sizeNote =
        current.widthFt != null && current.heightFt != null
          ? `Live size: ${current.widthFt} × ${current.heightFt}${
              current.depthFt != null ? ` × ${current.depthFt}` : ''
            } ft`
          : undefined
      const result = await generateVisualise({
        roomDataUrl: current.roomPhotoDataUrl,
        product,
        colour,
        notes: [sizeNote, current.notes].filter(Boolean).join('. '),
        categoryName: category?.name ?? product.categoryId,
        widthFt: current.widthFt,
        heightFt: current.heightFt,
        depthFt: current.depthFt,
      })

      if (result.source === 'ai' && result.imageUrl) {
        const nextBrief = { ...current, aiImageUrl: result.imageUrl }
        setBrief(nextBrief)
        push({
          id: crypto.randomUUID(),
          role: 'assistant',
          text: `${result.message}\n\nHere’s your visualisation with ${product.name}. You can ask for changes, pick another style, or WhatsApp the quote with this AI look.`,
          aiImageUrl: result.imageUrl,
          products: [product],
          suggestions: ['WhatsApp quote', 'Suggest other styles', 'I will upload a photo'],
        })
      } else {
        if (result.code === 'MISSING_FAL_KEY') setAiConfigured(false)
        push({
          id: crypto.randomUUID(),
          role: 'assistant',
          text: result.message,
          suggestions: ['Try visualise again', 'Suggest other styles'],
        })
      }
    } finally {
      setBusy(false)
    }
  }

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || busy) return

    if (/^whatsapp quote$/i.test(trimmed)) {
      const url = buildChatWhatsAppUrl(brief)
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        text: trimmed,
      }
      if (!url) {
        push(userMsg, {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: 'Select a product in the chat first, then WhatsApp quote will include your size, notes, and AI look (if generated).',
          suggestions: ['Suggest products', 'Kitchen remodel'],
        })
        setInput('')
        return
      }
      push(userMsg, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Opening WhatsApp with your consultation details. If an AI look was generated, its link is included.',
        suggestions: ['Visualise my look', 'Suggest other styles'],
      })
      setInput('')
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }

    if (/^i will upload a photo$/i.test(trimmed) || /^i have a room photo$/i.test(trimmed)) {
      push({
        id: crypto.randomUUID(),
        role: 'user',
        text: trimmed,
      })
      push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Use the Upload photo button below the message box — kitchen, bedroom, or puja wall photo works best (clear, straight-on).',
        suggestions: ['Suggest products'],
      })
      setInput('')
      fileRef.current?.click()
      return
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
    }
    const turn = processConsultTurn(brief, trimmed)
    setBrief(turn.brief)
    setMessages((prev) => [...prev, userMsg, turn.reply])
    setInput('')

    if (turn.shouldVisualise) {
      await runVisualise(turn.brief)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void send(input)
  }

  const onPickProduct = (product: Product) => {
    if (busy) return
    const next = { ...brief, selectedProductId: product.id, aiImageUrl: null }
    setBrief(next)
    push(
      {
        id: crypto.randomUUID(),
        role: 'user',
        text: `Use ${product.name}`,
      },
      messageForProductSelected(product, next),
    )
  }

  const onPhoto = async (file: File | null) => {
    if (!file || busy) return
    if (!file.type.startsWith('image/')) {
      push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Please upload a JPG or PNG room photo.',
      })
      return
    }
    setBusy(true)
    try {
      const dataUrl = await fileToDataUrl(file)
      const next = { ...brief, roomPhotoDataUrl: dataUrl, aiImageUrl: null }
      setBrief(next)
      push(
        {
          id: crypto.randomUUID(),
          role: 'user',
          text: 'Uploaded a room photo',
          imageUrl: dataUrl,
        },
        messageForPhotoAttached(next),
      )
    } catch {
      push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Could not read that photo. Try another image.',
      })
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const onConnectKey = async (e: FormEvent) => {
    e.preventDefault()
    setSavingKey(true)
    setKeyMsg(null)
    try {
      const next = await connectFalKey(falKeyInput.trim())
      setAiConfigured(next.configured)
      setFalKeyInput('')
      setKeyMsg('AI connected — you can visualise in this chat now.')
    } catch (err) {
      setKeyMsg(err instanceof Error ? err.message : 'Could not save AI key.')
    } finally {
      setSavingKey(false)
    }
  }

  const whatsapp = buildChatWhatsAppUrl(brief)
  const selected = brief.selectedProductId
    ? getProductById(brief.selectedProductId)
    : undefined
  const latestSuggestions =
    [...messages].reverse().find((m) => m.role === 'assistant' && m.suggestions?.length)
      ?.suggestions ?? []

  return (
    <main className="chat page-pad">
      <header className="chat__header">
        <p className="eyebrow">Consult · Build · Visualise</p>
        <h1>Design Chat</h1>
        <p>
          Discuss your space, share size and photos, get Priyabadal product suggestions, and see
          an AI visualisation of our furniture in your room — all in one conversation.
        </p>
      </header>

      {!aiConfigured ? (
        <section className="chat__keybox" aria-labelledby="chat-ai-key">
          <h2 id="chat-ai-key">Connect AI for in-chat visualisation</h2>
          <p>
            Same Fal.ai key as Visualise. Paste once to generate room looks here. Credits:{' '}
            <a href="https://fal.ai/dashboard/billing" target="_blank" rel="noreferrer">
              fal.ai/dashboard/billing
            </a>
            .
          </p>
          <form className="chat__key-form" onSubmit={onConnectKey}>
            <input
              type="password"
              value={falKeyInput}
              onChange={(e) => setFalKeyInput(e.target.value)}
              placeholder="Fal.ai API key"
              autoComplete="off"
              required
            />
            <button className="btn btn--dark" type="submit" disabled={savingKey}>
              {savingKey ? 'Connecting…' : 'Connect AI'}
            </button>
          </form>
          {keyMsg ? <p className="chat__key-msg">{keyMsg}</p> : null}
        </section>
      ) : (
        <p className="chat__ai-ready">AI visualisation ready in chat</p>
      )}

      <div className="chat__layout">
        <div className="chat__board">
          <div className="chat__messages" role="log" aria-live="polite">
            {messages.map((msg) => (
              <article key={msg.id} className={`bubble bubble--${msg.role}`}>
                <p className="bubble__text">{msg.text}</p>
                {msg.imageUrl ? (
                  <figure className="bubble__media">
                    <img src={msg.imageUrl} alt="Uploaded room photo" />
                    <figcaption>Your photo</figcaption>
                  </figure>
                ) : null}
                {msg.aiImageUrl ? (
                  <figure className="bubble__media bubble__media--ai">
                    <img src={msg.aiImageUrl} alt="AI visualisation" />
                    <figcaption>AI visualisation with our product</figcaption>
                    <div className="bubble__media-actions">
                      <a href={msg.aiImageUrl} target="_blank" rel="noopener noreferrer">
                        Open
                      </a>
                      <a href={msg.aiImageUrl} download="priyabadal-chat-visualise.jpg">
                        Download
                      </a>
                    </div>
                  </figure>
                ) : null}
                {msg.products && msg.products.length > 0 ? (
                  <div className="bubble__products">
                    {msg.products.map((product) => {
                      const selectedId = brief.selectedProductId === product.id
                      return (
                        <div
                          key={product.id}
                          className={`bubble__product ${selectedId ? 'is-selected' : ''}`}
                        >
                          <img src={product.image} alt="" />
                          <span>
                            <strong>{product.name}</strong>
                            <em>
                              from {formatPrice(product.price)}
                              {product.pricingMode === 'per-sqft' ? '/sq ft' : ''}
                            </em>
                          </span>
                          <div className="bubble__product-actions">
                            <button
                              type="button"
                              className="btn btn--dark"
                              onClick={() => onPickProduct(product)}
                              disabled={busy}
                            >
                              {selectedId ? 'Selected' : 'Use this'}
                            </button>
                            <Link className="btn btn--outline" to={`/product/${product.id}`}>
                              Details
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </article>
            ))}
            {busy ? (
              <article className="bubble bubble--assistant bubble--typing" aria-live="polite">
                <p className="bubble__text">Working on your design…</p>
              </article>
            ) : null}
            <div ref={endRef} />
          </div>

          {latestSuggestions.length > 0 ? (
            <div className="chat__suggestions">
              {latestSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="chip"
                  disabled={busy}
                  onClick={() => void send(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          <form className="chat__form" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="chat-input">
              Message
            </label>
            <input
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Wardrobe 8 x 7 ft, modern, more hanging space"
              autoComplete="off"
              disabled={busy}
            />
            <button
              className="btn btn--outline chat__upload"
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              Upload photo
            </button>
            <button className="btn btn--dark" type="submit" disabled={busy || !input.trim()}>
              Send
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => void onPhoto(e.target.files?.[0] || null)}
            />
          </form>
        </div>

        <aside className="chat__brief" aria-label="Consultation brief">
          <h2>Your brief</h2>
          <ul>
            <li>
              <span>Space</span>
              <strong>{brief.room ?? '—'}</strong>
            </li>
            <li>
              <span>Size</span>
              <strong>
                {brief.widthFt != null && brief.heightFt != null
                  ? `${brief.widthFt} × ${brief.heightFt}${
                      brief.depthFt != null ? ` × ${brief.depthFt}` : ''
                    } ft`
                  : '—'}
              </strong>
            </li>
            <li>
              <span>Style</span>
              <strong>{brief.style ?? '—'}</strong>
            </li>
            <li>
              <span>Product</span>
              <strong>{selected?.name ?? '—'}</strong>
            </li>
            <li>
              <span>Photo</span>
              <strong>{brief.roomPhotoDataUrl ? 'Attached' : '—'}</strong>
            </li>
            <li>
              <span>AI look</span>
              <strong>{brief.aiImageUrl ? 'Ready' : '—'}</strong>
            </li>
          </ul>
          {brief.notes ? <p className="chat__brief-notes">{brief.notes}</p> : null}
          {brief.roomPhotoDataUrl ? (
            <img
              className="chat__brief-thumb"
              src={brief.roomPhotoDataUrl}
              alt="Room photo preview"
            />
          ) : null}
          {brief.aiImageUrl ? (
            <img
              className="chat__brief-thumb"
              src={brief.aiImageUrl}
              alt="AI visualisation preview"
            />
          ) : null}
          <div className="chat__brief-actions">
            <button
              type="button"
              className="btn btn--dark"
              disabled={busy || !brief.selectedProductId || !brief.roomPhotoDataUrl}
              onClick={() => void runVisualise(brief)}
            >
              Visualise in chat
            </button>
            {whatsapp ? (
              <a
                className="whatsapp-quote-btn"
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
              >
                {brief.aiImageUrl ? 'WhatsApp + AI photo' : 'WhatsApp quote'}
              </a>
            ) : (
              <p className="chat__brief-hint">Select a product to enable WhatsApp quote.</p>
            )}
            <Link className="btn btn--outline" to="/visualise">
              Full Visualise page
            </Link>
            <Link className="btn btn--outline" to="/design">
              Design my space
            </Link>
          </div>
          <p className="chat__brief-finish">
            Finish cue in AI:{' '}
            {VISUALISE_COLOURS.find((c) => c.id === colourFromBrief(brief).id)?.label}
          </p>
        </aside>
      </div>
    </main>
  )
}
