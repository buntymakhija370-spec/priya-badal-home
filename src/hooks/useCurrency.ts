import { useSyncExternalStore } from 'react'
import {
  getCurrency,
  setCurrency,
  subscribeCurrency,
  type CurrencyCode,
} from '../lib/currency'

export function useCurrency() {
  const currency = useSyncExternalStore(
    subscribeCurrency,
    getCurrency,
    () => 'INR' as CurrencyCode,
  )

  return {
    currency,
    setCurrency,
  }
}
