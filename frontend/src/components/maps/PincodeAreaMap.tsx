import { useEffect, useState } from 'react'
import { geocodePlace } from './geocode'
import { OsmMap, type OsmMapMarker } from './OsmMap'
import { getDistrictGeo, TN_CENTER, type LatLng } from './tamilNaduGeo'

export function PincodeAreaMap({
  pincode,
  districtName,
  districtCode,
}: {
  pincode: string
  districtName: string
  districtCode: string
}) {
  const [position, setPosition] = useState<LatLng | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      let pos = await geocodePlace(`${pincode}, ${districtName}, Tamil Nadu, India`)
      if (!pos && districtCode) pos = getDistrictGeo(districtCode)
      if (!cancelled) setPosition(pos)
    })()

    return () => {
      cancelled = true
    }
  }, [pincode, districtName, districtCode])

  const center = position ?? getDistrictGeo(districtCode) ?? TN_CENTER
  const markers: OsmMapMarker[] = position
    ? [
        {
          id: pincode,
          position,
          radius: 10,
          fillColor: '#2563eb',
          strokeColor: '#1e3a8a',
          strokeWeight: 2,
          opacity: 1,
          title: `Pincode ${pincode}`,
        },
      ]
    : []

  return (
    <div className="mb-4 bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-2">Pincode {pincode} on map</p>
      <OsmMap center={center} zoom={13} markers={markers} height="14rem" />
    </div>
  )
}
