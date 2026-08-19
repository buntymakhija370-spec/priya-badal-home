/** Event windows for Priyabadal Homes launch */

/** Show every collection in nav/shop chips */
export const OPEN_ALL_CATEGORIES_UNTIL = Date.parse('2026-08-24T23:59:59+05:30')

/** Complimentary server AI (Visualise / Chat / Carcass) — no visitor Fal key */
export const PUBLIC_AI_UNTIL = Date.parse('2026-08-24T23:59:59+05:30')

export const PUBLIC_AI_UNTIL_LABEL = '24 Aug 2026'

export function isOpenAllCategoriesActive(now = Date.now()): boolean {
  return now < OPEN_ALL_CATEGORIES_UNTIL
}

export function isPublicAiOpen(now = Date.now()): boolean {
  return now < PUBLIC_AI_UNTIL
}
