/** Placeholder SVG layouts for talukas without official boundary GeoJSON. */

import { TN_TALUK_PLACEHOLDERS_URL } from '../../constants/maps/mapAssets'
import type { LayoutPincode } from './tnLayoutMap'

export interface TalukPlaceholder {
  name: string
  /** SVG path in 800×760 viewBox coordinates (matches TalukPincodeMap). */
  d: string
  cx: number
  cy: number
  fill: string
  pincodes?: LayoutPincode[]
}

export type TalukPlaceholderMap = Record<string, TalukPlaceholder>

let cached: TalukPlaceholderMap | null = null
let cachedPromise: Promise<TalukPlaceholderMap> | null = null

export async function loadTalukPlaceholders(): Promise<TalukPlaceholderMap> {
  if (cached) return cached
  if (cachedPromise) return cachedPromise
  cachedPromise = fetch(TN_TALUK_PLACEHOLDERS_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load taluk placeholders (HTTP ${r.status})`)
      return r.json() as Promise<TalukPlaceholderMap>
    })
    .then((data) => {
      cached = data
      return data
    })
    .catch((err) => {
      cachedPromise = null
      throw err
    })
  return cachedPromise
}

export function getTalukPlaceholder(
  placeholders: TalukPlaceholderMap | null,
  talukCode: string,
): TalukPlaceholder | null {
  if (!placeholders) return null
  return placeholders[talukCode] ?? null
}
