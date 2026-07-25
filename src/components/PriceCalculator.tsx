import { useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatPrice, getMinOrderQuantity, type Product } from '../data/catalog'
import {
  calculatePrice,
  CNC_CARVE_HD_RATE_PER_SQFT,
  defaultConfig,
  describeConfig,
  getBoardSupplyOptions,
  getBuildScopeOptions,
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

export function CustomizeButton({ product, className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const minQty = getMinOrderQuantity(product)
  const label = minQty > 1 ? 'Bulk quote & cart' : 'Customise & Price'

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
  const buildScopes = getBuildScopeOptions(product.categoryId)
  const boardSupplies = getBoardSupplyOptions(product.categoryId)
  const showBoardSupply = supportsBoardSupply(product.categoryId)
  const cncMode = isCncCarveHd(config)
  const showBuildScope = supportsBuildScope(product.categoryId) && !cncMode

  const quote = useMemo(
    () => calculatePrice(product, config),
    [product, config],
  )

  const scopeQuotes = useMemo(() => {
    if (!showBuildScope) return []
    return buildScopes.map((scope) => ({
      scope,
      unitPrice: calculatePrice(product, {
        ...config,
        buildScope: scope.id,
      }).unitPrice,
    }))
  }, [showBuildScope, buildScopes, product, config])

  const boardQuotes = useMemo(() => {
    if (!showBoardSupply) return []
    return boardSupplies.map((supply) => ({
      supply,
      unitPrice: calculatePrice(product, {
        ...config,
        boardSupply: supply.id,
      }).unitPrice,
    }))
  }, [showBoardSupply, boardSupplies, product, config])

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

        {showBoardSupply ? (
          <fieldset className="calc-sheet__scopes">
            <legend>Board supply</legend>
            <p className="calc-sheet__scopes-hint">
              Finished product as catalogued, or unfinished CNC-Carve HD Board
              (white canvas — you paint and finish).
            </p>
            <div
              className="calc-sheet__scope-grid"
              role="radiogroup"
              aria-label="Board supply"
            >
              {boardQuotes.map(({ supply, unitPrice }) => {
                const selected = (config.boardSupply ?? 'finished') === supply.id
                return (
                  <button
                    key={supply.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`calc-sheet__scope${selected ? ' is-selected' : ''}`}
                    onClick={() =>
                      update({ boardSupply: supply.id as BoardSupplyId })
                    }
                  >
                    <span className="calc-sheet__scope-name">{supply.name}</span>
                    <span className="calc-sheet__scope-desc">
                      {supply.description}
                    </span>
                    <span className="calc-sheet__scope-price">
                      {formatPrice(unitPrice)}
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        ) : null}

        {cncMode ? (
          <p className="calc-sheet__cnc-note">
            <strong>CNC-Carve HD Board</strong> — carved HD board only. No paint,
            no finishing. Feel free to finish it however you like.
            Rate {formatPrice(CNC_CARVE_HD_RATE_PER_SQFT)} / sq ft.
          </p>
        ) : null}

        {showBuildScope ? (
          <fieldset className="calc-sheet__scopes">
            <legend>Price category</legend>
            <p className="calc-sheet__scopes-hint">
              Shutter only, or with carcass (shutter + carcass rates added).
            </p>
            <div className="calc-sheet__scope-grid" role="radiogroup" aria-label="Price category">
              {scopeQuotes.map(({ scope, unitPrice }) => {
                const selected = config.buildScope === scope.id
                return (
                  <button
                    key={scope.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`calc-sheet__scope${selected ? ' is-selected' : ''}`}
                    onClick={() => update({ buildScope: scope.id as BuildScopeId })}
                  >
                    <span className="calc-sheet__scope-name">{scope.name}</span>
                    <span className="calc-sheet__scope-desc">{scope.description}</span>
                    <span className="calc-sheet__scope-price">{formatPrice(unitPrice)}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        ) : null}

        <div className="calc-sheet__grid">
          {cncMode ? (
            <div className="calc-sheet__field">
              <span>Finish</span>
              <p className="calc-sheet__locked">No paint · No finishing</p>
            </div>
          ) : (
            finishOptions.length > 0 && (
              <div className="calc-sheet__field">
                <span>Finish</span>
                <p className="calc-sheet__locked">{finishOptions[0]!.name}</p>
              </div>
            )
          )}

          {cncMode ? (
            <div className="calc-sheet__field">
              <span>Board</span>
              <p className="calc-sheet__locked">HD board · CNC carve</p>
            </div>
          ) : (
            thicknessOptions.length > 0 && (
              <div className="calc-sheet__field">
                <span>Thickness</span>
                <p className="calc-sheet__locked">{thicknessOptions[0]!.label}</p>
              </div>
            )
          )}

          {minQty <= 1 ? (
            <>
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
            </>
          ) : (
            <div className="calc-sheet__field">
              <span>Order quantity</span>
              <p className="calc-sheet__locked">Minimum {minQty} identical packs</p>
            </div>
          )}
        </div>

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
