export interface MasterSummary {
  key: string
  label: string
  description: string
  count: number
  active_count: number
}

export interface MasterEntry {
  id: number
  code: string
  name: string
  description: string | null
  is_active: boolean
  sort_order: number
  district_code?: string | null
  taluk_code?: string | null
  created_at: string
  updated_at: string
}

export interface MasterCreate {
  code: string
  name: string
  description?: string | null
  is_active?: boolean
  sort_order?: number
}

export interface MasterUpdate {
  code?: string
  name?: string
  description?: string | null
  is_active?: boolean
  sort_order?: number
}
