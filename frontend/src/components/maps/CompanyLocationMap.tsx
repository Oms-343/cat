import { useEffect, useMemo, useState } from 'react'
import { geocodePlace } from './geocode'
import { OsmMap, type OsmMapMarker } from './OsmMap'
import { getDistrictGeo, TN_CENTER, type LatLng } from './tamilNaduGeo'

export interface CompanyLocationMapProps {
  name: string
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  districtCode?: string | null
  districtName?: string | null
  pincode?: string | null
  state?: string | null
}

export function CompanyLocationMap({
  name,
  addressLine1,
  addressLine2,
  city,
  districtCode,
  districtName,
  pincode,
  state = 'Tamil Nadu',
}: CompanyLocationMapProps) {
  const [position, setPosition] = useState<LatLng | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading')

  const hasLocation = Boolean(addressLine1 || pincode || districtCode || city)

  const addressQuery = useMemo(() => {
    const parts = [addressLine1, addressLine2, city, pincode, districtName, state, 'India'].filter(
      Boolean,
    )
    return parts.join(', ')
  }, [addressLine1, addressLine2, city, pincode, districtName, state])

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      let pos: LatLng | null = null

      if (addressQuery.replace(/,\s*/g, '').length > 3) {
        pos = await geocodePlace(addressQuery)
      }
      if (!pos && pincode) {
        pos = await geocodePlace(`${pincode}, Tamil Nadu, India`)
      }
      if (!pos && districtCode) {
        pos = getDistrictGeo(districtCode)
      }

      if (cancelled) return
      if (pos && addressLine1) {
        setPosition(pos)
        setStatus('ready')
      } else if (pos) {
        setPosition(pos)
        setStatus('fallback')
      } else {
        setPosition(districtCode ? getDistrictGeo(districtCode) : TN_CENTER)
        setStatus('fallback')
      }
    }

    setStatus('loading')
    void resolve()
    return () => {
      cancelled = true
    }
  }, [addressQuery, pincode, districtCode, addressLine1])

  if (!hasLocation) return null

  const center = position ?? (districtCode ? getDistrictGeo(districtCode) : null) ?? TN_CENTER
  const zoom = status === 'ready' && addressLine1 ? 15 : pincode ? 13 : 10

  const markers: OsmMapMarker[] = position
    ? [
        {
          id: 'company',
          position,
          radius: 10,
          fillColor: '#2563eb',
          strokeColor: '#1e3a8a',
          strokeWeight: 2,
          opacity: 1,
          title: name,
        },
      ]
    : []

  return (
    <div>
      <h3 className="text-base font-semibold text-slate-900 mb-2">Location</h3>
      {status === 'loading' && <p className="text-xs text-slate-500 mb-2">Loading map…</p>}
      {status === 'fallback' && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 mb-2">
          Exact address could not be resolved — showing approximate area.
        </p>
      )}
      <OsmMap center={center} zoom={zoom} markers={markers} height="16rem" />
      {addressQuery && <p className="text-xs text-slate-500 mt-2">{addressQuery}</p>}
      <p className="text-[10px] text-slate-400 mt-1">© OpenStreetMap contributors</p>
    </div>
  )
}
