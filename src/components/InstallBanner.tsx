import { useEffect, useState } from 'react'
import './InstallBanner.css'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    ('standalone' in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

const DISMISS_KEY = 'pbh-install-dismissed'

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [iosHint, setIosHint] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    if (sessionStorage.getItem(DISMISS_KEY) === '1') return

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
      setIosHint(false)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)

    // iOS has no beforeinstallprompt — show Add to Home Screen tip
    if (isIos()) {
      const t = window.setTimeout(() => {
        setIosHint(true)
        setVisible(true)
      }, 1800)
      return () => {
        window.clearTimeout(t)
        window.removeEventListener('beforeinstallprompt', onPrompt)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (!visible) return null

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    setVisible(false)
  }

  return (
    <div className="install-banner" role="dialog" aria-label="Install Priyabadal Homes app">
      <div className="install-banner__copy">
        <strong>Use like an app</strong>
        <p>
          {iosHint
            ? 'On iPhone: tap Share, then Add to Home Screen for a full-screen Priyabadal Homes app.'
            : 'Install Priyabadal Homes on your phone for a faster, full-screen experience.'}
        </p>
      </div>
      <div className="install-banner__actions">
        {!iosHint && deferred ? (
          <button type="button" className="btn btn--dark install-banner__btn" onClick={install}>
            Install
          </button>
        ) : null}
        <button type="button" className="install-banner__dismiss" onClick={dismiss}>
          Not now
        </button>
      </div>
    </div>
  )
}
