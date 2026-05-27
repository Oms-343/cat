import { GeographicChoroplethMap } from './GeographicChoroplethMap'
import { TalukChoroplethMap } from './TalukChoroplethMap'
import { TalukPincodeMap } from './TalukPincodeMap'
import type { GeoDrillLevel } from './geoTypes'
import type { MapRegion } from './mapTypes'

export interface GeographicMapPanelProps {
  title: string
  regions: MapRegion[]
  level: GeoDrillLevel
  districtCode?: string
  districtName?: string
  talukCode?: string
  talukName?: string
  hoveredCode: string | null
  onHover: (code: string | null) => void
  onSelectDistrict: (code: string) => void
  onSelectTaluk: (code: string) => void
  onSelectPincode: (pincode: string) => void
  onNavigate: (updates: Record<string, string | null>) => void
  onBack: () => void
  disableEmpty?: boolean
}

/**
 * Multi-level Tamil Nadu map:
 * - state: accurate district GeoJSON (src/constants/maps/tn-districts.geojson)
 * - district: LGD taluk GeoJSON per district (src/constants/maps/tn-taluks/{code}.geojson)
 * - taluk: selected taluk boundary + pincode MSME markers
 */
export function GeographicMapPanel({
  level,
  districtCode = '',
  districtName = '',
  talukCode = '',
  talukName = '',
  onSelectTaluk,
  onSelectPincode,
  onNavigate,
  onBack,
  ...rest
}: GeographicMapPanelProps) {
  if (level === 'taluk') {
    return (
      <TalukPincodeMap
        level="taluk"
        district={districtCode || undefined}
        districtCode={districtCode}
        districtName={districtName}
        taluk={talukCode || undefined}
        talukCode={talukCode}
        talukName={talukName}
        regions={rest.regions}
        hoveredCode={rest.hoveredCode}
        onHover={rest.onHover}
        onSelectPincode={onSelectPincode}
        onNavigate={onNavigate}
        onBack={onBack}
      />
    )
  }

  if (level === 'district') {
    return (
      <TalukChoroplethMap
        level="district"
        district={districtCode || undefined}
        districtCode={districtCode}
        districtName={districtName}
        regions={rest.regions}
        hoveredCode={rest.hoveredCode}
        onHover={rest.onHover}
        onSelectTaluk={onSelectTaluk}
        onNavigate={onNavigate}
        onBack={onBack}
      />
    )
  }

  return (
    <GeographicChoroplethMap
      {...rest}
      level={level}
      districtCode={districtCode}
      districtName={districtName}
      onSelectDistrict={rest.onSelectDistrict}
      onNavigate={onNavigate}
    />
  )
}
