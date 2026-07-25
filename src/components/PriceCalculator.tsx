import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatPrice, getMinOrderQuantity, type Product } from '../data/catalog'
import {
  calculatePrice,
  defaultConfig,
  describeConfig,
  getCncCarveHdRate,
  getFinishOptionsForProduct,
  getSizeLimits,
  getThickness,
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

    const withHandles = product.handlePairPrice != null

    if (hasBuildScope) {
      const shutterPatch: Partial<PriceConfig> = {
        boardSupply: 'finished',
        buildScope: 'shutter',
        includeHandlePair: withHandles ? config.includeHandlePair : false,
      }
      const carcassPatch: Partial<PriceConfig> = {
        boardSupply: 'finished',
        buildScope: 'with-carcass',
        includeHandlePair: withHandles ? config.includeHandlePair : false,
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
      const finishedPatch: Partial<PriceConfig> = {
        boardSupply: 'finished',
        includeHandlePair: withHandles ? config.includeHandlePair : false,
      }
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
        includeHandlePair: false,
        ...(product.cncThicknessId
          ? { thicknessId: product.cncThicknessId }
          : {}),
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
  const cncRate = getCncCarveHdRate(product)
  const cncThickness = product.cncThicknessId
    ? getThickness(product.cncThicknessId)
    : null
  const orderNotes = product.orderNotes ?? []
  const showHandleToggle =
    !cncMode && product.handlePairPrice != null && product.handlePairPrice > 0

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

        {cncMode ? (
          <div className="calc-sheet__finish-row">
            <div className="calc-sheet__field">
              <span>Finish</span>
              <p className="calc-sheet__locked calc-sheet__locked--strong">
                No paint · No finishing
              </p>
            </div>
            <div className="calc-sheet__field">
              <span>Board</span>
              <p className="calc-sheet__locked calc-sheet__locked--strong">
                CNC HD{cncThickness ? ` · ${cncThickness.label}` : ''}
              </p>
            </div>
          </div>
        ) : finishOptions.length > 0 || thicknessOptions.length > 0 ? (
          <div className="calc-sheet__finish-row">
            {finishOptions.length > 0 ? (
              finishOptions.length === 1 ? (
                <div className="calc-sheet__field">
                  <span>Finish</span>
                  <p className="calc-sheet__locked calc-sheet__locked--strong">
                    {finishOptions[0]!.name}
                  </p>
                </div>
              ) : (
                <label className="calc-sheet__field">
                  Finish
                  <select
                    value={config.finishId}
                    onChange={(e) => update({ finishId: e.target.value })}
                  >
                    {finishOptions.map((finish) => (
                      <option key={finish.id} value={finish.id}>
                        {finish.name}
                      </option>
                    ))}
                  </select>
                </label>
              )
            ) : null}
            {thicknessOptions.length > 0 ? (
              thicknessOptions.length === 1 ? (
                <div className="calc-sheet__field">
                  <span>Thickness</span>
                  <p className="calc-sheet__locked calc-sheet__locked--strong">
                    {thicknessOptions[0]!.label}
                  </p>
                </div>
              ) : (
                <label className="calc-sheet__field">
                  Thickness
                  <select
                    value={config.thicknessId}
                    onChange={(e) => update({ thicknessId: e.target.value })}
                  >
                    {thicknessOptions.map((thickness) => (
                      <option key={thickness.id} value={thickness.id}>
                        {thickness.label}
                      </option>
                    ))}
                  </select>
                </label>
              )
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

        {showHandleToggle ? (
          <label className="calc-sheet__addon">
            <input
              type="checkbox"
              checked={Boolean(config.includeHandlePair)}
              onChange={(e) => update({ includeHandlePair: e.target.checked })}
            />
            <span>
              Handle pair · {formatPrice(product.handlePairPrice!)}
              <small>Back side laminated</small>
            </span>
          </label>
        ) : null}

        {orderNotes.length > 0 ? (
          <div className="calc-sheet__notes">
            <p className="calc-sheet__notes-title">Order notes</p>
            <ul>
              {orderNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="calc-sheet__footer">
          <div className="calc-sheet__estimate">
            <p className="calc-sheet__estimate-label">Estimated price</p>
            <p className="calc-sheet__price">{formatPrice(quote.unitPrice)}</p>
            <p className="calc-sheet__meta">
              {describeConfig(product.categoryId, quote.config)}
              {sqft != null ? ` · ${sqft} sq ft` : ''}
              {cncMode
                ? ` · ${formatPrice(cncRate)}/sq ft`
                : product.pricingMode === 'per-sqft'
                  ? ` · ${formatPrice(quote.baseRate)}/sq ft`
                  : ''}
              {quote.handleAddOn > 0
                ? ` · +${formatPrice(quote.handleAddOn)} handles`
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
