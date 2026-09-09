import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  clearAiAccess,
  fetchAiAccessStatus,
  formatAiQuota,
  unlockAiAccess,
  type AiAccessStatus,
} from '../lib/aiAccess'
import './AiAccessBanner.css'

type Props = {
  onStatus?: (status: AiAccessStatus) => void
  compact?: boolean
}

function isServerReady(status: AiAccessStatus) {
  return Boolean(status.falConfigured || status.geminiConfigured || status.configured)
}

export function AiAccessBanner({ onStatus, compact }: Props) {
  const [status, setStatus] = useState<AiAccessStatus | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function refresh() {
    const next = await fetchAiAccessStatus()
    setStatus(next)
    onStatus?.(next)
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function onUnlock(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      await unlockAiAccess(code)
      const next = await fetchAiAccessStatus()
      setStatus(next)
      onStatus?.(next)
      setCode('')
      if (isServerReady(next) && next.subscribed) {
        setMsg('Unlocked on this device. Visualise uses Google Gemini.')
      } else if (next.subscribed && !isServerReady(next)) {
        setMsg('Code accepted. Visualisation works once Gemini is connected on the server.')
      } else {
        setMsg('Unlocked on this device.')
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not unlock')
    } finally {
      setBusy(false)
    }
  }

  function onClear() {
    clearAiAccess()
    setMsg('Signed out on this device.')
    void refresh()
  }

  if (!status) {
    return (
      <aside className={`ai-access ${compact ? 'ai-access--compact' : ''}`}>
        <p className="ai-access__kicker">Checking Gemini…</p>
      </aside>
    )
  }

  const serverReady = isServerReady(status)
  const ready = serverReady && (!status.requireSubscription || status.subscribed)

  // Gemini open mode — no paid unlock codes
  if (!status.requireSubscription) {
    if (ready) {
      return (
        <aside className={`ai-access ${compact ? 'ai-access--compact' : ''}`}>
          <p className="ai-access__kicker">Google Gemini · connected</p>
          <p>Chat and Visualise use Gemini. No access code needed.</p>
          {msg ? <p className="ai-access__msg ai-access__msg--ok">{msg}</p> : null}
        </aside>
      )
    }
    return (
      <aside className={`ai-access ai-access--locked ${compact ? 'ai-access--compact' : ''}`}>
        <p className="ai-access__kicker">Connect Google Gemini</p>
        <p>
          Visualise is not opening because the live site still needs a Gemini API key. We do not use
          Fal / paid “AI unlock” for this — only Google Gemini.
        </p>
        <p>
          Owner: get a key at{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
            aistudio.google.com/apikey
          </a>
          , then open Gemini admin (PIN <code>2468</code>) or set{' '}
          <code>GEMINI_API_KEY</code> in Cloudflare Pages → Environment variables and redeploy.
        </p>
        <Link className="ai-access__owner-btn" to="/ai-admin">
          Open Gemini admin
        </Link>
        {msg ? <p className="ai-access__msg">{msg}</p> : null}
      </aside>
    )
  }

  if (ready && status.subscriber) {
    return (
      <aside className={`ai-access ${compact ? 'ai-access--compact' : ''}`}>
        <p className="ai-access__kicker">Gemini active · {status.subscriber.planName}</p>
        <p className="ai-access__quota">{formatAiQuota(status.subscriber)}</p>
        <div className="ai-access__row">
          <Link to="/ai">Manage subscription</Link>
          <button type="button" className="ai-access__linkbtn" onClick={onClear}>
            Sign out
          </button>
        </div>
        {msg ? <p className="ai-access__msg ai-access__msg--ok">{msg}</p> : null}
      </aside>
    )
  }

  return (
    <aside className={`ai-access ai-access--locked ${compact ? 'ai-access--compact' : ''}`}>
      <p className="ai-access__kicker">Gemini unlock · subscribers only</p>
      <p>
        Enter your access code for room visualisation and smarter chat. Price, carcass, and material
        answers still work without unlock.
      </p>
      <form className="ai-access__form" onSubmit={onUnlock}>
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
        <button type="submit" className="btn btn--dark" disabled={busy}>
          {busy ? 'Unlocking…' : 'Unlock'}
        </button>
      </form>
      <div className="ai-access__row">
        <Link to="/ai">See plans &amp; subscribe on WhatsApp</Link>
      </div>
      {msg ? <p className="ai-access__msg">{msg}</p> : null}
      {!serverReady ? (
        <div className="ai-access__owner">
          <p className="ai-access__msg">
            Server Gemini is offline until the owner connects a Gemini key.
          </p>
          <Link className="ai-access__owner-btn" to="/ai-admin">
            Open Gemini admin
          </Link>
        </div>
      ) : null}
    </aside>
  )
}
