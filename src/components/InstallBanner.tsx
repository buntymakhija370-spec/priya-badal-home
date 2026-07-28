import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './InstallBanner.css'

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

function isMobile() {
  return /iphone|ipad|ipod|android/i.test(navigator.userAgent) || window.innerWidth < 960
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

const DISMISS_KEY = 'pbh-install-dismissed'

export function InstallBanner() {
  const location = useLocation()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [iosHint, setIosHint] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    if (location.pathname === '/install') return
    if (sessionStorage.getItem(DISMISS_KEY) === '1') return
    if (!isMobile()) return

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
      setIosHint(false)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)

    const t = window.setTimeout(() => {
      if (isIos()) setIosHint(true)
      setVisible(true)
    }, 1200)

    return () => {
      window.clearTimeout(t)
      window.removeEventListener('beforeinstallprompt', onPrompt)
    }
  }, [location.pathname])

  if (!visible || location.pathname === '/install') return null

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
        <strong>Live on iPhone & Android</strong>
        <p>
          {iosHint
            ? 'Safari → Share → Add to Home Screen for the full Priyabadal app.'
            : deferred
              ? 'Install now for a full-screen app on your phone.'
              : 'Install Priyabadal Homes on your phone — iPhone and Android.'}
        </p>
      </div>
      <div className="install-banner__actions">
        {deferred ? (
          <button type="button" className="btn btn--dark install-banner__btn" onClick={install}>
            Install
          </button>
        ) : (
          <Link className="btn btn--dark install-banner__btn" to="/install" onClick={dismiss}>
            Get the App
          </Link>
        )}
        <button type="button" className="install-banner__dismiss" onClick={dismiss}>
          Not now
        </button>
      </div>
    </div>
  )
}
