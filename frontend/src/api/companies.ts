import { api } from './client'
import type {
  Company,
  CompanyCreate,
  CompanyFilters,
  CompanyListResponse,
  CompanyUpdate,
  LockedFields,
} from '../types/company'

export function listCompanies(filters: CompanyFilters = {}): Promise<CompanyListResponse> {
  const qs = new URLSearchParams()
  if (filters.q) qs.set('q', filters.q)
  if (filters.sector) qs.set('sector', filters.sector)
  if (filters.district) qs.set('district', filters.district)
  if (filters.pincode) qs.set('pincode', filters.pincode)
  if (filters.turnover) qs.set('turnover', filters.turnover)
  if (filters.tag) qs.set('tag', filters.tag)
  if (filters.limit !== undefined) qs.set('limit', String(filters.limit))
  if (filters.offset !== undefined) qs.set('offset', String(filters.offset))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return api<CompanyListResponse>(`/api/companies${suffix}`)
}

export function getMyCompany(): Promise<Company> {
  return api<Company>('/api/companies/mine')
}

export function getCompany(id: number): Promise<Company> {
  return api<Company>(`/api/companies/${id}`)
}

export function createCompany(payload: CompanyCreate): Promise<Company> {
  return api<Company>('/api/companies', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateCompany(id: number, payload: CompanyUpdate): Promise<Company> {
  return api<Company>(`/api/companies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteCompany(id: number): Promise<void> {
  return api<void>(`/api/companies/${id}`, { method: 'DELETE' })
}

export function getLockedFields(): Promise<LockedFields> {
  return api<LockedFields>('/api/companies/locked-fields')
}

export async function exportCompanies(
  filters: CompanyFilters & { ids?: number[] } = {},
): Promise<void> {
  const qs = new URLSearchParams()
  if (filters.q) qs.set('q', filters.q)
  if (filters.sector) qs.set('sector', filters.sector)
  if (filters.district) qs.set('district', filters.district)
  if (filters.pincode) qs.set('pincode', filters.pincode)
  if (filters.turnover) qs.set('turnover', filters.turnover)
  if (filters.tag) qs.set('tag', filters.tag)
  if (filters.ids?.length) qs.set('ids', filters.ids.join(','))

  const token = localStorage.getItem('msme.token')
  const res = await fetch(`/api/companies/export?${qs.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Export failed')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `companies-${Date.now()}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

export function bulkUpdateTags(companyIds: number[], addTags: string[], removeTags: string[]): Promise<void> {
  return api<void>('/api/companies/bulk/tags', {
    method: 'POST',
    body: JSON.stringify({ company_ids: companyIds, add_tags: addTags, remove_tags: removeTags }),
  })
}
