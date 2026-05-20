import { api, getToken } from './client'
import type {
  ReportFormat,
  ReportHistoryList,
  ReportMeta,
  ReportRunResult,
} from '../types/report'

export function listReports(): Promise<ReportMeta[]> {
  return api<ReportMeta[]>('/api/reports')
}

export function runReport(
  slug: string,
  filters: Record<string, unknown>,
): Promise<ReportRunResult> {
  return api<ReportRunResult>(`/api/reports/${slug}/run`, {
    method: 'POST',
    body: JSON.stringify(filters),
  })
}

export function listReportHistory(): Promise<ReportHistoryList> {
  return api<ReportHistoryList>('/api/reports/history')
}

async function _downloadResponse(url: string, init: RequestInit, fallbackName: string): Promise<void> {
  const token = getToken()
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(url, { ...init, headers })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body?.detail ?? detail
    } catch {
      // not JSON
    }
    throw new Error(`Export failed (${res.status}): ${detail}`)
  }

  const blob = await res.blob()
  const filename =
    res.headers.get('content-disposition')?.match(/filename="?([^"]+)"?/)?.[1] ??
    fallbackName

  const blobUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(blobUrl)
}

export function exportReport(
  slug: string,
  filters: Record<string, unknown>,
  format: ReportFormat,
): Promise<void> {
  return _downloadResponse(
    `/api/reports/${slug}/export?format=${format}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters),
    },
    `${slug}.${format}`,
  )
}

export function downloadHistory(runId: number, slug: string, format: ReportFormat): Promise<void> {
  return _downloadResponse(
    `/api/reports/history/${runId}/download`,
    { method: 'GET' },
    `${slug}.${format}`,
  )
}
