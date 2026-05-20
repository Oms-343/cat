import { api } from './client'
import type {
  PasswordResetResponse,
  User,
  UserCreate,
  UserCreateResponse,
  UserRole,
  UserUpdate,
} from '../types/auth'

export interface UserListFilters {
  q?: string
  role?: UserRole
  active?: boolean
}

export function listUsers(filters: UserListFilters = {}): Promise<User[]> {
  const qs = new URLSearchParams()
  if (filters.q) qs.set('q', filters.q)
  if (filters.role) qs.set('role', filters.role)
  if (filters.active !== undefined) qs.set('active', String(filters.active))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return api<User[]>(`/api/users${suffix}`)
}

export function createUser(payload: UserCreate): Promise<UserCreateResponse> {
  return api<UserCreateResponse>('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateUser(id: number, payload: UserUpdate): Promise<User> {
  return api<User>(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function resetPassword(id: number): Promise<PasswordResetResponse> {
  return api<PasswordResetResponse>(`/api/users/${id}/reset-password`, {
    method: 'POST',
  })
}

export function deactivateUser(id: number): Promise<User> {
  return api<User>(`/api/users/${id}/deactivate`, {
    method: 'POST',
  })
}
