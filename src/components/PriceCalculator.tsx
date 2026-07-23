import { useEffect, useId, useMemo, useRef, useState } from 'react'
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
import { addConfiguredToCart } from '../lib/cart'
import './PriceCalculator.css'

type Props = {
  product: Product
}

export function CustomizeButton({ product }: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const scrollYRef = useRef(0)

  const openCalculator = () => {
    scrollYRef.current = window.scrollY
    setOpen(true)
  }

  const closeCalculator = () => {
    setOpen(false)
    // Keep the user at the same place on the product page
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollYRef.current, left: 0, behavior: 'instant' as ScrollBehavior })
    })
  }

  useEffect(() => {
    if (!open) return

    // Prevent the browser from jumping when focus moves into the panel
    window.scrollTo({ top: scrollYRef.current, left: 0, behavior: 'instant' as ScrollBehavior })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCalculator()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="calc-inline" ref={wrapRef}>
      <button
        type="button"
        className={`btn ${open ? 'btn--outline' : 'btn--dark'}`}
        aria-expanded={open}
        aria-controls="product-calculator"
        onClick={() => (open ? closeCalculator() : openCalculator())}
      >
        {open ? 'Close calculator' : 'Customize'}
      </button>

      {open && (
        <PriceCalculatorPanel
          product={product}
          onClose={closeCalculator}
          onAdded={closeCalculator}
        />
      )}

      {open &&
        createPortal(
          <button
            type="button"
            className="calc-scrim"
            aria-label="Close calculator"
            onClick={closeCalculator}
          />,
          document.body,
        )}
    </div>
  )
}

type PanelProps = {
  product: Product
  onClose: () => void
  onAdded: () => void
}

function PriceCalculatorPanel({ product, onClose, onAdded }: PanelProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const [config, setConfig] = useState<PriceConfig>(() =>
    defaultConfig(product.categoryId),
  )
  const [justAdded, setJustAdded] = useState(false)
  const size = getSizeLimits(product.categoryId)

  const quote = useMemo(
    () => calculatePrice(product.price, product.categoryId, config),
    [product.price, product.categoryId, config],
  )

  useEffect(() => {
    // Keep panel in view without jumping to the top of the page
    panelRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [])

  const update = (patch: Partial<PriceConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }))
  }

  const onAdd = () => {
    addConfiguredToCart({
      productId: product.id,
      quantity: 1,
      config: quote.config,
      unitPrice: quote.unitPrice,
    })
    setJustAdded(true)
    window.setTimeout(() => {
      setJustAdded(false)
      onAdded()
    }, 900)
  }

  return (
    <div
      ref={panelRef}
      id="product-calculator"
      className="calc-panel calc-panel--inline"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
    >
      <div className="calc-panel__top">
        <div>
          <p className="calc-panel__eyebrow">Calculator</p>
          <h2 id={titleId}>Finish · Thickness · Size</h2>
        </div>
        <button
          type="button"
          className="calc-panel__close"
          aria-label="Close calculator"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="calc-panel__grid">
        <label className="calc-panel__field">
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

        <label className="calc-panel__field">
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

        <label className="calc-panel__field">
          Width (cm)
          <input
            type="number"
            min={size.minWidth}
            max={size.maxWidth}
            value={config.width}
            onChange={(e) => update({ width: Number(e.target.value) })}
          />
        </label>

        <label className="calc-panel__field">
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
          <label className="calc-panel__field calc-panel__field--full">
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

      <div className="calc-panel__footer">
        <div>
          <p className="calc-panel__price">{formatPrice(quote.unitPrice)}</p>
          <p className="calc-panel__meta">
            {describeConfig(product.categoryId, quote.config)}
          </p>
        </div>
        <button type="button" className="cart-btn" onClick={onAdd}>
          {justAdded ? 'Added' : 'Add to cart'}
        </button>
      </div>
    </div>
  )
}
