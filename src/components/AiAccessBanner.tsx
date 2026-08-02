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
      const next = await unlockAiAccess(code)
      setStatus(next)
      onStatus?.(next)
      setCode('')
      setMsg('AI unlocked for this device.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Unlock failed')
    } finally {
      setBusy(false)
    }
  }

  function onClear() {
    clearAiAccess()
    setMsg('Signed out of AI on this device.')
    void refresh()
  }

  if (!status) return null

  const ready =
    status.falConfigured &&
    (!status.requireSubscription || status.subscribed)

  if (ready && status.subscriber) {
    return (
      <aside className={`ai-access ${compact ? 'ai-access--compact' : ''}`}>
        <p className="ai-access__kicker">Paid AI active · {status.subscriber.planName}</p>
        <p className="ai-access__quota">{formatAiQuota(status.subscriber)}</p>
        <div className="ai-access__row">
          <Link to="/ai">Manage subscription</Link>
          <button type="button" className="ai-access__linkbtn" onClick={onClear}>
            Sign out AI
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside className={`ai-access ai-access--locked ${compact ? 'ai-access--compact' : ''}`}>
      <p className="ai-access__kicker">AI unlock · subscribers only</p>
      <p>
        Unlock for room visualisation and smarter chat. Price, carcass, and material answers
        still work without unlock.
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
          {busy ? 'Unlocking…' : 'Unlock AI'}
        </button>
      </form>
      <div className="ai-access__row">
        <Link to="/ai">See plans &amp; subscribe on WhatsApp</Link>
      </div>
      {msg ? <p className="ai-access__msg">{msg}</p> : null}
      {!status.falConfigured ? (
        <p className="ai-access__msg">AI isn’t connected on the server yet — please try later.</p>
      ) : null}
    </aside>
  )
}
