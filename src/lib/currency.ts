/** Display currencies. Catalog prices are always stored in INR. */
export type CurrencyCode = 'INR' | 'USD' | 'AED' | 'GBP' | 'EUR'

export type CurrencyOption = {
  code: CurrencyCode
  label: string
  short: string
  /** Multiply INR amount by this to get display currency */
  fromInr: number
  locale: string
  decimals: number
}

/**
 * Approximate display rates (INR → currency).
 * Quotes / WhatsApp stay in INR — these are for browsing only.
 */
export const CURRENCIES: CurrencyOption[] = [
  { code: 'INR', label: 'Indian Rupee', short: '₹ INR', fromInr: 1, locale: 'en-IN', decimals: 0 },
  { code: 'USD', label: 'US Dollar', short: '$ USD', fromInr: 1 / 83.5, locale: 'en-US', decimals: 0 },
  { code: 'AED', label: 'UAE Dirham', short: 'د.إ AED', fromInr: 1 / 22.7, locale: 'en-AE', decimals: 0 },
  { code: 'GBP', label: 'British Pound', short: '£ GBP', fromInr: 1 / 106, locale: 'en-GB', decimals: 0 },
  { code: 'EUR', label: 'Euro', short: '€ EUR', fromInr: 1 / 90.5, locale: 'en-IE', decimals: 0 },
]

const STORAGE_KEY = 'priyabadal-display-currency'
const DEFAULT: CurrencyCode = 'INR'

type Listener = () => void
const listeners = new Set<Listener>()

function isCurrencyCode(value: string): value is CurrencyCode {
  return CURRENCIES.some((c) => c.code === value)
}

function readStored(): CurrencyCode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw && isCurrencyCode(raw)) return raw
  } catch {
    /* ignore */
  }
  return DEFAULT
}

let current: CurrencyCode =
  typeof window !== 'undefined' ? readStored() : DEFAULT

export function getCurrency(): CurrencyCode {
  return current
}

export function getCurrencyOption(code: CurrencyCode = current): CurrencyOption {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0]!
}

export function setCurrency(code: CurrencyCode) {
  if (!isCurrencyCode(code)) return
  current = code
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    /* ignore */
  }
  listeners.forEach((listener) => listener())
}

export function subscribeCurrency(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Convert an INR catalog/cart amount into the display currency. */
export function convertFromInr(amountInr: number, code: CurrencyCode = current) {
  const option = getCurrencyOption(code)
  return amountInr * option.fromInr
}

/**
 * Format a price that is stored in INR.
 * Pass `currency: 'INR'` to force rupees (WhatsApp quotes / invoices).
 */
export function formatPrice(
  amountInr: number,
  currency: CurrencyCode = getCurrency(),
) {
  const option = getCurrencyOption(currency)
  const value = convertFromInr(amountInr, currency)
  return new Intl.NumberFormat(option.locale, {
    style: 'currency',
    currency: option.code,
    maximumFractionDigits: option.decimals,
    minimumFractionDigits: 0,
  }).format(value)
}

export function isApproxDisplayCurrency(code: CurrencyCode = getCurrency()) {
  return code !== 'INR'
}
