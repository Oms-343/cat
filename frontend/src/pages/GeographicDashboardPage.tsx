import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  getDistrictsOverview,
  getDistrictTaluks,
  getTalukPincodes,
} from '../api/dashboard'
import { listCompanies } from '../api/companies'
import { listEntries } from '../api/masters'
import { ApiError } from '../api/client'
import type { DistrictsOverview, TalukDrilldown, TalukPincodeDrilldown } from '../types/dashboard'
import type { CompanyListItem } from '../types/company'
import type { MasterEntry } from '../types/master'

const SUGGESTED_TAGS = ['Defence', 'Aerospace', 'EV', 'Forging', 'Export']

function densityClass(count: number, max: number): string {
  if (count === 0) return 'bg-slate-50 text-slate-400 border-slate-200'
  if (max === 0) return 'bg-slate-50 text-slate-400 border-slate-200'
  const ratio = count / max
  if (ratio > 0.66) return 'bg-blue-600 text-white border-blue-700'
  if (ratio > 0.33) return 'bg-blue-300 text-blue-900 border-blue-400'
  return 'bg-amber-100 text-amber-800 border-amber-200'
}

type DrillItem = { code: string; name: string; count: number; subtitle?: string }

export function GeographicDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const district = searchParams.get('district') ?? ''
  const taluk = searchParams.get('taluk') ?? ''
  const pincode = searchParams.get('pincode') ?? ''
  const sector = searchParams.get('sector') ?? ''
  const turnover = searchParams.get('turnover') ?? ''
  const tag = searchParams.get('tag') ?? ''

  const filters = useMemo(
    () => ({
      sector: sector || undefined,
      turnover: turnover || undefined,
      tag: tag || undefined,
    }),
    [sector, turnover, tag],
  )

  const [masters, setMasters] = useState<{
    districts: MasterEntry[]
    sectors: MasterEntry[]
    turnoverRanges: MasterEntry[]
  } | null>(null)

  const [overview, setOverview] = useState<DistrictsOverview | null>(null)
  const [taluks, setTaluks] = useState<TalukDrilldown | null>(null)
  const [pincodes, setPincodes] = useState<TalukPincodeDrilldown | null>(null)
  const [companies, setCompanies] = useState<CompanyListItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      listEntries('districts', { active: true }),
      listEntries('sectors', { active: true }),
      listEntries('turnover-ranges', { active: true }),
    ])
      .then(([districts, sectors, turnoverRanges]) =>
        setMasters({ districts, sectors, turnoverRanges }),
      )
      .catch((err) => setError(err instanceof ApiError ? err.detail : String(err)))
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    if (district && taluk && pincode) {
      listCompanies({ district, pincode, ...filters, limit: 200 })
        .then((res) => setCompanies(res.items))
        .catch((err) => setError(err instanceof ApiError ? err.detail : String(err)))
        .finally(() => setLoading(false))
      setOverview(null)
      setTaluks(null)
      setPincodes(null)
    } else if (district && taluk) {
      getTalukPincodes(district, taluk, filters)
        .then(setPincodes)
        .catch((err) => setError(err instanceof ApiError ? err.detail : String(err)))
        .finally(() => setLoading(false))
      setOverview(null)
      setTaluks(null)
      setCompanies(null)
    } else if (district) {
      getDistrictTaluks(district, filters)
        .then(setTaluks)
        .catch((err) => setError(err instanceof ApiError ? err.detail : String(err)))
        .finally(() => setLoading(false))
      setOverview(null)
      setPincodes(null)
      setCompanies(null)
    } else {
      getDistrictsOverview(filters)
        .then(setOverview)
        .catch((err) => setError(err instanceof ApiError ? err.detail : String(err)))
        .finally(() => setLoading(false))
      setTaluks(null)
      setPincodes(null)
      setCompanies(null)
    }
  }, [district, taluk, pincode, filters])

  function updateParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams)
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    }
    setSearchParams(next)
  }

  const districtName =
    pincodes?.district_name ??
    taluks?.district_name ??
    masters?.districts.find((d) => d.code === district)?.name ??
    district

  const talukName = pincodes?.taluk_name ?? taluk

  let level: 'state' | 'district' | 'taluk' | 'pincode' = 'state'
  if (district && taluk && pincode) level = 'pincode'
  else if (district && taluk) level = 'taluk'
  else if (district) level = 'district'

  const listItems: DrillItem[] = useMemo(() => {
    if (level === 'state' && overview) {
      return overview.items.map((d) => ({
        code: d.code,
        name: d.name,
        count: d.company_count,
        subtitle: d.code,
      }))
    }
    if (level === 'district' && taluks) {
      return taluks.items.map((t) => ({
        code: t.code,
        name: t.name,
        count: t.company_count,
      }))
    }
    if (level === 'taluk' && pincodes) {
      return pincodes.items.map((p) => ({
        code: p.pincode,
        name: p.pincode,
        count: p.company_count,
        subtitle: 'pincode',
      }))
    }
    return []
  }, [level, overview, taluks, pincodes])

  const maxCount = Math.max(0, ...listItems.map((i) => i.count))

  function onSelectItem(item: DrillItem) {
    if (level === 'state') updateParams({ district: item.code, taluk: null, pincode: null })
    else if (level === 'district') updateParams({ taluk: item.code, pincode: null })
    else if (level === 'taluk') updateParams({ pincode: item.code })
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <nav className="mb-4 text-sm text-slate-600 flex flex-wrap items-center gap-1">
        <Crumb active={level === 'state'} onClick={() => updateParams({ district: null, taluk: null, pincode: null })}>
          Tamil Nadu
        </Crumb>
        {district && (
          <>
            <span className="text-slate-400">›</span>
            <Crumb
              active={level === 'district'}
              onClick={() => updateParams({ taluk: null, pincode: null })}
            >
              {districtName}
            </Crumb>
          </>
        )}
        {taluk && (
          <>
            <span className="text-slate-400">›</span>
            <Crumb active={level === 'taluk'} onClick={() => updateParams({ pincode: null })}>
              {talukName}
            </Crumb>
          </>
        )}
        {pincode && (
          <>
            <span className="text-slate-400">›</span>
            <span className="font-semibold text-slate-900">{pincode}</span>
          </>
        )}
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Geographic Dashboard</h1>
        <p className="text-sm text-slate-500">
          {level === 'state' && 'All districts — click to drill into taluks and pincodes.'}
          {level === 'district' && `Taluks in ${districtName}.`}
          {level === 'taluk' && `Pincodes in ${talukName}.`}
          {level === 'pincode' && `Companies in pincode ${pincode}.`}
        </p>
      </header>

      <FiltersPanel
        sector={sector}
        turnover={turnover}
        tag={tag}
        masters={masters}
        onUpdate={updateParams}
      />

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          {error}
        </div>
      )}

      {level === 'pincode' && companies && !loading && (
        <CompaniesTable companies={companies} masters={masters} onOpen={(id) => navigate(`/companies/${id}`)} />
      )}

      {level !== 'pincode' && !loading && listItems.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[420px]">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden lg:col-span-1">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Regions
            </div>
            <ul className="max-h-[480px] overflow-y-auto divide-y divide-slate-100">
              {listItems.map((item) => (
                <li key={item.code}>
                  <button
                    type="button"
                    disabled={item.count === 0 && level === 'state'}
                    onClick={() => onSelectItem(item)}
                    onMouseEnter={() => setHovered(item.code)}
                    onMouseLeave={() => setHovered(null)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-blue-50 disabled:opacity-50 ${
                      hovered === item.code ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        item.count >= 100 ? 'bg-green-500' : item.count > 0 ? 'bg-amber-400' : 'bg-slate-300'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate">{item.name}</p>
                      {item.subtitle && (
                        <p className="text-[10px] text-slate-400 font-mono">{item.subtitle}</p>
                      )}
                    </div>
                    <span className="font-bold tabular-nums text-slate-700">{item.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-3">Density map (click a region)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {listItems.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  disabled={item.count === 0 && level === 'state'}
                  title={`${item.name}: ${item.count} MSMEs`}
                  onClick={() => onSelectItem(item)}
                  onMouseEnter={() => setHovered(item.code)}
                  onMouseLeave={() => setHovered(null)}
                  className={`rounded-lg border p-3 text-left transition min-h-[72px] ${densityClass(
                    item.count,
                    maxCount,
                  )} ${hovered === item.code ? 'ring-2 ring-blue-400 scale-[1.02]' : ''} disabled:cursor-not-allowed`}
                >
                  <p className="text-xs font-semibold truncate leading-tight">{item.name}</p>
                  <p className="text-lg font-bold mt-1 tabular-nums">{item.count}</p>
                </button>
              ))}
            </div>
            {hovered && (
              <p className="mt-3 text-sm text-slate-600">
                {listItems.find((i) => i.code === hovered)?.name}:{' '}
                <strong>{listItems.find((i) => i.code === hovered)?.count}</strong> MSMEs
              </p>
            )}
          </div>
        </div>
      )}

      {overview && level === 'state' && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <Stat label="Total MSMEs" value={overview.total_companies.toLocaleString()} />
          <Stat label="Districts active" value={`${overview.total_districts_with_msmes} of 38`} />
        </div>
      )}
    </div>
  )
}

