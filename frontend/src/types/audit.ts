export interface AuditLogEntry {
  id: number
  timestamp: string
  user_id: number | null
  user_email: string | null
  user_role: string | null
  user_name: string | null
  action: string
  resource_type: string | null
  resource_id: number | null
  resource_name: string | null
  details: Record<string, unknown>
}

export interface AuditLogList {
  items: AuditLogEntry[]
  total: number
  limit: number
  offset: number
}

export interface AuditFilters {
  action?: string
  resource_type?: string
  user_email?: string
  since?: string
  until?: string
  limit?: number
  offset?: number
}

export const ACTION_TYPES = [
  'USER_LOGIN',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DEACTIVATED',
  'USER_PASSWORD_RESET',
  'COMPANY_CREATED',
  'COMPANY_UPDATED',
  'COMPANY_TAGGED',
  'COMPANY_DELETED',
  'MASTER_ENTRY_CREATED',
  'MASTER_ENTRY_UPDATED',
  'MASTER_ENTRY_DELETED',
] as const

export const RESOURCE_TYPES = ['user', 'company', 'master'] as const
