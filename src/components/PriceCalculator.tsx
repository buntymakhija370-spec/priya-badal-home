import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatPrice, getMinOrderQuantity, type Product } from '../data/catalog'
import {
  calculatePrice,
  CNC_CARVE_HD_RATE_PER_SQFT,
  defaultConfig,
  describeConfig,
  getFinishOptionsForProduct,
  getSizeLimits,
  getThicknessOptionsForProduct,
  isCncCarveHd,
  supportsBoardSupply,
  supportsBuildScope,
  type BoardSupplyId,
  type BuildScopeId,
  type PriceConfig,
} from '../lib/pricing'
import { addConfiguredToCart } from '../lib/cart'
import { buildWhatsAppQuoteUrl } from '../lib/whatsapp'
import { useCurrency } from '../hooks/useCurrency'
import './PriceCalculator.css'

type Props = {
  product: Product
  className?: string
}

type PriceCategoryOption = {
  id: string
  label: string
  unitPrice: number
  patch: Partial<PriceConfig>
}

export function CustomizeButton({ product, className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const minQty = getMinOrderQuantity(product)
  const label = minQty > 1 ? 'Bulk quote & cart' : 'Customise & Price'
  const close = useCallback(() => {
    // Blur so the browser does not scroll the trigger button into view on close
    const active = document.activeElement
    if (active instanceof HTMLElement) active.blur()
    setOpen(false)
  }, [])

  return (
    <>
      <button
        type="button"
        className={`btn btn--customise ${className}`.trim()}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
      >
        {label}
      </button>
      {open && <CalculatorOverlay product={product} onClose={close} />}
    </>
  )
}

type OverlayProps = {
  product: Product
  onClose: () => void
}

function CalculatorOverlay({ product, onClose }: OverlayProps) {
  useCurrency()
  const titleId = useId()
  const minQty = getMinOrderQuantity(product)
  const [config, setConfig] = useState<PriceConfig>(() =>
    defaultConfig(product.categoryId, product),
  )
  const [added, setAdded] = useState(false)
  const size = getSizeLimits(product.categoryId)
  const finishOptions = getFinishOptionsForProduct(product)
  const thicknessOptions = getThicknessOptionsForProduct(product)
  const hasBuildScope = supportsBuildScope(product.categoryId)
  const hasCnc = supportsBoardSupply(product.categoryId)
  const cncMode = isCncCarveHd(config)

  const quote = useMemo(
    () => calculatePrice(product, config),
    [product, config],
  )

  const priceCategories = useMemo((): PriceCategoryOption[] => {
    const options: PriceCategoryOption[] = []

    if (hasBuildScope) {
      const shutterPatch: Partial<PriceConfig> = {
        boardSupply: 'finished',
        buildScope: 'shutter',
      }
      const carcassPatch: Partial<PriceConfig> = {
        boardSupply: 'finished',
        buildScope: 'with-carcass',
      }
      options.push({
        id: 'shutter',
        label: 'Shutter only',
        unitPrice: calculatePrice(product, { ...config, ...shutterPatch }).unitPrice,
        patch: shutterPatch,
      })
      options.push({
        id: 'with-carcass',
        label: 'With carcass',
        unitPrice: calculatePrice(product, { ...config, ...carcassPatch }).unitPrice,
        patch: carcassPatch,
      })
    } else if (hasCnc) {
      const finishedPatch: Partial<PriceConfig> = { boardSupply: 'finished' }
      options.push({
        id: 'finished',
        label: 'Finished',
        unitPrice: calculatePrice(product, { ...config, ...finishedPatch }).unitPrice,
        patch: finishedPatch,
      })
    }

    if (hasCnc) {
      const cncPatch: Partial<PriceConfig> = {
        boardSupply: 'cnc-carve-hd' as BoardSupplyId,
      }
      options.push({
        id: 'cnc-carve-hd',
        label: 'CNC-Carve HD',
        unitPrice: calculatePrice(product, { ...config, ...cncPatch }).unitPrice,
        patch: cncPatch,
      })
    }

    return options
  }, [hasBuildScope, hasCnc, product, config])

  const selectedCategoryId = useMemo(() => {
    if (cncMode) return 'cnc-carve-hd'
    if (hasBuildScope) {
      return (config.buildScope ?? 'shutter') as BuildScopeId
    }
    return 'finished'
  }, [cncMode, hasBuildScope, config.buildScope])

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    // Overflow-only lock — avoid position:fixed + scrollTo restore (jumps page on close)
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    const prevBodyPaddingRight = body.style.paddingRight
    const scrollbar = window.innerWidth - html.clientWidth
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      body.style.paddingRight = prevBodyPaddingRight
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const update = (patch: Partial<PriceConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }))
  }

  const whatsappHref = buildWhatsAppQuoteUrl(
    product,
    quote.config,
    quote.unitPrice,
  )

  const sqft =
    cncMode || product.pricingMode === 'per-sqft'
      ? Math.round(quote.config.width * quote.config.height * 10) / 10
      : null

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
            <p className="calc-sheet__eyebrow">
              {minQty > 1 ? 'Bulk commercial' : 'Customise & Price'}
            </p>
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

        {minQty > 1 ? (
          <p className="calc-sheet__bulk-note">
            Lowest commercial rate — we accept orders only for a minimum of{' '}
            <strong>{minQty} identical packs</strong> (bulk manufacture).
          </p>
        ) : null}

        {priceCategories.length > 0 ? (
          <fieldset className="calc-sheet__price-cats">
            <legend>Price</legend>
            <div
              className="calc-sheet__price-list"
              role="radiogroup"
              aria-label="Price category"
            >
              {priceCategories.map((option) => {
                const selected = selectedCategoryId === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`calc-sheet__price-row${selected ? ' is-selected' : ''}`}
                    onClick={() => update(option.patch)}
                  >
                    <span className="calc-sheet__price-row-label">{option.label}</span>
                    <span className="calc-sheet__price-row-value">
                      {formatPrice(option.unitPrice)}
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        ) : null}

        {!cncMode && (finishOptions.length > 0 || thicknessOptions.length > 0) ? (
          <div className="calc-sheet__meta-bar" aria-label="Finish details">
            {finishOptions.length > 0 ? (
              <span>
                Finish <strong>{finishOptions[0]!.name}</strong>
              </span>
            ) : null}
            {thicknessOptions.length > 0 ? (
              <span>
                Thickness <strong>{thicknessOptions[0]!.label}</strong>
              </span>
            ) : null}
          </div>
        ) : null}

        {minQty <= 1 ? (
          <div className="calc-sheet__size-row">
            <label className="calc-sheet__field">
              Width (ft)
              <input
                type="number"
                min={size.minWidth}
                max={size.maxWidth}
                step={0.1}
                value={config.width}
                onChange={(e) => update({ width: Number(e.target.value) })}
              />
            </label>
            <label className="calc-sheet__field">
              Height (ft)
              <input
                type="number"
                min={size.minHeight}
                max={size.maxHeight}
                step={0.1}
                value={config.height}
                onChange={(e) => update({ height: Number(e.target.value) })}
              />
            </label>
          </div>
        ) : (
          <div className="calc-sheet__field calc-sheet__field--full">
            <span>Order quantity</span>
            <p className="calc-sheet__locked">Minimum {minQty} identical packs</p>
          </div>
        )}

        <div className="calc-sheet__footer">
          <div className="calc-sheet__estimate">
            <p className="calc-sheet__estimate-label">Estimated price</p>
            <p className="calc-sheet__price">{formatPrice(quote.unitPrice)}</p>
            <p className="calc-sheet__meta">
              {describeConfig(product.categoryId, quote.config)}
              {sqft != null ? ` · ${sqft} sq ft` : ''}
              {cncMode
                ? ` · ${formatPrice(CNC_CARVE_HD_RATE_PER_SQFT)}/sq ft`
                : product.pricingMode === 'per-sqft'
                  ? ` · ${formatPrice(quote.baseRate)}/sq ft`
                  : ''}
              {minQty > 1 ? ` · min ${minQty} packs` : ''}
            </p>
          </div>
          <div className="calc-sheet__cta">
            <button
              type="button"
              className="btn btn--dark calc-sheet__add"
              onClick={() => {
                addConfiguredToCart({
                  productId: product.id,
                  quantity: minQty,
                  config: quote.config,
                  unitPrice: quote.unitPrice,
                })
                setAdded(true)
                window.setTimeout(() => setAdded(false), 1400)
              }}
            >
              {added
                ? `Added ${minQty}+ to cart`
                : minQty > 1
                  ? `Add ${minQty} packs to cart`
                  : 'Add to cart'}
            </button>
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
      </div>
    </div>,
    document.body,
  )
}