function Crumb({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? 'font-semibold text-slate-900' : 'hover:text-blue-700 hover:underline'}
    >
      {children}
    </button>
  )
}

function FiltersPanel({
  sector,
  turnover,
  tag,
  masters,
  onUpdate,
}: {
  sector: string
  turnover: string
  tag: string
  masters: { districts: MasterEntry[]; sectors: MasterEntry[]; turnoverRanges: MasterEntry[] } | null
  onUpdate: (u: Record<string, string | null>) => void
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <select
          value={sector}
          onChange={(e) => onUpdate({ sector: e.target.value || null })}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
        >
          <option value="">All sectors</option>
          {masters?.sectors.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={turnover}
          onChange={(e) => onUpdate({ turnover: e.target.value || null })}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
        >
          <option value="">All turnover ranges</option>
          {masters?.turnoverRanges.map((t) => (
            <option key={t.code} value={t.code}>
              {t.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">Tag:</span>
          {SUGGESTED_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onUpdate({ tag: tag === t ? null : t })}
              className={`text-xs px-2 py-1 rounded border ${
                tag === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function CompaniesTable({
  companies,
  masters,
  onOpen,
}: {
  companies: CompanyListItem[]
  masters: { sectors: MasterEntry[]; turnoverRanges: MasterEntry[] } | null
  onOpen: (id: number) => void
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-slate-500 bg-slate-50 border-b">
          <tr>
            <th className="py-2 px-4">Name</th>
            <th className="py-2 px-4">Sector</th>
            <th className="py-2 px-4">Turnover</th>
            <th className="py-2 px-4">Completion</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr
              key={c.id}
              className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
              onClick={() => onOpen(c.id)}
            >
              <td className="py-2 px-4 font-medium">{c.name}</td>
              <td className="py-2 px-4">
                {masters?.sectors.find((s) => s.code === c.sector_code)?.name ?? c.sector_code ?? '—'}
              </td>
              <td className="py-2 px-4">
                {masters?.turnoverRanges.find((t) => t.code === c.turnover_range_code)?.name ?? '—'}
              </td>
              <td className="py-2 px-4">{c.profile_completion}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  )
}
