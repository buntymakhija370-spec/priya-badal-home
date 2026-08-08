import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  clearAiAccess,
  fetchAiAccessStatus,
  formatAiQuota,
  subscribeWhatsAppUrl,
  unlockAiAccess,
  type AiAccessStatus,
  type AiPlan,
} from '../lib/aiAccess'
import { WHATSAPP_DISPLAY } from '../lib/whatsapp'
import './AiSubscribePage.css'

/** Client charge per AI image (room visualise or carcass) */
const IMAGE_RATE_INR = 25

const FALLBACK_PLANS: AiPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceLabel: '₹375 / month',
    visualise: 10,
    chat: 40,
    carcass: 5,
  },
  {
    id: 'pro',
    name: 'Pro',
    priceLabel: '₹1,500 / month',
    visualise: 40,
    chat: 150,
    carcass: 20,
  },
]

function imageCredits(plan: AiPlan) {
  return plan.visualise + plan.carcass
}

export function AiSubscribePage() {
  const [status, setStatus] = useState<AiAccessStatus | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    void fetchAiAccessStatus().then(setStatus)
  }, [])

  const plans = status?.plans?.length ? status.plans : FALLBACK_PLANS

  async function onUnlock(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      const next = await unlockAiAccess(code)
      setStatus(await fetchAiAccessStatus())
      setCode('')
      setMsg(`Unlocked ${next.subscriber?.planName || 'AI'} on this device.`)
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Unlock failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="ai-sub page-pad">
      <header className="ai-sub__header">
        <p className="eyebrow">Controlled AI</p>
        <h1>AI images at ₹{IMAGE_RATE_INR} each</h1>
        <p>
          Clients pay <strong>₹{IMAGE_RATE_INR} per AI image</strong> (room visualise or open
          carcass). Smart chat replies are included in the monthly packs. Unlock with an access
          code after WhatsApp / UPI payment.
        </p>
      </header>

      <section className="ai-sub__rate" aria-label="Per-image rate">
        <p className="ai-sub__rate-label">Client rate</p>
        <p className="ai-sub__rate-value">₹{IMAGE_RATE_INR} / image</p>
        <p className="ai-sub__rate-note">
          Pay-as-you-go on WhatsApp, or buy a monthly pack below (same ₹{IMAGE_RATE_INR} rate).
        </p>
      </section>

      <section className="ai-sub__plans" aria-label="AI plans">
        {plans.map((plan) => {
          const images = imageCredits(plan)
          const packTotal = images * IMAGE_RATE_INR
          return (
            <article key={plan.id} className="ai-sub__plan">
              <h2>{plan.name}</h2>
              <p className="ai-sub__price">{plan.priceLabel}</p>
              <p className="ai-sub__pack-math">
                {images} AI images × ₹{IMAGE_RATE_INR} = ₹{packTotal.toLocaleString('en-IN')}
              </p>
              <ul>
                <li>{plan.visualise} room visualises / month</li>
                <li>{plan.carcass} live carcass AI / month</li>
                <li>{plan.chat} smart chat replies / month (included)</li>
                <li>₹{IMAGE_RATE_INR} per AI image</li>
              </ul>
              <a className="btn btn--dark" href={subscribeWhatsAppUrl(plan.name)}>
                Subscribe on WhatsApp
              </a>
            </article>
          )
        })}
      </section>

      <section className="ai-sub__unlock">
        <h2>Already paid? Unlock here</h2>
        <p>
          After payment we send an access code (example <code>PBH-AI-A1B2C3</code>). Enter it once
          on this phone/browser. Free catalog answers still work without a code.
        </p>
        {status?.subscribed && status.subscriber ? (
          <div className="ai-sub__active">
            <p>
              <strong>{status.subscriber.planName}</strong> active
            </p>
            <p>{formatAiQuota(status.subscriber)}</p>
            <button
              type="button"
              className="btn"
              onClick={() => {
                clearAiAccess()
                setMsg('Signed out of AI on this device.')
                void fetchAiAccessStatus().then(setStatus)
              }}
            >
              Sign out AI on this device
            </button>
          </div>
        ) : (
          <form onSubmit={onUnlock} className="ai-sub__form">
            <label>
              <span>Access code</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="PBH-AI-XXXXXX"
                autoComplete="off"
                required
              />
            </label>
            <button className="btn btn--dark" type="submit" disabled={busy}>
              {busy ? 'Unlocking…' : 'Unlock AI'}
            </button>
          </form>
        )}
        {msg ? <p className="ai-sub__msg">{msg}</p> : null}
      </section>

      <section className="ai-sub__help">
        <p>
          WhatsApp {WHATSAPP_DISPLAY} ·{' '}
          <Link to="/chat">Chat</Link> · <Link to="/ai-admin">Owner admin</Link>
        </p>
      </section>
    </main>
  )
}
