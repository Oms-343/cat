import { api } from './client'
import type {
  DashboardFilters,
  DistrictsOverview,
  TalukDrilldown,
  TalukPincodeDrilldown,
} from '../types/dashboard'

function toQuery(filters: DashboardFilters): string {
  const qs = new URLSearchParams()
  if (filters.sector) qs.set('sector', filters.sector)
  if (filters.turnover) qs.set('turnover', filters.turnover)
  if (filters.tag) qs.set('tag', filters.tag)
  return qs.toString() ? `?${qs.toString()}` : ''
}

export function getDistrictsOverview(filters: DashboardFilters = {}): Promise<DistrictsOverview> {
  return api<DistrictsOverview>(`/api/dashboard/districts${toQuery(filters)}`)
}

export function getDistrictTaluks(
  districtCode: string,
  filters: DashboardFilters = {},
): Promise<TalukDrilldown> {
  return api<TalukDrilldown>(
    `/api/dashboard/districts/${districtCode}/taluks${toQuery(filters)}`,
  )
}

export function getTalukPincodes(
  districtCode: string,
  talukCode: string,
  filters: DashboardFilters = {},
): Promise<TalukPincodeDrilldown> {
  return api<TalukPincodeDrilldown>(
    `/api/dashboard/districts/${districtCode}/taluks/${talukCode}/pincodes${toQuery(filters)}`,
  )
}
