import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { OSM_ATTRIBUTION, OSM_TILE_URL } from './osmConfig'
import type { LatLng } from './tamilNaduGeo'

export interface OsmMapMarker {
  id: string
  position: LatLng
  radius: number
  fillColor: string
  strokeColor: string
  strokeWeight: number
  opacity: number
  title: string
  disabled?: boolean
  onClick?: () => void
  onHover?: () => void
  onHoverEnd?: () => void
}

export interface OsmMapProps {
  center: LatLng
  zoom: number
  markers?: OsmMapMarker[]
  fitToMarkers?: boolean
  height?: string
  className?: string
}

export function OsmMap({
  center,
  zoom,
  markers = [],
  fitToMarkers = false,
  height = 'min(480px, 60vh)',
  className = '',
}: OsmMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(
      [center.lat, center.lng],
      zoom,
    )
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19 }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setView([center.lat, center.lng], zoom)
  }, [center.lat, center.lng, zoom])

  useEffect(() => {
    const map = mapRef.current
    const group = layerRef.current
    if (!map || !group) return

    group.clearLayers()
    const leafletMarkers: L.CircleMarker[] = []

    for (const m of markers) {
      const circle = L.circleMarker([m.position.lat, m.position.lng], {
        radius: m.radius,
        fillColor: m.fillColor,
        fillOpacity: 0.9,
        color: m.strokeColor,
        weight: m.strokeWeight,
        opacity: m.opacity,
      })
      circle.bindTooltip(m.title, { direction: 'top', offset: [0, -4] })
      if (!m.disabled && m.onClick) circle.on('click', m.onClick)
      if (!m.disabled && m.onHover) {
        circle.on('mouseover', m.onHover)
        circle.on('mouseout', () => m.onHoverEnd?.())
      }
      circle.addTo(group)
      leafletMarkers.push(circle)
    }

    if (fitToMarkers && leafletMarkers.length > 0) {
      const bounds = L.featureGroup(leafletMarkers).getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.15))
      }
    }
  }, [markers, fitToMarkers])

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-lg border border-slate-200 z-0 ${className}`}
      style={{ height, minHeight: 200 }}
    />
  )
}
