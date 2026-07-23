import { useEffect, useId, useMemo, useRef, useState } from 'react'
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

  return (
    <>
      <button
        type="button"
        className="btn btn--dark"
        onClick={() => setOpen(true)}
      >
        Customize
      </button>
      {open && (
        <PriceCalculatorModal product={product} onClose={() => setOpen(false)} />
      )}
    </>
  )
}

type ModalProps = {
  product: Product
  onClose: () => void
}

function PriceCalculatorModal({ product, onClose }: ModalProps) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
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
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

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
      onClose()
    }, 900)
  }

  return (
    <div className="calc-overlay" role="presentation" onClick={onClose}>
      <div
        className="calc-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="calc-panel__top">
          <div>
            <p className="calc-panel__eyebrow">Customize</p>
            <h2 id={titleId}>{product.name}</h2>
          </div>
          <button
            ref={closeRef}
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
    </div>
  )
}
