import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  askBusinessTeam,
  BUSINESS_TEAMS,
  extractWhatsAppDraft,
  getBusinessTeam,
  getTeamsAdminPin,
  setTeamsAdminPin,
  unlockBusinessTeams,
  type BusinessTeamId,
  type TeamHistoryItem,
} from '../lib/businessTeams'
import { WHATSAPP_CHAT_URL, WHATSAPP_DISPLAY } from '../lib/whatsapp'
import './BusinessTeamsPage.css'

type TeamThread = Record<BusinessTeamId, TeamHistoryItem[]>

const emptyThreads = (): TeamThread => ({
  sales: [],
  whatsapp: [],
  instagram: [],
})

export function BusinessTeamsPage() {
  const [pin, setPin] = useState('')
  const [authedPin, setAuthedPin] = useState<string | null>(() => getTeamsAdminPin())
  const [teamId, setTeamId] = useState<BusinessTeamId>('sales')
  const [draft, setDraft] = useState('')
  const [threads, setThreads] = useState<TeamThread>(emptyThreads)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [aiReady, setAiReady] = useState<boolean | null>(null)

  const team = useMemo(() => getBusinessTeam(teamId), [teamId])
  const history = threads[teamId]

  useEffect(() => {
    if (authedPin) void refreshAiStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on unlock session
  }, [authedPin])

  async function refreshAiStatus() {
    try {
      const res = await fetch('/api/visualise-status')
      const data = (await res.json()) as { falConfigured?: boolean; configured?: boolean }
      setAiReady(Boolean(data.falConfigured || data.configured))
    } catch {
      setAiReady(false)
    }
  }

  async function onUnlock(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await unlockBusinessTeams(pin)
      setAuthedPin(pin.trim())
      await refreshAiStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not unlock')
      setAuthedPin(null)
      setTeamsAdminPin(null)
    } finally {
      setBusy(false)
    }
  }

  async function onAsk(e: FormEvent) {
    e.preventDefault()
    if (!authedPin || !draft.trim()) return
    setBusy(true)
    setError(null)
    setCopied(false)
    const message = draft.trim()
    setDraft('')
    setThreads((prev) => ({
      ...prev,
      [teamId]: [...prev[teamId], { role: 'user', text: message }],
    }))
    try {
      const result = await askBusinessTeam({
        teamId,
        message,
        history,
        adminPin: authedPin,
      })
      setThreads((prev) => ({
        ...prev,
        [teamId]: [
          ...prev[teamId],
          { role: 'assistant', text: result.text },
        ],
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
      setDraft(message)
      setThreads((prev) => ({
        ...prev,
        [teamId]: prev[teamId].slice(0, -1),
      }))
    } finally {
      setBusy(false)
    }
  }

  function useExample(text: string) {
    setDraft(text)
    setError(null)
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setError('Could not copy — select the text manually.')
    }
  }

  function clearThread() {
    setThreads((prev) => ({ ...prev, [teamId]: [] }))
    setCopied(false)
  }

  function lockTeams() {
    setTeamsAdminPin(null)
    setAuthedPin(null)
    setPin('')
  }

  const lastAssistant = [...history].reverse().find((h) => h.role === 'assistant')
  const waDraft =
    teamId === 'whatsapp' && lastAssistant
      ? extractWhatsAppDraft(lastAssistant.text) || lastAssistant.text
      : null

  return (
    <main className="biz-teams page-pad">
      <header className="biz-teams__hero">
        <p className="eyebrow">Owner workspace</p>
        <h1>Business Teams</h1>
        <p>
          Three specialist AI desks for Priyabadal Homes — Sales coaching, WhatsApp
          replies, and Instagram Reel marketing — grounded in your live catalog.
        </p>
      </header>

      {!authedPin ? (
        <form className="biz-teams__card" onSubmit={onUnlock}>
          <h2>Unlock with admin PIN</h2>
          <p className="biz-teams__muted">
            Same owner PIN as{' '}
            <Link to="/ai-admin">AI admin</Link> (<code>AI_ADMIN_PIN</code>, default
            2468).
          </p>
          <label>
            <span>Admin PIN</span>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <button className="btn btn--dark" type="submit" disabled={busy || !pin}>
            {busy ? 'Checking…' : 'Open teams'}
          </button>
        </form>
      ) : (
        <>
          <div className="biz-teams__tabs" role="tablist" aria-label="Business teams">
            {BUSINESS_TEAMS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={teamId === t.id}
                className={
                  teamId === t.id
                    ? 'biz-teams__tab is-active'
                    : 'biz-teams__tab'
                }
                onClick={() => {
                  setTeamId(t.id)
                  setError(null)
                  setCopied(false)
                }}
              >
                {t.shortLabel}
              </button>
            ))}
          </div>

          <section className="biz-teams__card biz-teams__desk">
            <div className="biz-teams__desk-head">
              <div>
                <h2>{team.name}</h2>
                <p>{team.blurb}</p>
              </div>
              <div className="biz-teams__desk-actions">
                {history.length > 0 ? (
                  <button type="button" className="btn" onClick={clearThread}>
                    Clear thread
                  </button>
                ) : null}
                <button type="button" className="btn" onClick={lockTeams}>
                  Lock
                </button>
              </div>
            </div>

            {aiReady === false ? (
              <p className="biz-teams__warn">
                No Gemini/Fal key yet — teams still reply with an{' '}
                <strong>offline catalog draft</strong>. For full AI coaching,
                save a key in <Link to="/ai-admin">AI admin</Link>.
              </p>
            ) : null}

            <div className="biz-teams__examples" aria-label="Quick examples">
              {team.examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  className="biz-teams__chip"
                  onClick={() => useExample(ex)}
                >
                  {ex}
                </button>
              ))}
            </div>

            <div className="biz-teams__thread" aria-live="polite">
              {history.length === 0 ? (
                <p className="biz-teams__empty">
                  Brief this team like you would brief a colleague. Replies stay in
                  this browser tab until you clear them.
                </p>
              ) : (
                history.map((item, i) => (
                  <article
                    key={`${item.role}-${i}`}
                    className={
                      item.role === 'user'
                        ? 'biz-teams__bubble biz-teams__bubble--you'
                        : 'biz-teams__bubble biz-teams__bubble--team'
                    }
                  >
                    <p className="biz-teams__who">
                      {item.role === 'user' ? 'You' : team.shortLabel}
                    </p>
                    <pre className="biz-teams__body">{item.text}</pre>
                    {item.role === 'assistant' ? (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => void copyText(item.text)}
                      >
                        {copied ? 'Copied' : 'Copy reply'}
                      </button>
                    ) : null}
                  </article>
                ))
              )}
            </div>

            {waDraft ? (
              <div className="biz-teams__wa">
                <p>
                  WhatsApp draft ready · send from{' '}
                  <strong>{WHATSAPP_DISPLAY}</strong>
                </p>
                <div className="biz-teams__wa-actions">
                  <button
                    type="button"
                    className="btn btn--dark"
                    onClick={() => void copyText(waDraft)}
                  >
                    Copy WhatsApp text
                  </button>
                  <a
                    className="btn"
                    href={`${WHATSAPP_CHAT_URL}?text=${encodeURIComponent(waDraft)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open WhatsApp
                  </a>
                </div>
              </div>
            ) : null}

            <form className="biz-teams__composer" onSubmit={onAsk}>
              <label>
                <span className="visually-hidden">Brief for {team.name}</span>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={team.placeholder}
                  rows={4}
                  required
                />
              </label>
              <button
                className="btn btn--dark"
                type="submit"
                disabled={busy || !draft.trim()}
              >
                {busy ? 'Team working…' : `Ask ${team.shortLabel}`}
              </button>
            </form>
          </section>
        </>
      )}

      {error ? <p className="biz-teams__error">{error}</p> : null}

      <p className="biz-teams__foot">
        <Link to="/ai-admin">AI admin</Link>
        {' · '}
        <Link to="/chat">Customer Chat</Link>
        {' · '}
        <Link to="/">Home</Link>
      </p>
    </main>
  )
}
