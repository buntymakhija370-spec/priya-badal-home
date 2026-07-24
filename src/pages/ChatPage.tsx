import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  answerInteriorQuery,
  createWelcomeMessage,
  type ChatMessage,
} from '../lib/interiorAI'
import { formatPrice } from '../data/catalog'
import { useCurrency } from '../hooks/useCurrency'
import './ChatPage.css'

const SUGGESTIONS = [
  'Wall panels under ₹50,000',
  'Modular kitchen ideas',
  'Sliding wardrobe for bedroom',
  'Temple unit under ₹40,000',
]

export function ChatPage() {
  useCurrency()
  const [messages, setMessages] = useState<ChatMessage[]>([createWelcomeMessage()])
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
    }
    const reply = answerInteriorQuery(trimmed)
    setMessages((prev) => [...prev, userMsg, reply])
    setInput('')
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(input)
  }

  return (
    <main className="chat page-pad">
      <header className="chat__header">
        <p className="eyebrow">Chat board</p>
        <h1>AI Interior Guide</h1>
        <p>
          Ask about rooms, styles, and budgets. The guide suggests products from
          our collection and shows prices.
        </p>
      </header>

      <div className="chat__board">
        <div className="chat__messages" role="log" aria-live="polite">
          {messages.map((msg) => (
            <article
              key={msg.id}
              className={`bubble bubble--${msg.role}`}
            >
              <p className="bubble__text">{msg.text}</p>
              {msg.products && msg.products.length > 0 && (
                <div className="bubble__products">
                  {msg.products.map((product) => (
                    <Link
                      key={product.id}
                      className="bubble__product"
                      to={`/product/${product.id}`}
                    >
                      <img src={product.image} alt="" />
                      <span>
                        <strong>{product.name}</strong>
                        <em>{formatPrice(product.price)}</em>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </article>
          ))}
          <div ref={endRef} />
        </div>

        <div className="chat__suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="chip" onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>

        <form className="chat__form" onSubmit={onSubmit}>
          <label className="sr-only" htmlFor="chat-input">
            Message
          </label>
          <input
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Minimal living room under ₹40,000"
            autoComplete="off"
          />
          <button className="btn btn--dark" type="submit">
            Send
          </button>
        </form>
      </div>
    </main>
  )
}
