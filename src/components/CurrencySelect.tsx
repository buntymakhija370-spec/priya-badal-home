import { CURRENCIES } from '../lib/currency'
import { useCurrency } from '../hooks/useCurrency'
import './CurrencySelect.css'

type Props = {
  className?: string
  /** Compact label for the nav bar */
  compact?: boolean
}

export function CurrencySelect({ className = '', compact = false }: Props) {
  const { currency, setCurrency } = useCurrency()

  return (
    <label className={`currency-select ${compact ? 'currency-select--compact' : ''} ${className}`.trim()}>
      <span className="sr-only">Display currency</span>
      {!compact ? <span className="currency-select__label">Currency</span> : null}
      <select
        value={currency}
        onChange={(event) => setCurrency(event.target.value as typeof currency)}
        aria-label="Display currency"
      >
        {CURRENCIES.map((option) => (
          <option key={option.code} value={option.code}>
            {compact ? option.code : option.short}
          </option>
        ))}
      </select>
    </label>
  )
}
