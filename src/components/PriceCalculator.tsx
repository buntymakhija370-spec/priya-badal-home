import { useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatPrice, type Product } from '../data/catalog'
import {
  FINISHES,
  THICKNESSES,
  calculatePrice,
  defaultConfig,
  describeConfig,
  getSizeLimits,
  type PriceConfig,
} from '../lib/pricing'
import { buildWhatsAppQuoteUrl } from '../lib/whatsapp'
import './PriceCalculator.css'

type Props = {
  product: Product
  fixed?: boolean
}

export function CustomizeButton({ product, fixed = false }: Props) {
  const [open, setOpen] = useState(false)

  const button = (
    <button
      type="button"
      className="btn btn--customise"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => setOpen(true)}
    >
      Customise &amp; Price
    </button>
  )

  return (
    <>
      {fixed ? (
        createPortal(
          <div className="customise-dock" hidden={open}>
            <div className="customise-dock__inner">{button}</div>
          </div>,
          document.body,
        )
      ) : (
        button
      )}
      {open && (
        <CalculatorOverlay product={product} onClose={() => setOpen(false)} />
      )}
    </>
  )
}

type OverlayProps = {
  product: Product
  onClose: () => void
}

function CalculatorOverlay({ product, onClose }: OverlayProps) {
  const titleId = useId()
  const [config, setConfig] = useState<PriceConfig>(() =>
    defaultConfig(product.categoryId, product),
  )
  const size = getSizeLimits(product.categoryId)

  const quote = useMemo(
    () => calculatePrice(product, config),
    [product, config],
  )

  useEffect(() => {
    const y = window.scrollY
    const { overflow, position, top, width } = document.body.style
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${y}px`
    document.body.style.width = '100%'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = overflow
      document.body.style.position = position
      document.body.style.top = top
      document.body.style.width = width
      window.scrollTo(0, y)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const update = (patch: Partial<PriceConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }))
  }

  const whatsappHref = buildWhatsAppQuoteUrl(
    product,
    quote.config,
    quote.unitPrice,
  )

  return createPortal(
    <div className="calc-overlay" role="presentation">
      <button
        type="button"
        className="calc-overlay__scrim"
        aria-label="Close calculator"
        onClick={onClose}
      />
      <div
        className="calc-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="calc-sheet__handle" aria-hidden="true" />
        <div className="calc-sheet__top">
          <div>
            <p className="calc-sheet__eyebrow">Customise &amp; Price</p>
            <h2 id={titleId}>{product.name}</h2>
          </div>
          <button
            type="button"
            className="calc-sheet__close"
            aria-label="Close calculator"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="calc-sheet__grid">
          <label className="calc-sheet__field">
            Finish
            <select
              value={config.finishId}
              onChange={(e) => update({ finishId: e.target.value })}
            >
              {FINISHES.map((finish) => (
                <option key={finish.id} value={finish.id}>
                  {finish.name}
                </option>
              ))}
            </select>
          </label>

          <label className="calc-sheet__field">
            Thickness
            <select
              value={config.thicknessId}
              onChange={(e) => update({ thicknessId: e.target.value })}
            >
              {THICKNESSES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="calc-sheet__field">
            Width (cm)
            <input
              type="number"
              min={size.minWidth}
              max={size.maxWidth}
              value={config.width}
              onChange={(e) => update({ width: Number(e.target.value) })}
            />
          </label>

          <label className="calc-sheet__field">
            Height (cm)
            <input
              type="number"
              min={size.minHeight}
              max={size.maxHeight}
              value={config.height}
              onChange={(e) => update({ height: Number(e.target.value) })}
            />
          </label>

          {size.usesDepth && (
            <label className="calc-sheet__field calc-sheet__field--full">
              Depth (cm)
              <input
                type="number"
                min={size.minDepth}
                max={size.maxDepth}
                value={config.depth}
                onChange={(e) => update({ depth: Number(e.target.value) })}
              />
            </label>
          )}
        </div>

        <div className="calc-sheet__footer">
          <div className="calc-sheet__estimate">
            <p className="calc-sheet__estimate-label">Estimated price</p>
            <p className="calc-sheet__price">{formatPrice(quote.unitPrice)}</p>
            <p className="calc-sheet__meta">
              {describeConfig(product.categoryId, quote.config)}
              {product.pricingMode === 'per-sqft'
                ? ` · base ${formatPrice(product.price)}/sq ft`
                : ''}
            </p>
          </div>
          <a
            className="whatsapp-quote-btn"
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp Quote
          </a>
        </div>
      </div>
    </div>,
    document.body,
  )
}
