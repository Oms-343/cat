import type { LatLng } from './tamilNaduGeo'

const cache = new Map<string, LatLng>()
let chain: Promise<unknown> = Promise.resolve()
let lastRequestAt = 0

/** Nominatim policy: max 1 request per second. */
const MIN_INTERVAL_MS = 1100

const NOMINATIM_USER_AGENT = 'MSME-Geographic-Dashboard/1.0 (internal; no bulk)'

function schedule<T>(fn: () => Promise<T>): Promise<T> {
  const job = chain.then(async () => {
    const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastRequestAt))
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    lastRequestAt = Date.now()
    return fn()
  })
  chain = job.then(
    () => undefined,
    () => undefined,
  )
  return job
}

/** Free geocoding via OpenStreetMap Nominatim (no API key). */
export async function geocodePlace(query: string): Promise<LatLng | null> {
  const key = query.trim().toLowerCase()
  if (!key) return null
  const hit = cache.get(key)
  if (hit) return hit

  return schedule(async () => {
    const cached = cache.get(key)
    if (cached) return cached

    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', query)
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '1')
    url.searchParams.set('countrycodes', 'in')

    try {
      const res = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
          'User-Agent': NOMINATIM_USER_AGENT,
        },
      })
      if (!res.ok) return null
      const data = (await res.json()) as { lat: string; lon: string }[]
      const first = data[0]
      if (!first) return null
      const pos: LatLng = { lat: Number.parseFloat(first.lat), lng: Number.parseFloat(first.lon) }
      if (!Number.isFinite(pos.lat) || !Number.isFinite(pos.lng)) return null
      cache.set(key, pos)
      return pos
    } catch {
      return null
    }
  })
}
