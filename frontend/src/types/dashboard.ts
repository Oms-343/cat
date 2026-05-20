export interface RegionCount {
  code: string
  name: string
  company_count: number
}

export interface DistrictsOverview {
  total_companies: number
  total_districts_with_msmes: number
  items: RegionCount[]
}

export interface TalukDrilldown {
  district_code: string
  district_name: string
  total_companies: number
  items: RegionCount[]
}

export interface PincodeCount {
  pincode: string
  company_count: number
}

export interface TalukPincodeDrilldown {
  district_code: string
  district_name: string
  taluk_code: string
  taluk_name: string
  total_companies: number
  items: PincodeCount[]
}

export interface DashboardFilters {
  sector?: string
  turnover?: string
  tag?: string
}
