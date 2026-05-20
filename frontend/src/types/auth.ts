export type UserRole = 'super' | 'admin' | 'msme'

export interface User {
  id: number
  email: string
  full_name: string
  designation: string | null
  mobile: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  last_login_at: string | null
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface UserCreate {
  email: string
  full_name: string
  designation?: string | null
  mobile?: string | null
  role: UserRole
  password?: string | null
}

export interface UserCreateResponse {
  user: User
  welcome_message: string
}

export interface UserUpdate {
  full_name?: string
  designation?: string | null
  mobile?: string | null
  role?: UserRole
  is_active?: boolean
}

export interface PasswordResetResponse {
  user_id: number
  email: string
  temporary_password: string
}
