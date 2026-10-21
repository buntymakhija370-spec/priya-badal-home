import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BULK_TIERS,
  FURNICHER_BRAND,
  FURNICHER_CATEGORIES,
  FURNICHER_PARENT,
  FURNICHER_PRODUCTS,
  FURNICHER_TAGLINE,
  type FurnicherCategoryId,
  type ChatMessage,
  type ProjectBrief,
  buildBoq,
  boqWhatsAppText,
  formatInr,
  furnicherAiReply,
  initialAiMessages,
} from '../data/furnicherAi'
import { WHATSAPP_CHAT_URL, WHATSAPP_DISPLAY } from '../lib/whatsapp'
import './FurnicherAiPage.css'

type PanelId = 'ai' | 'market' | 'plan' | 'boq'

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function FurnicherAiPage() {
  const [started, setStarted] = useState(false)
  const [panel, setPanel] = useState<PanelId>('ai')
  const [messages, setMessages] = useState<ChatMessage[]>(() => initialAiMessages())
  const [input, setInput] = useState('')
  const [brief, setBrief] = useState<ProjectBrief>({ needs: [] })
  const [filter, setFilter] = useState<FurnicherCategoryId | 'all'>('all')
  const [selections, setSelections] = useState<Record<string, number>>({})
  const [planName, setPlanName] = useState<string | undefined>()
  const [planPreview, setPlanPreview] = useState<string | undefined>()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const boq = useMemo(() => buildBoq(selections), [selections])
  const selectedCount = boq.totalQty

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, started])

  function startExperience() {
    setStarted(true)
    setPanel('ai')
  }

  function sendUser(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    const userMsg: ChatMessage = { id: uid(), role: 'user', text: trimmed }
    const { reply, brief: nextBrief, suggestMarketplace } = furnicherAiReply(trimmed, brief)
    setBrief(nextBrief)
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: uid(), role: 'ai', text: reply },
    ])
    setInput('')
    if (suggestMarketplace) {
      // soft nudge — user can switch when ready
    }
  }

  function quickPrompt(text: string) {
    sendUser(text)
  }

  function setQty(productId: string, qty: number, moq: number) {
    setSelections((prev) => {
      const next = { ...prev }
      if (qty <= 0) delete next[productId]
      else next[productId] = Math.max(qty, 0)
      // allow below MOQ in UI but BOQ will still show; toast via AI note
      void moq
      return next
    })
  }

  function onPlanFile(file: File | null) {
    if (!file) return
    setPlanName(file.name)
    setBrief((b) => ({ ...b, hasPlan: true }))
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setPlanPreview(reader.result)
    }
    reader.readAsDataURL(file)
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: 'ai',
        text: `Floor plan received: **${file.name}**. I’ll keep project discussion aligned to this upload. Continue selecting in Marketplace — BOQ will note that a plan is attached. Final measure & production stay with Priyabadal Homes.`,
      },
    ])
    setPanel('ai')
  }

  const waHref = useMemo(() => {
    const text = boqWhatsAppText({
      brief,
      lines: boq.lines,
      tier: boq.tier,
      grandTotal: boq.grandTotal,
      listTotal: boq.listTotal,
      planName,
    })
    return `${WHATSAPP_CHAT_URL}?text=${encodeURIComponent(text)}`
  }, [brief, boq, planName])

  const marketProducts =
    filter === 'all'
      ? FURNICHER_PRODUCTS
      : FURNICHER_PRODUCTS.filter((p) => p.categoryId === filter)

  if (!started) {
    return (
      <main className="fa">
        <section className="fa-gate">
          <div className="fa-gate__glow" aria-hidden="true" />
          <div className="fa-gate__content">
            <p className="fa-gate__eyebrow">{FURNICHER_PARENT}</p>
            <h1 className="fa-gate__brand">{FURNICHER_BRAND}</h1>
            <p className="fa-gate__tag">{FURNICHER_TAGLINE}</p>
            <p className="fa-gate__lede">
              An AI project desk for hotel owners and bulk buyers — explore beds, bedside
              units, wardrobes, TV units, sofas, and room packages. Build a full BOQ. Every
              FurnicherAI answer is a Priyabadal Homes bulk verdict.
            </p>
            <div className="fa-gate__actions">
              <button type="button" className="fa-btn fa-btn--primary" onClick={startExperience}>
                Start FurnicherAI
              </button>
              <button
                type="button"
                className="fa-btn fa-btn--ghost"
                onClick={() => {
                  startExperience()
                  setPanel('market')
                }}
              >
                Open marketplace
              </button>
            </div>
            <ul className="fa-gate__points">
              <li>AI chat scoped to hotel / hostel / commercial bulk</li>
              <li>Marketplace · select · quantity · live bulk discount</li>
              <li>BOQ quotation · WhatsApp close with Priyabadal Homes</li>
              <li>Optional floor plan upload (2D / 3D / PDF / image)</li>
            </ul>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="fa fa--app">
      <header className="fa-top">
        <div className="fa-top__brand">
          <p className="fa-top__eyebrow">AI bulk desk</p>
          <h1>{FURNICHER_BRAND}</h1>
          <p className="fa-top__sub">{FURNICHER_PARENT}</p>
        </div>
        <div className="fa-top__meta">
          {brief.projectType ? (
            <span>
              {brief.projectType}
              {brief.roomCount ? ` · ${brief.roomCount} units` : ''}
            </span>
          ) : (
            <span>Brief in progress</span>
          )}
          <span className={selectedCount ? 'is-hot' : ''}>
            {selectedCount} in BOQ
          </span>
        </div>
      </header>

      <nav className="fa-tabs" aria-label="FurnicherAI panels">
        {(
          [
            ['ai', 'AI desk'],
            ['market', 'Marketplace'],
            ['plan', 'Floor plan'],
            ['boq', `BOQ${selectedCount ? ` (${selectedCount})` : ''}`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={panel === id ? 'is-active' : ''}
            onClick={() => setPanel(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {panel === 'ai' && (
        <section className="fa-panel fa-chat" aria-label="FurnicherAI chat">
          <div className="fa-chat__thread">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`fa-bubble fa-bubble--${m.role}`}
                dangerouslySetInnerHTML={{
                  __html: m.text
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br/>'),
                }}
              />
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="fa-chat__quick" aria-label="Quick prompts">
            {[
              'Hotel project',
              'Hostel 40 rooms',
              'I need beds bedside wardrobe',
              'Show bulk discount',
              'I want a full BOQ',
            ].map((q) => (
              <button key={q} type="button" onClick={() => quickPrompt(q)}>
                {q}
              </button>
            ))}
            <button type="button" onClick={() => setPanel('market')}>
              Go to marketplace →
            </button>
          </div>
          <form
            className="fa-chat__composer"
            onSubmit={(e) => {
              e.preventDefault()
              sendUser(input)
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask FurnicherAI about your bulk project…"
              aria-label="Message FurnicherAI"
            />
            <button type="submit" className="fa-btn fa-btn--primary">
              Send
            </button>
          </form>
        </section>
      )}

      {panel === 'market' && (
        <section className="fa-panel fa-market" aria-label="FurnicherAI marketplace">
          <header className="fa-market__head">
            <div>
              <h2>Marketplace</h2>
              <p>Dream, select, set quantity — then open BOQ for the full quotation.</p>
            </div>
            <button type="button" className="fa-btn fa-btn--primary" onClick={() => setPanel('boq')}>
              View BOQ
            </button>
          </header>
          <div className="fa-filters" role="tablist" aria-label="Categories">
            <button
              type="button"
              className={filter === 'all' ? 'is-active' : ''}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            {FURNICHER_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={filter === c.id ? 'is-active' : ''}
                onClick={() => setFilter(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="fa-grid">
            {marketProducts.map((p) => {
              const qty = selections[p.id] || 0
              const tier = boq.tier
              const net = Math.round(p.unitPrice * (1 - tier.discount))
              return (
                <article key={p.id} className="fa-card">
                  <div className="fa-card__media">
                    <img src={p.image} alt="" loading="lazy" />
                  </div>
                  <div className="fa-card__body">
                    <p className="fa-card__cat">
                      {FURNICHER_CATEGORIES.find((c) => c.id === p.categoryId)?.name}
                    </p>
                    <h3>{p.name}</h3>
                    <p className="fa-card__tag">{p.tagline}</p>
                    <p className="fa-card__desc">{p.description}</p>
                    {p.includes ? (
                      <p className="fa-card__includes">Includes: {p.includes.join(' · ')}</p>
                    ) : null}
                    <p className="fa-card__price">
                      <strong>{formatInr(net)}</strong>
                      {tier.discount > 0 ? (
                        <span className="fa-card__list">{formatInr(p.unitPrice)}</span>
                      ) : null}
                      <span className="fa-card__moq">MOQ {p.moq}</span>
                    </p>
                    <div className="fa-card__qty">
                      <button
                        type="button"
                        aria-label="Decrease"
                        onClick={() => setQty(p.id, qty - 1, p.moq)}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={qty || ''}
                        placeholder="0"
                        onChange={(e) =>
                          setQty(p.id, Number(e.target.value) || 0, p.moq)
                        }
                        aria-label={`Quantity for ${p.name}`}
                      />
                      <button
                        type="button"
                        aria-label="Increase"
                        onClick={() => setQty(p.id, qty ? qty + 1 : p.moq, p.moq)}
                      >
                        +
                      </button>
                      {!qty ? (
                        <button
                          type="button"
                          className="fa-card__add"
                          onClick={() => setQty(p.id, p.moq, p.moq)}
                        >
                          Add MOQ
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {panel === 'plan' && (
        <section className="fa-panel fa-plan" aria-label="Floor plan upload">
          <h2>Floor plan desk</h2>
          <p>
            Upload 2D / 3D exports, PDF, or photos of your layout. FurnicherAI notes the file
            in your project brief and BOQ. Detailed measure remains with Priyabadal Homes.
          </p>
          <div className="fa-plan__drop">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,.dwg,.dxf"
              hidden
              onChange={(e) => onPlanFile(e.target.files?.[0] || null)}
            />
            <button type="button" className="fa-btn fa-btn--primary" onClick={() => fileRef.current?.click()}>
              Upload floor plan
            </button>
            {planName ? <p className="fa-plan__name">Attached: {planName}</p> : null}
            {planPreview?.startsWith('data:image') ? (
              <img className="fa-plan__preview" src={planPreview} alt="Floor plan preview" />
            ) : null}
          </div>
          <div className="fa-plan__actions">
            <button type="button" className="fa-btn fa-btn--ghost" onClick={() => setPanel('ai')}>
              Discuss plan with AI
            </button>
            <button type="button" className="fa-btn fa-btn--primary" onClick={() => setPanel('market')}>
              Select in marketplace
            </button>
          </div>
        </section>
      )}

      {panel === 'boq' && (
        <section className="fa-panel fa-boq" aria-label="BOQ quotation">
          <header className="fa-boq__head">
            <div>
              <h2>BOQ &amp; quotation</h2>
              <p>
                Draft commercial sheet from your selections. Final rates, finishes, and install
                calendar confirmed by Priyabadal Homes.
              </p>
            </div>
            {boq.lines.length ? (
              <a className="fa-btn fa-btn--primary" href={waHref} target="_blank" rel="noopener noreferrer">
                WhatsApp BOQ · {WHATSAPP_DISPLAY}
              </a>
            ) : null}
          </header>

          {!boq.lines.length ? (
            <div className="fa-boq__empty">
              <p>No items yet. Explore the marketplace and add quantities.</p>
              <button type="button" className="fa-btn fa-btn--primary" onClick={() => setPanel('market')}>
                Open marketplace
              </button>
            </div>
          ) : (
            <>
              <div className="fa-boq__brief">
                <span>{brief.projectType || 'Project'} · {brief.roomCount ?? '—'} units</span>
                <span>
                  Tier: {boq.tier.label} (−{Math.round(boq.tier.discount * 100)}%)
                </span>
                {planName ? <span>Plan: {planName}</span> : null}
              </div>
              <div className="fa-boq__table-wrap">
                <table className="fa-boq__table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Unit (net)</th>
                      <th>Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boq.lines.map((l) => (
                      <tr key={l.product.id}>
                        <td>
                          <strong>{l.product.name}</strong>
                          <small>{l.product.tagline}</small>
                          {l.qty < l.product.moq ? (
                            <small className="fa-warn">Below MOQ {l.product.moq} — confirm on WhatsApp</small>
                          ) : null}
                        </td>
                        <td>{l.qty}</td>
                        <td>{formatInr(l.unitNet)}</td>
                        <td>{formatInr(l.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="fa-boq__totals">
                <p>
                  List total <strong>{formatInr(boq.listTotal)}</strong>
                </p>
                <p>
                  Bulk saving{' '}
                  <strong>{formatInr(Math.max(0, boq.listTotal - boq.grandTotal))}</strong>
                </p>
                <p className="fa-boq__grand">
                  Draft total <strong>{formatInr(boq.grandTotal)}</strong>
                </p>
              </div>
              <div className="fa-boq__tiers">
                {BULK_TIERS.map((t) => (
                  <span key={t.label} className={boq.tier.label === t.label ? 'is-active' : ''}>
                    {t.label}: {Math.round(t.discount * 100)}%
                  </span>
                ))}
              </div>
              <p className="fa-boq__note">
                FurnicherAI draft · Priyabadal Homes final verdict for production, dispatch &amp;
                install anywhere after physical / WhatsApp close.
              </p>
              <div className="fa-boq__actions">
                <a className="fa-btn fa-btn--primary" href={waHref} target="_blank" rel="noopener noreferrer">
                  Send BOQ on WhatsApp
                </a>
                <button type="button" className="fa-btn fa-btn--ghost" onClick={() => setPanel('ai')}>
                  Ask AI about this BOQ
                </button>
              </div>
            </>
          )}
        </section>
      )}

      <footer className="fa-foot">
        <p>
          {FURNICHER_BRAND} · {FURNICHER_PARENT}
        </p>
        <p>
          <Link to="/">Priyabadal Homes</Link>
          {' · '}
          <Link to="/kitchmock">KitchMock</Link>
        </p>
      </footer>
    </main>
  )
}
