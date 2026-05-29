/**
 * Masters shown on the Master Data admin screen.
 * Other keys (districts, taluks, pincodes, hsn-codes, company-types) stay in the
 * DB/API for dropdowns, maps, seeds, and geo logic but are not on this screen.
 */
export const ADMIN_VISIBLE_MASTER_KEYS = [
  'legal-structures',
  'turnover-ranges',
  'sectors',
  'production-capacities',
  'certifications',
] as const

export type AdminVisibleMasterKey = (typeof ADMIN_VISIBLE_MASTER_KEYS)[number]

export function isAdminVisibleMaster(key: string): key is AdminVisibleMasterKey {
  return (ADMIN_VISIBLE_MASTER_KEYS as readonly string[]).includes(key)
}

export function sortMastersForAdmin<T extends { key: string }>(items: T[]): T[] {
  const order = new Map(ADMIN_VISIBLE_MASTER_KEYS.map((k, i) => [k, i]))
  return items
    .filter((m): m is T & { key: AdminVisibleMasterKey } => isAdminVisibleMaster(m.key))
    .sort((a, b) => (order.get(a.key) ?? 99) - (order.get(b.key) ?? 99))
}
