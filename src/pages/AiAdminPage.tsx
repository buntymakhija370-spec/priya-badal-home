import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import './AiAdminPage.css'

type AdminSub = {
  id: string
  code: string
  planId: string
  planName: string
  priceLabel: string
  active: boolean
  period: string
  used: { visualise: number; chat: number; carcass: number }
  limits: { visualise: number; chat: number; carcass: number }
  remaining: { visualise: number; chat: number; carcass: number }
  name?: string | null
  phone?: string | null
  note?: string | null
  createdAt: string
}

export function AiAdminPage() {
  const [pin, setPin] = useState('')
  const [authedPin, setAuthedPin] = useState<string | null>(null)
  const [subscribers, setSubscribers] = useState<AdminSub[]>([])
  const [aiReady, setAiReady] = useState(false)
  const [provider, setProvider] = useState<string>('none')
  const [planId, setPlanId] = useState('starter')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [geminiKey, setGeminiKey] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function adminFetch(path: string, init?: RequestInit) {
    const headers = {
      'Content-Type': 'application/json',
      'X-AI-Admin': authedPin || pin,
      ...(init?.headers || {}),
    }
    return fetch(path, { ...init, headers })
  }

  async function loadList(usePin = authedPin || pin) {
    const res = await fetch('/api/ai-admin', {
      headers: { 'X-AI-Admin': usePin },
    })
    const data = (await res.json()) as {
      subscribers?: AdminSub[]
      falConfigured?: boolean
      provider?: string
      error?: string
    }
    if (!res.ok) throw new Error(data.error || 'Admin login failed')
    setSubscribers(data.subscribers || [])
    setAiReady(Boolean(data.falConfigured))
    setProvider(data.provider || (data.falConfigured ? 'gemini' : 'none'))
    setAuthedPin(usePin)
  }

  async function onLogin(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      await loadList(pin)
      setMsg('Admin unlocked.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Login failed')
      setAuthedPin(null)
    } finally {
      setBusy(false)
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!authedPin) return
    setBusy(true)
    setMsg(null)
    setCreatedCode(null)
    try {
      const res = await adminFetch('/api/ai-admin', {
        method: 'POST',
        body: JSON.stringify({
          adminPin: authedPin,
          action: 'create',
          planId,
          name,
          phone,
          note,
        }),
      })
      const data = (await res.json()) as {
        code?: string
        subscribers?: AdminSub[]
        error?: string
      }
      if (!res.ok) throw new Error(data.error || 'Create failed')
      setCreatedCode(data.code || null)
      setSubscribers(data.subscribers || [])
      setName('')
      setPhone('')
      setNote('')
      setMsg('Access code created. Send it to the customer on WhatsApp.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(code: string, active: boolean) {
    if (!authedPin) return
    const res = await adminFetch('/api/ai-admin', {
      method: 'POST',
      body: JSON.stringify({
        adminPin: authedPin,
        action: 'set-active',
        code,
        active,
      }),
    })
    const data = (await res.json()) as { subscribers?: AdminSub[]; error?: string }
    if (!res.ok) {
      setMsg(data.error || 'Update failed')
      return
    }
    setSubscribers(data.subscribers || [])
  }

  async function onSetGemini(e: FormEvent) {
    e.preventDefault()
    if (!authedPin) return
    setBusy(true)
    try {
      const res = await adminFetch('/api/ai-admin', {
        method: 'POST',
        body: JSON.stringify({
          adminPin: authedPin,
          action: 'set-gemini-key',
          geminiKey,
        }),
      })
      const data = (await res.json()) as {
        error?: string
        falConfigured?: boolean
        provider?: string
      }
      if (!res.ok) throw new Error(data.error || 'Could not set Gemini key')
      setAiReady(Boolean(data.falConfigured))
      setProvider(data.provider || 'gemini')
      setGeminiKey('')
      setMsg('Gemini key saved. Chat + Visualise will use Google Gemini.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gemini key update failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="ai-admin page-pad">
      <header>
        <p className="eyebrow">Owner only</p>
        <h1>Gemini admin</h1>
        <p>
          Paste your <strong>Google Gemini</strong> API key here. Chat and Visualise use Gemini
          (not Fal). Customers never see this key. Admin PIN default:{' '}
          <code>AI_ADMIN_PIN</code> / <code>2468</code>.
        </p>
      </header>

      {!authedPin ? (
        <form className="ai-admin__card" onSubmit={onLogin}>
          <label>
            <span>Admin PIN</span>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
          </label>
          <button className="btn btn--dark" type="submit" disabled={busy}>
            {busy ? 'Checking…' : 'Open admin'}
          </button>
        </form>
      ) : (
        <>
          <section className="ai-admin__card">
            <h2>Google Gemini API key</h2>
            <p>
              Status:{' '}
              {aiReady
                ? `Connected · provider ${provider || 'gemini'}`
                : 'Not connected — paste Gemini key below'}
            </p>
            <form onSubmit={onSetGemini} className="ai-admin__form">
              <label>
                <span>Set / replace Gemini API key</span>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIza…"
                  autoComplete="off"
                />
              </label>
              <button className="btn btn--dark" type="submit" disabled={busy || !geminiKey}>
                Save Gemini key
              </button>
            </form>
            <p className="ai-admin__hint">
              Create a free key at{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
              >
                aistudio.google.com/apikey
              </a>
              . Enable billing if image quota is empty. On Cloudflare Pages, also set the same key
              as env <code>GEMINI_API_KEY</code> so production keeps it after redeploys.
            </p>
          </section>

          <section className="ai-admin__card">
            <h2>Optional — create unlock codes</h2>
            <p className="ai-admin__hint">
              Not required when subscription mode is off. Use only if you want paid client codes.
            </p>
            <form onSubmit={onCreate} className="ai-admin__form">
              <label>
                <span>Plan</span>
                <select value={planId} onChange={(e) => setPlanId(e.target.value)}>
                  <option value="starter">Starter · ₹375 · 15 images</option>
                  <option value="pro">Pro · ₹1,500 · 60 images</option>
                </select>
              </label>
              <label>
                <span>Customer name (optional)</span>
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label>
                <span>WhatsApp number (optional)</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label>
                <span>Note</span>
                <input value={note} onChange={(e) => setNote(e.target.value)} />
              </label>
              <button className="btn btn--dark" type="submit" disabled={busy}>
                Create code
              </button>
            </form>
            {createdCode ? (
              <p className="ai-admin__code">
                New code: <strong>{createdCode}</strong>
              </p>
            ) : null}
          </section>

          <section className="ai-admin__card">
            <h2>Subscribers ({subscribers.length})</h2>
            <div className="ai-admin__list">
              {subscribers.map((s) => (
                <article key={s.id} className="ai-admin__sub">
                  <p>
                    <strong>{s.code}</strong> · {s.planName} · {s.active ? 'active' : 'paused'}
                  </p>
                  <p>
                    {s.name || '—'} {s.phone ? `· ${s.phone}` : ''}
                  </p>
                  <p>
                    Used {s.used.visualise}/{s.limits.visualise} visualise · {s.used.chat}/
                    {s.limits.chat} chat · {s.used.carcass}/{s.limits.carcass} carcass · {s.period}
                  </p>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => void toggleActive(s.code, !s.active)}
                  >
                    {s.active ? 'Pause' : 'Activate'}
                  </button>
                </article>
              ))}
              {subscribers.length === 0 ? <p>No unlock codes yet.</p> : null}
            </div>
          </section>
        </>
      )}

      {msg ? <p className="ai-admin__msg">{msg}</p> : null}
      <p className="ai-admin__back">
        <Link to="/chat">← Open Chat / Visualise</Link>
      </p>
    </main>
  )
}
