import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { bulkUpdateTags, exportCompanies, listCompanies } from '../api/companies'
import { listEntries } from '../api/masters'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { CompanyListResponse } from '../types/company'
import type { MasterEntry } from '../types/master'
import { SUGGESTED_COMPANY_TAGS } from '../constants/companyTags'
import { Alert, Badge, Button, Card, Input, PageHeader, PageShell, Select } from '../components/ui'
import { cn } from '../utils/cn'

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

  const canAdd = user?.role === 'admin'
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
    <PageShell>
      <PageHeader
        title="All Companies"
        description={data ? `${data.total.toLocaleString()} MSMEs registered` : 'Loading…'}
        actions={
          <>
            <Button
              type="button"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? 'Exporting…' : selected.size ? `Export ${selected.size} selected` : 'Export Excel'}
            </Button>
            {canAdd && (
              <Button size="sm" onClick={() => navigate('/companies/new')}>
                Add MSME
              </Button>
            )}
          </>
        }
      />

      {canBulk && selected.size > 0 && (
        <Alert variant="info" className="mb-4 flex flex-wrap items-center gap-2">
          <span>{selected.size} selected</span>
          {SUGGESTED_COMPANY_TAGS.map((t) => (
            <Button
              key={t}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleBulkTag(t)}
              className="!h-7 !px-2 !text-xs"
            >
              Tag {t}
            </Button>
          ))}
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-ink underline"
          >
            Clear
          </button>
        </Alert>
      )}

      <Card padding="sm" className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input
            type="search"
            value={q}
            onChange={(e) => {
              setOffset(0)
              setQ(e.target.value)
            }}
            placeholder="Search name, GST, CIN, Udyam…"
            className="lg:col-span-2"
          />
          <Select
            value={district}
            onChange={(e) => {
              setOffset(0)
              setDistrict(e.target.value)
            }}
          >
            <option value="">All districts</option>
            {masters?.districts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select
            value={sector}
            onChange={(e) => {
              setOffset(0)
              setSector(e.target.value)
            }}
          >
            <option value="">All sectors</option>
            {masters?.sectors.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select
            value={turnover}
            onChange={(e) => {
              setOffset(0)
              setTurnover(e.target.value)
            }}
          >
            <option value="">All turnover</option>
            {masters?.turnoverRanges.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-xs text-muted">Tag:</span>
          {SUGGESTED_COMPANY_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setOffset(0)
                setTag(tag === t ? '' : t)
              }}
              className={cn(
                'text-xs px-2.5 py-1 rounded-md border font-medium transition-colors',
                tag === t
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-transparent text-body border-hairline hover:bg-surface-card',
              )}
            >
              {t}
            </button>
          ))}
          {(q || sector || district || turnover || tag) && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-xs text-muted hover:text-ink underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      <Card variant="elevated" padding="none" className="overflow-hidden">
        {error && <Alert variant="error" className="rounded-none border-0 border-b">{error}</Alert>}

        {loading && <p className="p-6 text-sm text-muted">Loading…</p>}

        {!loading && data && data.items.length === 0 && (
          <p className="p-6 text-sm text-muted text-center">No companies match these filters.</p>
        )}

        {!loading && data && data.items.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted bg-surface-soft border-b border-hairline">
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
                  className="border-b border-hairline-soft last:border-0 hover:bg-surface-soft cursor-pointer"
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
                      className="font-medium text-ink hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="py-2 px-4 font-mono text-xs text-muted">
                    {c.gst_number ?? '—'}
                  </td>
                  <td className="py-2 px-4 text-body">
                    {masters?.sectors.find((s) => s.code === c.sector_code)?.name ?? c.sector_code ?? '—'}
                  </td>
                  <td className="py-2 px-4 text-body">
                    {masters?.districts.find((d) => d.code === c.district_code)?.name ?? c.district_code ?? '—'}
                  </td>
                  <td className="py-2 px-4 text-body">
                    {masters?.turnoverRanges.find((t) => t.code === c.turnover_range_code)?.name ?? c.turnover_range_code ?? '—'}
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.length === 0 && <span className="text-muted-soft text-xs">—</span>}
                      {c.tags.map((t) => (
                        <Badge key={t} className="normal-case tracking-normal">
                          {t}
                        </Badge>
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-hairline text-sm">
            <p className="text-muted">
              Page {currentPage} of {totalPages} · {data.total.toLocaleString()} total
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              >
                Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={offset + PAGE_SIZE >= data.total}
                onClick={() => setOffset(offset + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </PageShell>
  )
}
