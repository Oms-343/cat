import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { bulkUpdateTags, exportCompanies, listCompanies } from '../api/companies'
import { listEntries } from '../api/masters'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { CompanyListResponse } from '../types/company'
import type { MasterEntry } from '../types/master'

interface MasterMap {
  districts: MasterEntry[]
  sectors: MasterEntry[]
  turnoverRanges: MasterEntry[]
}

const PAGE_SIZE = 20

export function CompaniesListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [data, setData] = useState<CompanyListResponse | null>(null)
  const [masters, setMasters] = useState<MasterMap | null>(null)

  const [q, setQ] = useState('')
  const [sector, setSector] = useState('')
  const [district, setDistrict] = useState('')
  const [turnover, setTurnover] = useState('')
  const [tag, setTag] = useState('')
  const [offset, setOffset] = useState(0)

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [exporting, setExporting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load master dropdowns once
  useEffect(() => {
    Promise.all([
      listEntries('districts', { active: true }),
      listEntries('sectors', { active: true }),
      listEntries('turnover-ranges', { active: true }),
    ])
      .then(([districts, sectors, turnoverRanges]) =>
        setMasters({ districts, sectors, turnoverRanges }),
      )
      .catch((err) => {
        if (err instanceof ApiError) setError(`Masters load: ${err.detail}`)
        else setError(String(err))
      })
  }, [])

  // Re-fetch when filters or pagination change
  useEffect(() => {
    setLoading(true)
    listCompanies({
      q: q || undefined,
      sector: sector || undefined,
      district: district || undefined,
      turnover: turnover || undefined,
      tag: tag || undefined,
      limit: PAGE_SIZE,
      offset,
    })
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiError) setError(`${err.status}: ${err.detail}`)
        else setError(String(err))
      })
      .finally(() => setLoading(false))
  }, [q, sector, district, turnover, tag, offset])

  function clearFilters() {
    setQ('')
    setSector('')
    setDistrict('')
    setTurnover('')
    setTag('')
    setOffset(0)
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  const canAdd = user && (user.role === 'super' || user.role === 'admin')
  const canBulk = canAdd

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllOnPage() {
    if (!data) return
    const ids = data.items.map((c) => c.id)
    const allSelected = ids.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  async function handleExport() {
    setExporting(true)
    try {
      await exportCompanies({
        q: q || undefined,
        sector: sector || undefined,
        district: district || undefined,
        turnover: turnover || undefined,
        tag: tag || undefined,
        ids: selected.size > 0 ? [...selected] : undefined,
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setExporting(false)
    }
  }

  async function handleBulkTag(tagName: string) {
    if (!canBulk || selected.size === 0) return
    try {
      await bulkUpdateTags([...selected], [tagName], [])
      setSelected(new Set())
      setOffset(0)
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : String(err))
    }
  }

  function completionColor(pct: number): string {
    if (pct >= 90) return 'bg-green-100 text-green-800 border-green-200'
    if (pct >= 70) return 'bg-amber-100 text-amber-800 border-amber-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Companies</h1>
          <p className="text-sm text-slate-500">
            {data ? `${data.total.toLocaleString()} MSMEs registered` : 'Loading…'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="text-sm border border-slate-300 px-4 py-2 rounded-md hover:bg-slate-100 disabled:opacity-50"
          >
            {exporting ? 'Exporting…' : selected.size ? `Export ${selected.size} selected` : 'Export Excel'}
          </button>
          {canAdd && (
            <button
              onClick={() => navigate('/companies/new')}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md"
            >
              + Add MSME
            </button>
          )}
        </div>
      </header>

      {canBulk && selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <span>{selected.size} selected</span>
          {['Defence', 'Forging', 'Export'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleBulkTag(t)}
              className="text-xs px-2 py-1 rounded border bg-white hover:bg-slate-50"
            >
              + Tag {t}
            </button>
          ))}
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-xs underline">
            Clear
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setOffset(0)
              setQ(e.target.value)
            }}
            placeholder="Search name, GST, CIN, Udyam…"
            className="lg:col-span-2 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={district}
            onChange={(e) => {
              setOffset(0)
              setDistrict(e.target.value)
            }}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
          >
            <option value="">All districts</option>
            {masters?.districts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={sector}
            onChange={(e) => {
              setOffset(0)
              setSector(e.target.value)
            }}
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
            onChange={(e) => {
              setOffset(0)
              setTurnover(e.target.value)
            }}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
          >
            <option value="">All turnover</option>
            {masters?.turnoverRanges.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-slate-500">Tag:</span>
          {['Defence', 'Aerospace', 'EV', 'Forging', 'Export'].map((t) => (
            <button
              key={t}
              onClick={() => {
                setOffset(0)
                setTag(tag === t ? '' : t)
              }}
              className={`text-xs px-2 py-1 rounded border ${
                tag === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {t}
            </button>
          ))}
          {(q || sector || district || turnover || tag) && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-slate-600 hover:text-slate-900 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-50 border-b border-red-200">{error}</div>
        )}

        {loading && <p className="p-6 text-sm text-slate-500">Loading…</p>}

        {!loading && data && data.items.length === 0 && (
          <p className="p-6 text-sm text-slate-500 text-center">
            No companies match these filters.
          </p>
        )}

        {!loading && data && data.items.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
              <tr>
                {canBulk && (
                  <th className="py-2 px-2 w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all on page"
                      checked={
                        data.items.length > 0 && data.items.every((c) => selected.has(c.id))
                      }
                      onChange={toggleAllOnPage}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </th>
                )}
                <th className="py-2 px-4">Name</th>
                <th className="py-2 px-4">GST</th>
                <th className="py-2 px-4">Sector</th>
                <th className="py-2 px-4">District</th>
                <th className="py-2 px-4">Turnover</th>
                <th className="py-2 px-4">Tags</th>
                <th className="py-2 px-4">Completion</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                  onClick={() => navigate(`/companies/${c.id}`)}
                >
                  {canBulk && (
                    <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggleOne(c.id)}
                      />
                    </td>
                  )}
                  <td className="py-2 px-4">
                    <Link
                      to={`/companies/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-slate-900 hover:text-blue-700"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="py-2 px-4 font-mono text-xs text-slate-600">
                    {c.gst_number ?? '—'}
                  </td>
                  <td className="py-2 px-4 text-slate-600">
                    {masters?.sectors.find((s) => s.code === c.sector_code)?.name ?? c.sector_code ?? '—'}
                  </td>
                  <td className="py-2 px-4 text-slate-600">
                    {masters?.districts.find((d) => d.code === c.district_code)?.name ?? c.district_code ?? '—'}
                  </td>
                  <td className="py-2 px-4 text-slate-600">
                    {masters?.turnoverRanges.find((t) => t.code === c.turnover_range_code)?.name ?? c.turnover_range_code ?? '—'}
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.length === 0 && <span className="text-slate-400 text-xs">—</span>}
                      {c.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-200"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded border ${completionColor(
                        c.profile_completion,
                      )}`}
                    >
                      {c.profile_completion}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && data && data.total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-sm">
            <p className="text-slate-500">
              Page {currentPage} of {totalPages} · {data.total.toLocaleString()} total
            </p>
            <div className="flex gap-2">
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                className="px-3 py-1.5 border border-slate-300 rounded-md disabled:opacity-50 hover:bg-slate-100"
              >
                ← Prev
              </button>
              <button
                disabled={offset + PAGE_SIZE >= data.total}
                onClick={() => setOffset(offset + PAGE_SIZE)}
                className="px-3 py-1.5 border border-slate-300 rounded-md disabled:opacity-50 hover:bg-slate-100"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
