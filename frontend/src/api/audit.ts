import { api, getToken } from './client'
import type { AuditFilters, AuditLogList } from '../types/audit'

function toQuery(filters: AuditFilters): string {
  const qs = new URLSearchParams()
  if (filters.action) qs.set('action', filters.action)
  if (filters.resource_type) qs.set('resource_type', filters.resource_type)
  if (filters.user_email) qs.set('user_email', filters.user_email)
  if (filters.since) qs.set('since', filters.since)
  if (filters.until) qs.set('until', filters.until)
  if (filters.limit !== undefined) qs.set('limit', String(filters.limit))
  if (filters.offset !== undefined) qs.set('offset', String(filters.offset))
  return qs.toString() ? `?${qs.toString()}` : ''
}

export function listAudit(filters: AuditFilters = {}): Promise<AuditLogList> {
  return api<AuditLogList>(`/api/audit-log${toQuery(filters)}`)
}

/** Download Excel — uses fetch directly because we want the Blob, not JSON. */
export async function exportAuditExcel(filters: Omit<AuditFilters, 'limit' | 'offset'> = {}): Promise<void> {
  const token = getToken()
  const res = await fetch(`/api/audit-log/export${toQuery(filters)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Export failed (${res.status}): ${body}`)
  }
  const blob = await res.blob()
  const filename =
    res.headers.get('content-disposition')?.match(/filename="?([^"]+)"?/)?.[1] ??
    `audit-log-${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
