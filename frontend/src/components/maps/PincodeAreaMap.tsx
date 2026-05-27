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
    <div className="h-full min-h-[420px] border border-hairline rounded-lg p-4 flex flex-col">
      <p className="text-xs text-slate-500 mb-2">Pincode {pincode} on map</p>
      <div className="flex-1 min-h-0">
        <OsmMap center={center} zoom={13} markers={markers} height="min(480px, 60vh)" />
      </div>
    </div>
  )
}
