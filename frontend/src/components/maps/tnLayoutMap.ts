/** Tamil Nadu taluk/pincode SVG layout (from reference mockup). */

export interface LayoutPincode {
  p: string
  n: string
  x: number
  y: number
  c: number
}

export interface LayoutTaluk {
  name: string
  d: string
  cx: number
  cy: number
  count: number
  fill: string
  pincodes: LayoutPincode[]
}

export interface LayoutData {
  viewBox: { width: number; height: number }
  districts: Record<string, LayoutTaluk[]>
}

export interface TalukIndexEntry {
  code: string
  name: string
}

export interface TalukIndexDistrict {
  name: string
  taluks: TalukIndexEntry[]
}

export interface TalukIndex {
  districts: Record<string, TalukIndexDistrict>
}

/** District code → layout JSON key (30 districts with taluk SVG paths). */
export const DISTRICT_CODE_TO_LAYOUT: Record<string, string> = {
  ARI: 'Ariyalur',
  CHN: 'Chennai',
  CBE: 'Coimbatore',
  CDL: 'Cuddalore',
  DHR: 'Dharmapuri',
  DDG: 'Dindigul',
  ERD: 'Erode',
  KAN: 'Kancheepuram',
  KNY: 'Kanniyakumari',
  KAR: 'Karur',
  MDU: 'Madurai',
  NAG: 'Nagapattinam',
  NMK: 'Namakkal',
  NLG: 'Nilgiris',
  PMB: 'Perambalur',
  PDK: 'Pudukkottai',
  RMD: 'Ramanathapuram',
  SLM: 'Salem',
  SVG: 'Sivaganga',
  TJV: 'Thanjavur',
  THI: 'Theni',
  TVR: 'Thiruvallur',
  TVA: 'Thiruvarur',
  THV: 'Thoothukudi',
  TRI: 'Tiruchchirappalli',
  TVL: 'Tirunelveli Kattabo',
  TVM: 'Tiruvannamalai',
  VLR: 'Vellore',
  VLP: 'Villupuram',
  VDN: 'Virudhunagar',
}

const LAYOUT_URL = '/tn-taluk-layout.json'
const INDEX_URL = '/tn-taluks-index.json'

let cachedLayout: LayoutData | null = null
let cachedLayoutPromise: Promise<LayoutData> | null = null
let cachedIndex: TalukIndex | null = null
let cachedIndexPromise: Promise<TalukIndex> | null = null

export async function loadLayoutData(): Promise<LayoutData> {
  if (cachedLayout) return cachedLayout
  if (cachedLayoutPromise) return cachedLayoutPromise
  cachedLayoutPromise = fetch(LAYOUT_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load map layout (HTTP ${r.status})`)
      return r.json() as Promise<LayoutData>
    })
    .then((data) => {
      cachedLayout = data
      return data
    })
    .catch((err) => {
      cachedLayoutPromise = null
      throw err
    })
  return cachedLayoutPromise
}

export async function loadTalukIndex(): Promise<TalukIndex> {
  if (cachedIndex) return cachedIndex
  if (cachedIndexPromise) return cachedIndexPromise
  cachedIndexPromise = fetch(INDEX_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load taluk index (HTTP ${r.status})`)
      return r.json() as Promise<TalukIndex>
    })
    .then((data) => {
      cachedIndex = data
      return data
    })
    .catch((err) => {
      cachedIndexPromise = null
      throw err
    })
  return cachedIndexPromise
}

export function getLayoutDistrictKey(districtCode: string): string | null {
  return DISTRICT_CODE_TO_LAYOUT[districtCode] ?? null
}

export function normalizeTalukName(name: string): string {
  return name.toLowerCase().replace(/\btaluk\b/g, '').replace(/[^a-z0-9]/g, '')
}

/** Match a layout taluk label to an official taluk code. */
export function matchTalukCode(
  districtCode: string,
  layoutName: string,
  index: TalukIndex,
  apiTaluks?: Array<{ code: string; name: string }>,
): string | null {
  const candidates = [
    ...(apiTaluks ?? []),
    ...(index.districts[districtCode]?.taluks ?? []),
  ]
  if (candidates.length === 0) return null

  const norm = normalizeTalukName(layoutName)

  const exact = candidates.find((t) => normalizeTalukName(t.name) === norm)
  if (exact) return exact.code

  const partial = candidates.find((t) => {
    const n = normalizeTalukName(t.name)
    return norm.includes(n) || n.includes(norm)
  })
  if (partial) return partial.code

  const layoutWords = layoutName.toLowerCase().split(/\s+/).filter(Boolean)
  let best: { code: string; score: number } | null = null
  for (const t of candidates) {
    const words = t.name.toLowerCase().split(/\s+/).filter(Boolean)
    const score = layoutWords.filter((w) =>
      words.some((tw) => tw.includes(w) || w.includes(tw)),
    ).length
    if (score > 0 && (!best || score > best.score)) {
      best = { code: t.code, score }
    }
  }
  return best?.code ?? null
}

/** Stable taluk code for URL navigation — uses official code when known, else a layout-derived slug. */
export function resolveTalukCode(
  districtCode: string,
  layoutName: string,
  index: TalukIndex,
  apiTaluks?: Array<{ code: string; name: string }>,
): string {
  return (
    matchTalukCode(districtCode, layoutName, index, apiTaluks) ??
    `${districtCode}_${normalizeTalukName(layoutName).slice(0, 24).toUpperCase()}`
  )
}

/** Resolve layout taluk from URL taluk code. */
export function findLayoutTaluk(
  layoutTaluks: LayoutTaluk[],
  talukCode: string,
  index: TalukIndex,
  districtCode: string,
): LayoutTaluk | null {
  const indexName = index.districts[districtCode]?.taluks.find((t) => t.code === talukCode)?.name
  if (indexName) {
    const byName = layoutTaluks.find((t) => {
      const norm = normalizeTalukName(indexName)
      const ln = normalizeTalukName(t.name)
      return ln === norm || ln.includes(norm) || norm.includes(ln)
    })
    if (byName) return byName
  }

  const byMatch = layoutTaluks.find(
    (t) => resolveTalukCode(districtCode, t.name, index) === talukCode,
  )
  if (byMatch) return byMatch

  if (talukCode.startsWith(`${districtCode}_`)) {
    const slug = talukCode.slice(districtCode.length + 1).toLowerCase()
    return (
      layoutTaluks.find((t) => normalizeTalukName(t.name).startsWith(slug)) ??
      layoutTaluks.find((t) => slug.startsWith(normalizeTalukName(t.name).slice(0, slug.length))) ??
      null
    )
  }

  return null
}

export function fillColorByCount(count: number): string {
  if (count >= 1000) return '#dc2626'
  if (count >= 500) return '#fbcfe8'
  if (count >= 100) return '#22c55e'
  return '#fde047'
}

export function pincodeRadius(count: number): number {
  return Math.max(8, Math.min(22, 6 + Math.sqrt(count) * 0.7))
}
