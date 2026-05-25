/** Vite-resolved URLs for Tamil Nadu map data (lives under src/, not public/). */

import districtsUrl from './tn-districts.geojson?url'
import layoutUrl from './tn-taluk-layout.json?url'
import indexUrl from './tn-taluks-index.json?url'

const talukGeoModules = import.meta.glob('./tn-taluks/*.geojson', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const TN_DISTRICTS_GEOJSON_URL = districtsUrl
export const TN_TALUK_LAYOUT_URL = layoutUrl
export const TN_TALUKS_INDEX_URL = indexUrl

export function talukGeoJsonUrl(districtCode: string): string {
  const key = `./tn-taluks/${districtCode}.geojson`
  const url = talukGeoModules[key]
  if (!url) {
    throw new Error(`Unknown district GeoJSON: ${districtCode}`)
  }
  return url
}
