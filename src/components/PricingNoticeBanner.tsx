import { WHATSAPP_CHAT_URL, WHATSAPP_DISPLAY } from '../lib/whatsapp'
import './PricingNoticeBanner.css'

export function PricingNoticeBanner() {
  return (
    <div className="pricing-notice" role="status">
      <p className="pricing-notice__text">
        Website prices are under construction — please confirm the exact quote on WhatsApp.
        We are very sorry for the inconvenience. We are working on it.
      </p>
      <a
        className="pricing-notice__link"
        href={`${WHATSAPP_CHAT_URL}?text=${encodeURIComponent(
          'Hi Priyabadal Homes, please share the exact quote for the product I am checking on the website.',
        )}`}
        target="_blank"
        rel="noreferrer"
      >
        WhatsApp {WHATSAPP_DISPLAY}
      </a>
    </div>
  )
}
