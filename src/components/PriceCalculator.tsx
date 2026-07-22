import { useMemo, useState } from 'react'
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

export function PriceCalculator({ product }: Props) {
  const [config, setConfig] = useState<PriceConfig>(() =>
    defaultConfig(product.categoryId),
  )
  const [justAdded, setJustAdded] = useState(false)
  const size = getSizeLimits(product.categoryId)

  const quote = useMemo(
    () => calculatePrice(product.price, product.categoryId, config),
    [product.price, product.categoryId, config],
  )

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
    window.setTimeout(() => setJustAdded(false), 1400)
  }

  return (
    <section className="calc" aria-labelledby="calc-title">
      <div className="calc__head">
        <h2 id="calc-title">Custom calculator</h2>
        <p>Adjust finish, thickness, and size — price updates instantly.</p>
      </div>

      <div className="calc__grid">
        <label className="calc__field">
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

        <label className="calc__field">
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

        <label className="calc__field">
          Width (cm)
          <input
            type="number"
            min={size.minWidth}
            max={size.maxWidth}
            value={config.width}
            onChange={(e) => update({ width: Number(e.target.value) })}
          />
        </label>

        <label className="calc__field">
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
          <label className="calc__field">
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

      <div className="calc__result">
        <div>
          <p className="calc__result-label">Estimated price</p>
          <p className="calc__result-price">{formatPrice(quote.unitPrice)}</p>
          <p className="calc__result-meta">
            {describeConfig(product.categoryId, quote.config)}
          </p>
          <p className="calc__result-base">
            Base from {formatPrice(product.price)} · scaled by finish, thickness &
            size
          </p>
        </div>
        <button
          type="button"
          className="cart-btn cart-btn--lg"
          onClick={onAdd}
        >
          {justAdded ? 'Added to cart' : 'Add to cart'}
        </button>
      </div>
    </section>
  )
}
