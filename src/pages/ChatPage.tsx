import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  buildChatWhatsAppUrl,
  colourFromBrief,
  createWelcomeMessage,
  looksLikeDrawingIntent,
  messageForPhotoAttached,
  messageForProductSelected,
  processConsultTurn,
  type ChatMessage,
  type ConsultBrief,
} from '../lib/interiorAI'
import {
  connectFalKey,
  fetchVisualiseStatus,
  fileToDataUrl,
  generateVisualise,
} from '../lib/visualise'
import { getCategory, formatPrice, type Product } from '../data/catalog'
import { getProductById } from '../lib/products'
import { useCurrency } from '../hooks/useCurrency'
import './ChatPage.css'

type AttachMode = 'photo' | 'drawing'

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
  const [showKey, setShowKey] = useState(false)
  const [attachMode, setAttachMode] = useState<AttachMode>('photo')
  const [pendingFile, setPendingFile] = useState<{
    dataUrl: string
    kind: AttachMode
  } | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy, pendingFile])

  useEffect(() => {
    void fetchVisualiseStatus().then((s) => {
      setAiConfigured(s.configured)
      if (!s.configured) setShowKey(false)
    })
  }, [])

  const push = (...next: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...next])
  }

  const runVisualise = async (current: ConsultBrief, refine = false) => {
    const product = current.selectedProductId
      ? getProductById(current.selectedProductId)
      : undefined
    if (!product || !current.roomPhotoDataUrl) {
      push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'I need a product from our list plus a room photo or architect drawing before I can visualise.',
        suggestions: ['Attach room photo', 'I have an architect drawing', 'Suggest products'],
      })
      return
    }

    const shouldRefine =
      refine && Boolean(current.aiImageUrl) && Boolean(current.lastChangeRequest?.trim())

    if (!aiConfigured) {
      setShowKey(true)
      push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Connect the AI key (top right) so I can generate visualisations in this chat — same Fal key as Visualise.',
        suggestions: ['Suggest other styles'],
      })
      return
    }

    setBusy(true)
    try {
      const category = getCategory(product.categoryId)
      const colour = colourFromBrief(current)
      const kind = current.attachmentKind ?? 'photo'
      const sizeNote =
        current.widthFt != null && current.heightFt != null
          ? `Live size: ${current.widthFt} × ${current.heightFt}${
              current.depthFt != null ? ` × ${current.depthFt}` : ''
            } ft`
          : undefined
      const drawingNote =
        kind === 'drawing'
          ? 'Input is an interior architect drawing (plan / elevation / sketch). Follow the drawing layout; install Priyabadal catalog product style.'
          : undefined
      const result = await generateVisualise({
        roomDataUrl: current.roomPhotoDataUrl,
        product,
        colour,
        notes: [drawingNote, sizeNote, current.notes].filter(Boolean).join('. '),
        categoryName: category?.name ?? product.categoryId,
        widthFt: current.widthFt,
        heightFt: current.heightFt,
        depthFt: current.depthFt,
        inputKind: kind,
        refineImageUrl: shouldRefine ? current.aiImageUrl ?? undefined : undefined,
        changeRequest: shouldRefine
          ? current.lastChangeRequest ?? undefined
          : undefined,
      })

      if (result.source === 'ai' && result.imageUrl) {
        const nextBrief: ConsultBrief = {
          ...current,
          aiImageUrl: result.imageUrl,
          // Keep last change visible in brief; next message can overwrite it
          lastChangeRequest: shouldRefine ? current.lastChangeRequest : null,
        }
        setBrief(nextBrief)
        push({
          id: crypto.randomUUID(),
          role: 'assistant',
          text: shouldRefine
            ? `${result.message}\n\nUpdated look for ${product.name}. Say another clear change (e.g. “make it lighter”), keep chatting, or WhatsApp the quote.`
            : `${result.message}\n\nVisualisation of ${product.name}${
                kind === 'drawing' ? ' from your architect drawing' : ' in your room photo'
              }.\n\nIf something is off, tell me a specific change — or attach a clearer straight-on wall photo and visualise again for better accuracy.`,
          aiImageUrl: result.imageUrl,
          products: [product],
          suggestions: [
            'Make it lighter',
            'Make it darker',
            'Add more hanging',
            'Remove handles',
            'WhatsApp quote',
          ],
        })
      } else {
        if (result.code === 'MISSING_FAL_KEY') {
          setAiConfigured(false)
          setShowKey(true)
        }
        push({
          id: crypto.randomUUID(),
          role: 'assistant',
          text: result.message,
          suggestions: ['Try visualise again', 'Make it lighter', 'Suggest other styles'],
        })
      }
    } finally {
      setBusy(false)
    }
  }

  const send = async (text: string) => {
    const trimmed = text.trim()
    // Allow chatting while idle; only block during an active AI render
    if (!trimmed) return
    if (busy) {
      push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'One moment — I’m still finishing the current visualisation. Send your next message right after it appears.',
      })
      return
    }

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
          text: 'Select a product from our list first — then WhatsApp will include size, notes, and AI look.',
          suggestions: ['Suggest products', 'Kitchen remodel'],
        })
        setInput('')
        return
      }
      push(userMsg, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Opening WhatsApp with your Priya Badal AI consultation.',
        suggestions: ['Visualise my look', 'Suggest other styles'],
      })
      setInput('')
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }

    if (
      /^(attach room photo|i will upload a photo|i have a room photo)$/i.test(trimmed)
    ) {
      setAttachMode('photo')
      push(
        { id: crypto.randomUUID(), role: 'user', text: trimmed },
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: 'Attach a clear room or wall photo with the paperclip — straight-on kitchen, wardrobe wall, or puja wall works best.',
          suggestions: ['Suggest products'],
        },
      )
      setInput('')
      fileRef.current?.click()
      return
    }

    if (
      /^(attach drawing|i have an architect drawing)$/i.test(trimmed)
    ) {
      setAttachMode('drawing')
      push(
        { id: crypto.randomUUID(), role: 'user', text: trimmed },
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: 'Attach your architect drawing — floor plan, elevation, section, or dimensioned sketch. I’ll map our catalog products onto that layout when you visualise.',
          suggestions: ['Suggest products', 'Kitchen remodel'],
        },
      )
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
    inputRef.current?.focus()

    if (turn.shouldVisualise) {
      await runVisualise(turn.brief, Boolean(turn.refine))
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void send(input)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send(input)
    }
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

  const onFilePicked = async (file: File | null) => {
    if (!file || busy) return
    if (!file.type.startsWith('image/')) {
      push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Please upload a JPG or PNG (room photo or drawing scan).',
      })
      return
    }
    setBusy(true)
    try {
      const dataUrl = await fileToDataUrl(file)
      const kind: AttachMode =
        attachMode === 'drawing' || looksLikeDrawingIntent('', file.name)
          ? 'drawing'
          : 'photo'
      setPendingFile({ dataUrl, kind })
      setAttachMode(kind)
    } catch {
      push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Could not read that file. Try another image.',
      })
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const confirmAttach = async () => {
    if (!pendingFile || busy) return
    const next: ConsultBrief = {
      ...brief,
      roomPhotoDataUrl: pendingFile.dataUrl,
      attachmentKind: pendingFile.kind,
      aiImageUrl: null,
    }
    setBrief(next)
    setPendingFile(null)
    push(
      {
        id: crypto.randomUUID(),
        role: 'user',
        text:
          pendingFile.kind === 'drawing'
            ? 'Uploaded an architect drawing'
            : 'Uploaded a room photo',
        imageUrl: pendingFile.dataUrl,
        imageKind: pendingFile.kind,
      },
      messageForPhotoAttached(next),
    )
  }

  const onConnectKey = async (e: FormEvent) => {
    e.preventDefault()
    setSavingKey(true)
    setKeyMsg(null)
    try {
      const next = await connectFalKey(falKeyInput.trim())
      setAiConfigured(next.configured)
      setFalKeyInput('')
      setKeyMsg('AI connected — visualise in chat anytime.')
      setShowKey(false)
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
  const showWelcomeHero = messages.length <= 1 && !busy

  return (
    <main className="pbai">
      <header className="pbai__top">
        <div className="pbai__brand">
          <img
            src="/brand/priyabadal-homes-logo.svg"
            alt=""
            className="pbai__logo"
          />
          <div>
            <p className="pbai__title">Priya Badal AI</p>
            <p className="pbai__subtitle">
              Interior chat · photos · architect drawings · catalog visualise
            </p>
          </div>
        </div>
        <div className="pbai__top-actions">
          <span className={`pbai__status ${aiConfigured ? 'is-live' : ''}`}>
            {aiConfigured ? 'Visualise on' : 'Connect AI'}
          </span>
          <button
            type="button"
            className="pbai__ghost"
            onClick={() => setShowKey((v) => !v)}
          >
            {showKey ? 'Close' : 'AI key'}
          </button>
        </div>
      </header>

      {showKey || !aiConfigured ? (
        <section className="pbai__key" aria-label="Connect AI">
          <p>
            Paste your Fal.ai key to generate visualisations in chat (same as Visualise).{' '}
            <a href="https://fal.ai/dashboard/billing" target="_blank" rel="noreferrer">
              Billing
            </a>
          </p>
          <form onSubmit={onConnectKey}>
            <input
              type="password"
              value={falKeyInput}
              onChange={(e) => setFalKeyInput(e.target.value)}
              placeholder="Fal.ai API key"
              autoComplete="off"
              required
            />
            <button className="btn btn--dark" type="submit" disabled={savingKey}>
              {savingKey ? 'Connecting…' : 'Connect'}
            </button>
          </form>
          {keyMsg ? <p className="pbai__key-msg">{keyMsg}</p> : null}
        </section>
      ) : null}

      <div className="pbai__brief-bar" aria-label="Session brief">
        <span>{brief.room ?? 'Space?'}</span>
        <span>
          {brief.widthFt != null && brief.heightFt != null
            ? `${brief.widthFt}×${brief.heightFt}${brief.depthFt != null ? `×${brief.depthFt}` : ''} ft`
            : 'Size?'}
        </span>
        <span>{selected?.name ?? 'Product?'}</span>
        <span>
          {brief.roomPhotoDataUrl
            ? brief.attachmentKind === 'drawing'
              ? 'Drawing'
              : 'Photo'
            : 'Attach?'}
        </span>
        <span>{brief.aiImageUrl ? 'AI ready' : 'No AI yet'}</span>
      </div>

      <div className="pbai__scroll" role="log" aria-live="polite">
        <div className="pbai__thread">
          {showWelcomeHero ? (
            <div className="pbai__hero">
              <img
                src="/brand/priyabadal-homes-logo.svg"
                alt="Priyabadal Homes"
                className="pbai__hero-logo"
              />
              <h1>Priya Badal AI</h1>
              <p>
                Chitchat about your interior. Send a room photo or architect drawing. I’ll
                suggest from our product list and visualise the look.
              </p>
            </div>
          ) : null}

          {messages.map((msg) => (
            <article key={msg.id} className={`pbai-msg pbai-msg--${msg.role}`}>
              {msg.role === 'assistant' ? (
                <div className="pbai-msg__avatar" aria-hidden="true">
                  PB
                </div>
              ) : null}
              <div className="pbai-msg__body">
                {msg.role === 'assistant' ? (
                  <p className="pbai-msg__label">Priya Badal AI</p>
                ) : null}
                <div className="pbai-msg__bubble">
                  <p className="pbai-msg__text">{msg.text}</p>
                  {msg.imageUrl ? (
                    <figure className="pbai-msg__media">
                      <img
                        src={msg.imageUrl}
                        alt={
                          msg.imageKind === 'drawing'
                            ? 'Architect drawing'
                            : 'Room photo'
                        }
                      />
                      <figcaption>
                        {msg.imageKind === 'drawing'
                          ? 'Architect drawing'
                          : 'Room photo'}
                      </figcaption>
                    </figure>
                  ) : null}
                  {msg.aiImageUrl ? (
                    <figure className="pbai-msg__media pbai-msg__media--ai">
                      <img src={msg.aiImageUrl} alt="AI visualisation" />
                      <figcaption>AI visualisation · our product</figcaption>
                      <div className="pbai-msg__links">
                        <a href={msg.aiImageUrl} target="_blank" rel="noopener noreferrer">
                          Open
                        </a>
                        <a href={msg.aiImageUrl} download="priya-badal-ai.jpg">
                          Download
                        </a>
                      </div>
                    </figure>
                  ) : null}
                  {msg.products && msg.products.length > 0 ? (
                    <div className="pbai-products">
                      {msg.products.map((product) => {
                        const on = brief.selectedProductId === product.id
                        return (
                          <div
                            key={product.id}
                            className={`pbai-product ${on ? 'is-on' : ''}`}
                          >
                            <img src={product.image} alt="" />
                            <div className="pbai-product__meta">
                              <strong>{product.name}</strong>
                              <em>
                                from {formatPrice(product.price)}
                                {product.pricingMode === 'per-sqft' ? '/sq ft' : ''}
                              </em>
                            </div>
                            <div className="pbai-product__actions">
                              <button
                                type="button"
                                className="btn btn--dark"
                                disabled={busy}
                                onClick={() => onPickProduct(product)}
                              >
                                {on ? 'Selected' : 'Use this'}
                              </button>
                              <Link
                                className="btn btn--outline"
                                to={`/product/${product.id}`}
                              >
                                Details
                              </Link>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}

          {busy ? (
            <article className="pbai-msg pbai-msg--assistant">
              <div className="pbai-msg__avatar" aria-hidden="true">
                PB
              </div>
              <div className="pbai-msg__body">
                <p className="pbai-msg__label">Priya Badal AI</p>
                <div className="pbai-msg__bubble pbai-msg__bubble--typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </article>
          ) : null}
          <div ref={endRef} />
        </div>
      </div>

      <footer className="pbai__composer-wrap">
        {latestSuggestions.length > 0 ? (
          <div className="pbai__chips">
            {latestSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="pbai-chip"
                disabled={busy}
                onClick={() => void send(s)}
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}

        {pendingFile ? (
          <div className="pbai__pending">
            <img src={pendingFile.dataUrl} alt="" />
            <div>
              <p>
                Ready to send as{' '}
                <strong>
                  {pendingFile.kind === 'drawing' ? 'architect drawing' : 'room photo'}
                </strong>
              </p>
              <div className="pbai__pending-actions">
                <button
                  type="button"
                  className={pendingFile.kind === 'photo' ? 'is-on' : ''}
                  onClick={() =>
                    setPendingFile((p) => (p ? { ...p, kind: 'photo' } : p))
                  }
                >
                  Photo
                </button>
                <button
                  type="button"
                  className={pendingFile.kind === 'drawing' ? 'is-on' : ''}
                  onClick={() =>
                    setPendingFile((p) => (p ? { ...p, kind: 'drawing' } : p))
                  }
                >
                  Drawing
                </button>
                <button type="button" className="btn btn--dark" onClick={() => void confirmAttach()}>
                  Add to chat
                </button>
                <button type="button" className="pbai__ghost" onClick={() => setPendingFile(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <form className="pbai__composer" onSubmit={onSubmit}>
          <div className="pbai__composer-box">
            <textarea
              ref={inputRef}
              id="chat-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Message Priya Badal AI — size, style, or ask to visualise…"
              disabled={busy}
            />
            <div className="pbai__composer-tools">
              <div className="pbai__attach-group" role="group" aria-label="Attach">
                <button
                  type="button"
                  className={attachMode === 'photo' ? 'is-on' : ''}
                  disabled={busy}
                  title="Room photo"
                  onClick={() => {
                    setAttachMode('photo')
                    fileRef.current?.click()
                  }}
                >
                  Photo
                </button>
                <button
                  type="button"
                  className={attachMode === 'drawing' ? 'is-on' : ''}
                  disabled={busy}
                  title="Architect drawing"
                  onClick={() => {
                    setAttachMode('drawing')
                    fileRef.current?.click()
                  }}
                >
                  Drawing
                </button>
              </div>
              <button
                type="button"
                className="pbai__tool"
                disabled={
                  busy || !brief.selectedProductId || !brief.roomPhotoDataUrl
                }
                onClick={() =>
                  void runVisualise(
                    brief,
                    Boolean(brief.aiImageUrl && brief.lastChangeRequest),
                  )
                }
              >
                {brief.aiImageUrl && brief.lastChangeRequest
                  ? 'Apply change'
                  : 'Visualise'}
              </button>
              {whatsapp ? (
                <a
                  className="pbai__tool pbai__tool--wa"
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              ) : null}
              <button
                className="pbai__send"
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send"
              >
                Send
              </button>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => void onFilePicked(e.target.files?.[0] || null)}
          />
          <p className="pbai__hint">
            Enter to send · Shift+Enter for new line · Drawings & photos visualise with our
            product list
          </p>
        </form>
      </footer>
    </main>
  )
}
