/** Temporary event window: show every collection in nav/shop. */
export const OPEN_ALL_CATEGORIES_UNTIL = Date.parse('2026-08-24T23:59:59+05:30')

export function isOpenAllCategoriesActive(now = Date.now()): boolean {
  return now < OPEN_ALL_CATEGORIES_UNTIL
}
