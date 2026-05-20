import type { MapRegion } from './DensitySvgMap'
import { GeographicOsmMap } from './GeographicOsmMap'
import type { GeoDrillLevel } from './geoTypes'

export interface GeographicMapPanelProps {
  title: string
  regions: MapRegion[]
  level: GeoDrillLevel
  districtCode?: string
  districtName?: string
  hoveredCode: string | null
  onHover: (code: string | null) => void
  onSelect: (code: string) => void
  disableEmpty?: boolean
}

/** Interactive map using free OpenStreetMap tiles (no API key). */
export function GeographicMapPanel(props: GeographicMapPanelProps) {
  return <GeographicOsmMap {...props} />
}
