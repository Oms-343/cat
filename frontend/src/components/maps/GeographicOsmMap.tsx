import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MapRegion } from './DensitySvgMap'
import { geocodePlace } from './geocode'
import type { GeoDrillLevel } from './geoTypes'
import { fillForCount, markerScaleForCount } from './mapColors'
import { OsmMap, type OsmMapMarker } from './OsmMap'
import {
  CBE_TALUK_GEO,
  getDistrictGeo,
  getTalukGeo,
  TN_CENTER,
  type LatLng,
} from './tamilNaduGeo'

export interface GeographicOsmMapProps {
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

interface PlacedRegion extends MapRegion {
  position: LatLng
}

export function GeographicOsmMap({
  title,
  regions,
  level,
  districtCode = '',
  districtName = '',
  hoveredCode,
  onHover,
  onSelect,
  disableEmpty = false,
}: GeographicOsmMapProps) {
  const [placed, setPlaced] = useState<PlacedRegion[]>([])
  const [resolving, setResolving] = useState(true)

  const max = useMemo(() => Math.max(0, ...regions.map((r) => r.count)), [regions])

  const resolvePositions = useCallback(async () => {
    const out: PlacedRegion[] = []

    for (const region of regions) {
      let position: LatLng | null = null

      if (level === 'state') {
        position = getDistrictGeo(region.code)
      } else if (level === 'district') {
        position = CBE_TALUK_GEO[region.code] ?? getTalukGeo(region.code, districtCode)
        if (!position) {
          position = await geocodePlace(`${region.name} taluk, ${districtName}, Tamil Nadu, India`)
        }
      } else if (level === 'taluk') {
        position = await geocodePlace(`${region.code} pincode, ${districtName}, Tamil Nadu, India`)
      }

      if (position) out.push({ ...region, position })
    }

    setPlaced(out)
    setResolving(false)
  }, [regions, level, districtCode, districtName])

  useEffect(() => {
    setResolving(true)
    void resolvePositions()
  }, [resolvePositions])

  const center = useMemo(() => {
    if (level === 'state') return TN_CENTER
    if (districtCode) return getDistrictGeo(districtCode) ?? TN_CENTER
    return TN_CENTER
  }, [level, districtCode])

  const zoom = level === 'state' ? 7 : level === 'district' ? 9 : 11

  const hovered = hoveredCode ? placed.find((p) => p.code === hoveredCode) : null

  const markers: OsmMapMarker[] = useMemo(() => placed.map((region) => {
    const disabled = disableEmpty && region.count === 0
    const isHovered = hoveredCode === region.code
    const color = fillForCount(region.count, max)
    const radius = markerScaleForCount(region.count, max) / 2

    return {
      id: region.code,
      position: region.position,
      radius,
      fillColor: color,
      strokeColor: isHovered ? '#2563eb' : '#1e3a8a',
      strokeWeight: isHovered ? 2.5 : 1,
      opacity: disabled ? 0.35 : 1,
      title: `${region.name}: ${region.count} MSMEs`,
      disabled,
      onClick: () => onSelect(region.code),
      onHover: () => onHover(region.code),
      onHoverEnd: () => onHover(null),
    }
  }), [placed, max, hoveredCode, disableEmpty, onHover, onSelect])

  return (
    <div className="relative">
      <p className="text-xs text-slate-500 mb-2">{title}</p>
      {resolving && (
        <p className="text-xs text-slate-400 mb-2 absolute z-[1000] left-2 top-8">Loading map markers…</p>
      )}
      <OsmMap
        center={center}
        zoom={zoom}
        markers={markers}
        fitToMarkers={placed.length > 1}
      />
      {hovered && (
        <div className="absolute top-10 right-3 bg-white/95 border border-slate-200 shadow-md rounded-lg px-3 py-2 text-sm pointer-events-none z-[1000]">
          <p className="font-semibold text-slate-900">{hovered.name}</p>
          <p className="text-slate-600 tabular-nums">
            <strong>{hovered.count.toLocaleString()}</strong> MSMEs
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-[#1d4ed8] border border-slate-300" /> High
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-[#60a5fa] border border-slate-300" /> Medium
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-[#fcd34d] border border-slate-300" /> Low
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-slate-300 border border-slate-300" /> None
        </span>
        <span className="text-slate-400">· © OpenStreetMap</span>
      </div>
    </div>
  )
}
