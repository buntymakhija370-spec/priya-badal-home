import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FURNICHER_BRAND,
  FURNICHER_PARENT,
  FURNICHER_PRODUCTS,
  FURNICHER_TAGLINE,
  KITCHEN_RATE_PER_FT,
  type ChatMessage,
  type ProjectBrief,
  buildBoq,
  boqWhatsAppText,
  computeLiveEstimate,
  PRICE_DISCLAIMER,
  formatInrApprox,
  formatInrRange,
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
  const chatThreadRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const prevMessageCount = useRef(0)

  const boq = useMemo(() => buildBoq(selections), [selections])
  const live = useMemo(
    () => computeLiveEstimate(brief, selections),
    [brief, selections],
  )

  // Scroll only the chat thread (not the whole page), and only when a new message arrives
  useEffect(() => {
    const thread = chatThreadRef.current
    if (!thread || !started) return
    if (messages.length <= prevMessageCount.current) {
      prevMessageCount.current = messages.length
      return
    }
    prevMessageCount.current = messages.length
    thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' })
  }, [messages.length, started])

  const kitchenExtraLines = useMemo(() => {
    if (!brief.kitchenRunFt || brief.kitchen === 'none') return []
    const hasKitSku = boq.lines.some(
      (l) => l.product.id === 'fa-kit-small' || l.product.id === 'fa-kit-big',
    )
    if (hasKitSku) return []
    const per = Math.round(brief.kitchenRunFt * KITCHEN_RATE_PER_FT)
    const qty = brief.roomCount || 0
    if (!qty) return [{ label: `Kitchen · ${brief.kitchenRunFt} ft run (per unit)`, amount: per }]
    return [
      {
        label: `Kitchen · ${brief.kitchenRunFt} ft × ${qty}`,
        amount: per * qty,
      },
    ]
  }, [brief.kitchenRunFt, brief.kitchen, brief.roomCount, boq.lines])

  const waHref = useMemo(() => {
    const text = boqWhatsAppText({
      brief,
      lines: boq.lines,
      tier: live.ready ? live.tier : boq.tier,
      grandTotal: live.ready ? live.draftTotal : boq.grandTotal,
      listTotal: live.ready ? live.listTotal : boq.listTotal,
      planName,
      extraLines: kitchenExtraLines,
    })
    return `${WHATSAPP_CHAT_URL}?text=${encodeURIComponent(text)}`
  }, [brief, boq, planName, live, kitchenExtraLines])

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

  function openPlanPicker() {
    const input = fileRef.current
    if (!input) return
    // Reset so the same file can be chosen again
    input.value = ''
    input.click()
  }

  function isUploadPlanIntent(text: string) {
    return /^(i will upload( my)? floor plan|upload( my)? floor plan|upload plan)$/i.test(
      text.trim(),
    )
  }

  function sendUser(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    // Chat chips / typed intent should open the file picker immediately
    if (isUploadPlanIntent(trimmed)) {
      setBrief((b) => ({ ...b, entry: 'plan', step: b.hasPlan ? b.step : 'intake' }))
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'user', text: trimmed },
        {
          id: uid(),
          role: 'ai',
          text: 'Choose a floor plan file (JPG, PNG, or PDF). The picker should open now — if it doesn’t, tap **Upload floor plan** under the chat.',
          choices: [
            { id: 'picker', label: 'Open file picker', value: 'UPLOAD_PLAN_PICKER' },
            {
              id: 'ex',
              label: 'Skip — type units + kitchen ft',
              value: '24 hotel 1BHK, kitchen 8 ft',
            },
          ],
        },
      ])
      setInput('')
      openPlanPicker()
      return
    }

    if (trimmed === 'UPLOAD_PLAN_PICKER') {
      openPlanPicker()
      return
    }

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
        reply: `Added **${ids.length}** matched products × **${qty}** into your chat BOQ. The **live calculator** above updates with your cart. Tap WhatsApp when ready for Priyabadal Homes.`,
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
            : 'Add products from the marketplace cards in chat first — then we can WhatsApp the BOQ.',
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
        text: `Added **${p?.name || productId}** × **${qty}** to your BOQ. Live calculator updates instantly.`,
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
    const okType =
      file.type.startsWith('image/') ||
      file.type === 'application/pdf' ||
      /\.(pdf|png|jpe?g|webp|gif)$/i.test(file.name)
    if (!okType) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'ai',
          text: 'Please upload a **JPG, PNG, or PDF** floor plan.',
          choices: [
            { id: 'picker', label: 'Open file picker', value: 'UPLOAD_PLAN_PICKER' },
          ],
        },
      ])
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setPlanName(file.name)
    const nextBrief: ProjectBrief = {
      ...brief,
      entry: 'plan',
      hasPlan: true,
      planName: file.name,
      step: brief.roomFormat ? brief.step : 'format',
    }
    setBrief(nextBrief)
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: 'user', text: `Uploaded floor plan: ${file.name}` },
    ])
    const turn = furnicherAiReply(
      `Floor plan ${file.name} attached. ${brief.roomCount ? `${brief.roomCount} units` : ''}`.trim(),
      nextBrief,
    )
    // Ensure hasPlan stays true after detectFromText
    pushAi({
      ...turn,
      brief: { ...turn.brief, hasPlan: true, planName: file.name, entry: 'plan' },
      reply: turn.brief.roomFormat
        ? turn.reply
        : `Floor plan **${file.name}** received. I’ll cost a **similar bulk product range** from this plan — kitchen length in feet matters most for price.\n\nConfirm unit type, then count + kitchen run. Marketplace picks will appear in this chat.`,
    })
    if (fileRef.current) fileRef.current.value = ''
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
              Start with your <strong>floor plan</strong> or a short <strong>project prompt</strong>.
              The live AI calculator shows a <strong>draft bulk range</strong> (kitchen size matters) —
              not factory/production MRP. Marketplace products stay in chat; Priyabadal Homes confirms
              exact figures on WhatsApp.
            </p>
            <div className="fa-gate__actions">
              <button type="button" className="fa-btn fa-btn--primary" onClick={() => setStarted(true)}>
                Start with plan or prompt
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
          <p className="fa-top__eyebrow">Plan / Prompt · Live calc · Marketplace</p>
          <h1>{FURNICHER_BRAND}</h1>
          <p className="fa-top__sub">{FURNICHER_PARENT}</p>
        </div>
        <div className="fa-top__meta">
          <span>
            {brief.entry === 'plan'
              ? 'Floor plan'
              : brief.entry === 'prompt'
                ? 'Prompt'
                : 'Briefing'}
            {brief.roomFormat ? ` · ${brief.roomFormat}` : ''}
            {brief.roomCount ? ` · ${brief.roomCount}` : ''}
            {brief.kitchenRunFt ? ` · kit ${brief.kitchenRunFt}ft` : ''}
          </span>
          <span className={boq.totalQty ? 'is-hot' : ''}>{boq.totalQty} lines in BOQ</span>
        </div>
      </header>

      <aside className="fa-live" aria-live="polite" aria-label="Live draft cost calculator">
        <div className="fa-live__head">
          <strong>Live draft range</strong>
          <span>
            Kitchen guide {formatInrApprox(KITCHEN_RATE_PER_FT)}/ft
            {planName ? ` · ${planName}` : ''}
          </span>
        </div>
        {live.ready ? (
          <>
            <div className="fa-live__grid">
              <div>
                <em>Per unit band</em>
                <strong>{formatInrRange(live.perUnitTotal)}</strong>
                {live.kitchenPerUnit > 0 ? (
                  <small>Kitchen ~{formatInrApprox(live.kitchenPerUnit)}</small>
                ) : null}
              </div>
              <div>
                <em>× {live.roomCount || '—'} units</em>
                <strong>{formatInrRange(live.listTotal)}</strong>
                <small>List band before bulk</small>
              </div>
              <div className="fa-live__draft">
                <em>{live.tier.label} draft</em>
                <strong>{formatInrRange(live.draftTotal)}</strong>
                {live.saving > 0 ? (
                  <small>Guide save ~{formatInrApprox(live.saving)}</small>
                ) : null}
              </div>
            </div>
            <p className="fa-live__note">{PRICE_DISCLAIMER}</p>
          </>
        ) : (
          <p className="fa-live__wait">
            Waiting for floor plan or prompt + unit count. Kitchen length (ft) moves the draft range
            most — figures stay approximate until WhatsApp confirmation.
          </p>
        )}
      </aside>

      <section className="fa-panel fa-chat fa-chat--full" aria-label="FurnicherAI chat">
        <div className="fa-chat__thread" ref={chatThreadRef}>
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
                    const net = unitAfterDiscount(p.unitPrice, live.tier.discount)
                    const addQty = brief.roomCount || p.moq
                    return (
                      <article key={id} className="fa-mini-card">
                        <img src={p.image} alt="" loading="lazy" />
                        <div>
                          <h3>{p.name}</h3>
                          <p>{p.tagline}</p>
                          <p className="fa-mini-card__price">
                            <strong>from {formatInrApprox(net)}</strong>
                            <span>MOQ {p.moq} · guide</span>
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

              {m.showBoq && (boq.lines.length > 0 || kitchenExtraLines.length > 0) ? (
                <div className="fa-inline-boq">
                  <header>
                    <strong>BOQ draft range</strong>
                    <span>
                      {(live.ready ? live.tier : boq.tier).label} · ~
                      {Math.round((live.ready ? live.tier : boq.tier).discount * 100)}% guide
                    </span>
                  </header>
                  <ul>
                    {boq.lines.map((l) => (
                      <li key={l.product.id}>
                        <span>
                          {l.product.name} × {l.qty}
                        </span>
                        <span>~{formatInrApprox(l.lineTotal)}</span>
                      </li>
                    ))}
                    {kitchenExtraLines.map((l) => (
                      <li key={l.label}>
                        <span>{l.label}</span>
                        <span>~{formatInrApprox(l.amount)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="fa-inline-boq__total">
                    Project draft band{' '}
                    <strong>
                      {formatInrRange(live.ready ? live.draftTotal : boq.grandTotal)}
                    </strong>
                    {(live.ready ? live.saving : boq.listTotal - boq.grandTotal) > 0 ? (
                      <small>
                        Guide save ~{' '}
                        {formatInrApprox(
                          live.ready ? live.saving : boq.listTotal - boq.grandTotal,
                        )}
                      </small>
                    ) : null}
                    <small>{PRICE_DISCLAIMER}</small>
                  </p>
                  <a className="fa-btn fa-btn--primary" href={waHref} target="_blank" rel="noopener noreferrer">
                    WhatsApp BOQ · {WHATSAPP_DISPLAY}
                  </a>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="fa-chat__tools">
          <input
            id="fa-plan-upload"
            ref={fileRef}
            className="fa-plan-input"
            type="file"
            accept="image/*,.pdf,application/pdf"
            onChange={(e) => onPlanFile(e.target.files?.[0] || null)}
          />
          <label htmlFor="fa-plan-upload" className="fa-tool fa-tool--upload">
            Upload floor plan
          </label>
          <button
            type="button"
            className="fa-tool"
            onClick={() =>
              sendUser(
                'I will describe my project in a prompt: 24 hotel 1BHK full package, kitchen 8 ft, sliding wardrobe, 3-seater sofa, 42 inch TV',
              )
            }
          >
            Example prompt
          </button>
          <button type="button" className="fa-tool" onClick={() => sendUser('Build BOQ now')}>
            Build BOQ
          </button>
          {boq.lines.length || live.ready ? (
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
            placeholder="Upload a plan, or type: 24 hotel 1BHK, kitchen 8 ft…"
            aria-label="Message FurnicherAI"
          />
          <button type="submit" className="fa-btn fa-btn--primary">
            Send
          </button>
        </form>
      </section>

      <footer className="fa-foot">
        <p>
          {FURNICHER_BRAND} · floor plan or prompt · live calc · {FURNICHER_PRODUCTS.length} marketplace
          SKUs
        </p>
        <p>
          <Link to="/">Priyabadal Homes</Link>
        </p>
      </footer>
    </main>
  )
}
