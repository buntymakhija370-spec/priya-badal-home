import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SITE_ORIGIN } from '../lib/links'
import './InstallPage.css'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

function detectPlatform(): 'ios' | 'android' | 'other' {
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'other'
}

export function InstallPage() {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other')
  const [standalone, setStandalone] = useState(false)
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [status, setStatus] = useState('')
  const shareUrl = useMemo(() => SITE_ORIGIN, [])

  useEffect(() => {
    setPlatform(detectPlatform())
    setStandalone(isStandalone())

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const installAndroid = async () => {
    if (!deferred) {
      setStatus('Open this page in Chrome on Android, then tap Install below when it appears.')
      return
    }
    await deferred.prompt()
    const choice = await deferred.userChoice
    setDeferred(null)
    setStatus(choice.outcome === 'accepted' ? 'Installed — open Priyabadal from your home screen.' : 'Install cancelled.')
  }

  return (
    <main className="install-page page-pad">
      <p className="eyebrow">Live on iPhone & Android</p>
      <h1>Get the Priyabadal Homes app</h1>
      <p className="install-page__lede">
        Install on your phone in under a minute — no App Store or Play Store wait.
        Opens full-screen like a native app for your event and sales demos.
      </p>

      {standalone ? (
        <div className="install-page__live" role="status">
          <strong>You’re in app mode</strong>
          <p>Priyabadal Homes is already running as an installed app on this device.</p>
          <Link className="btn btn--dark" to="/">
            Go to Home
          </Link>
        </div>
      ) : (
        <>
          <div className="install-page__platforms">
            <section
              className={
                platform === 'ios'
                  ? 'install-card install-card--focus'
                  : 'install-card'
              }
            >
              <p className="install-card__os">Apple iPhone / iPad</p>
              <h2>Add to Home Screen</h2>
              <ol>
                <li>Open this site in <strong>Safari</strong> (required on iOS).</li>
                <li>Tap the <strong>Share</strong> button.</li>
                <li>Scroll and tap <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> — then open the Priyabadal icon.</li>
              </ol>
              <p className="install-card__note">
                Chrome / Instagram / WhatsApp in-app browsers on iPhone cannot install — use Safari.
              </p>
            </section>

            <section
              className={
                platform === 'android'
                  ? 'install-card install-card--focus'
                  : 'install-card'
              }
            >
              <p className="install-card__os">Android</p>
              <h2>Install the app</h2>
              <ol>
                <li>Open this site in <strong>Chrome</strong>.</li>
                <li>Tap <strong>Install</strong> below, or Chrome menu → <strong>Install app</strong>.</li>
                <li>Confirm — then open Priyabadal from your home screen / app drawer.</li>
              </ol>
              <button
                type="button"
                className="btn btn--dark"
                onClick={installAndroid}
                disabled={platform === 'ios'}
              >
                {deferred ? 'Install on Android' : 'Install when Chrome is ready'}
              </button>
              {status ? <p className="install-card__status">{status}</p> : null}
            </section>
          </div>

          <section className="install-page__share">
            <h2>Share at your event</h2>
            <p>Send this link so guests can install on their own phones:</p>
            <code className="install-page__url">{shareUrl}</code>
            <div className="install-page__share-actions">
              <button
                type="button"
                className="btn btn--outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl)
                    setStatus('Link copied.')
                  } catch {
                    setStatus('Copy the link above manually.')
                  }
                }}
              >
                Copy link
              </button>
              <Link className="btn btn--dark" to="/chat">
                Open AI Chat
              </Link>
            </div>
          </section>
        </>
      )}
    </main>
  )
}
