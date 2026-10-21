import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FURNICHER_BRAND,
  FURNICHER_PARENT,
  FURNICHER_PRODUCTS,
  FURNICHER_TAGLINE,
  type ChatMessage,
  type ProjectBrief,
  buildBoq,
  boqWhatsAppText,
  formatInr,
  furnicherAiReply,
  getFurnicherProduct,
  initialAiMessages,
  matchedProductIds,
  unitAfterDiscount,
} from '../data/furnicherAi'
import { WHATSAPP_CHAT_URL, WHATSAPP_DISPLAY } from '../lib/whatsapp'
import './FurnicherAiPage.css'

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function FurnicherAiPage() {
  const [started, setStarted] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() => initialAiMessages())
  const [input, setInput] = useState('')
  const [brief, setBrief] = useState<ProjectBrief>({ needs: [], step: 'start' })
  const [selections, setSelections] = useState<Record<string, number>>({})
  const [planName, setPlanName] = useState<string | undefined>()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const boq = useMemo(() => buildBoq(selections), [selections])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, started, selections, boq.grandTotal])

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

  function pushAi(turn: ReturnType<typeof furnicherAiReply>) {
    setBrief(turn.brief)
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: 'ai',
        text: turn.reply,
        productIds: turn.productIds,
        choices: turn.choices,
        showBoq: turn.showBoq,
      },
    ])
  }

  function sendUser(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    // Special: add matched set from chat
    if (trimmed === 'ADD_MATCHED_SET') {
      const ids = matchedProductIds(brief)
      const qty = brief.roomCount || 10
      setSelections((prev) => {
        const next = { ...prev }
        for (const id of ids) next[id] = qty
        return next
      })
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'user', text: `Add matched set × ${qty}` },
      ])
      pushAi({
        brief: { ...brief, step: 'boq' },
        reply: `Added **${ids.length}** matched products × **${qty}** into your chat BOQ. Scroll the BOQ card below — or tap **Build BOQ now** / WhatsApp when ready.`,
        productIds: ids,
        showBoq: true,
        defaultQty: qty,
        choices: [
          { id: 'boq', label: 'Review BOQ', value: 'Build BOQ now' },
          { id: 'wa', label: 'WhatsApp Priyabadal Homes', value: 'I am ready for WhatsApp BOQ' },
        ],
      })
      setInput('')
      return
    }

    if (/ready for whatsapp/i.test(trimmed)) {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'user', text: trimmed },
        {
          id: uid(),
          role: 'ai',
          text: boq.lines.length
            ? `Your BOQ is ready. Tap **WhatsApp ${WHATSAPP_DISPLAY}** below to send this draft to Priyabadal Homes for final rates, finishes, and install.`
            : 'Add products from the cards in chat first — then we can WhatsApp the BOQ.',
          showBoq: true,
          productIds: Object.keys(selections),
        },
      ])
      setInput('')
      return
    }

    const userMsg: ChatMessage = { id: uid(), role: 'user', text: trimmed }
    const turn = furnicherAiReply(trimmed, brief)
    setBrief(turn.brief)
    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: uid(),
        role: 'ai',
        text: turn.reply,
        productIds: turn.productIds,
        choices: turn.choices,
        showBoq: turn.showBoq,
      },
    ])
    setInput('')
  }

  function setQty(productId: string, qty: number) {
    setSelections((prev) => {
      const next = { ...prev }
      if (qty <= 0) delete next[productId]
      else next[productId] = qty
      return next
    })
  }

  function addProduct(productId: string, qty: number) {
    setQty(productId, qty)
    const p = getFurnicherProduct(productId)
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: 'ai',
        text: `Added **${p?.name || productId}** × **${qty}** to your BOQ.`,
        showBoq: true,
        choices: [
          { id: 'more', label: 'Continue choosing', value: 'Continue — show next options' },
          { id: 'boq', label: 'Build BOQ now', value: 'Build BOQ now' },
        ],
      },
    ])
  }

  function onPlanFile(file: File | null) {
    if (!file) return
    setPlanName(file.name)
    setBrief((b) => ({ ...b, hasPlan: true }))
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: 'ai',
        text: `Floor plan **${file.name}** attached to this chat project. Keep selecting products here — BOQ will mention the plan for Priyabadal Homes.`,
        showBoq: boq.lines.length > 0,
      },
    ])
  }

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
              Chat only. Tell us Hotel 1BHK / hostel / commercial — we’ll ask sofa size, TV size,
              wardrobe type, kitchen size, show products in chat, and hand you a BOQ for WhatsApp
              close with Priyabadal Homes.
            </p>
            <div className="fa-gate__actions">
              <button type="button" className="fa-btn fa-btn--primary" onClick={() => setStarted(true)}>
                Start chat
              </button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="fa fa--app fa--chat-only">
      <header className="fa-top">
        <div className="fa-top__brand">
          <p className="fa-top__eyebrow">Chat · Marketplace · BOQ</p>
          <h1>{FURNICHER_BRAND}</h1>
          <p className="fa-top__sub">{FURNICHER_PARENT}</p>
        </div>
        <div className="fa-top__meta">
          <span>
            {brief.roomFormat || brief.projectType || 'Briefing'}
            {brief.roomCount ? ` · ${brief.roomCount}` : ''}
          </span>
          <span className={boq.totalQty ? 'is-hot' : ''}>{boq.totalQty} lines in BOQ</span>
        </div>
      </header>

      <section className="fa-panel fa-chat fa-chat--full" aria-label="FurnicherAI chat">
        <div className="fa-chat__thread">
          {messages.map((m) => (
            <div key={m.id} className="fa-msg">
              <div
                className={`fa-bubble fa-bubble--${m.role}`}
                dangerouslySetInnerHTML={{
                  __html: m.text
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br/>'),
                }}
              />

              {m.choices && m.choices.length > 0 ? (
                <div className="fa-chat__quick fa-chat__quick--inline">
                  {m.choices.map((c) => (
                    <button key={c.id} type="button" onClick={() => sendUser(c.value)}>
                      {c.label}
                    </button>
                  ))}
                </div>
              ) : null}

              {m.productIds && m.productIds.length > 0 ? (
                <div className="fa-inline-products">
                  {m.productIds.map((id) => {
                    const p = getFurnicherProduct(id)
                    if (!p) return null
                    const qty = selections[id] || 0
                    const net = unitAfterDiscount(p.unitPrice, boq.tier.discount)
                    const addQty = brief.roomCount || p.moq
                    return (
                      <article key={id} className="fa-mini-card">
                        <img src={p.image} alt="" loading="lazy" />
                        <div>
                          <h3>{p.name}</h3>
                          <p>{p.tagline}</p>
                          <p className="fa-mini-card__price">
                            <strong>{formatInr(net)}</strong>
                            <span>MOQ {p.moq}</span>
                          </p>
                          <div className="fa-mini-card__actions">
                            <button type="button" onClick={() => addProduct(id, addQty)}>
                              Add × {addQty}
                            </button>
                            {qty > 0 ? (
                              <span className="fa-mini-card__qty">In BOQ: {qty}</span>
                            ) : null}
                            {qty > 0 ? (
                              <>
                                <button type="button" onClick={() => setQty(id, qty - 1)}>
                                  −
                                </button>
                                <button type="button" onClick={() => setQty(id, qty + 1)}>
                                  +
                                </button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : null}

              {m.showBoq && boq.lines.length > 0 ? (
                <div className="fa-inline-boq">
                  <header>
                    <strong>BOQ draft</strong>
                    <span>
                      {boq.tier.label} · −{Math.round(boq.tier.discount * 100)}%
                    </span>
                  </header>
                  <ul>
                    {boq.lines.map((l) => (
                      <li key={l.product.id}>
                        <span>
                          {l.product.name} × {l.qty}
                        </span>
                        <span>{formatInr(l.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="fa-inline-boq__total">
                    Draft total <strong>{formatInr(boq.grandTotal)}</strong>
                    {boq.listTotal > boq.grandTotal ? (
                      <small>Save {formatInr(boq.listTotal - boq.grandTotal)}</small>
                    ) : null}
                  </p>
                  <a className="fa-btn fa-btn--primary" href={waHref} target="_blank" rel="noopener noreferrer">
                    WhatsApp BOQ · {WHATSAPP_DISPLAY}
                  </a>
                </div>
              ) : null}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="fa-chat__tools">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            hidden
            onChange={(e) => onPlanFile(e.target.files?.[0] || null)}
          />
          <button type="button" className="fa-tool" onClick={() => fileRef.current?.click()}>
            Upload plan
          </button>
          <button type="button" className="fa-tool" onClick={() => sendUser('Build BOQ now')}>
            Build BOQ
          </button>
          {boq.lines.length ? (
            <a className="fa-tool fa-tool--wa" href={waHref} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          ) : null}
          {planName ? <span className="fa-tool-note">Plan: {planName}</span> : null}
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
            placeholder="e.g. Hotel 1BHK full package for 24 units…"
            aria-label="Message FurnicherAI"
          />
          <button type="submit" className="fa-btn fa-btn--primary">
            Send
          </button>
        </form>
      </section>

      <footer className="fa-foot">
        <p>
          {FURNICHER_BRAND} · chat-first bulk desk · {FURNICHER_PRODUCTS.length} marketplace SKUs
        </p>
        <p>
          <Link to="/">Priyabadal Homes</Link>
        </p>
      </footer>
    </main>
  )
}
