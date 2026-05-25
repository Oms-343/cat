import { api, setToken } from './client'
import type { LoginResponse, User } from '../types/auth'

export interface OtpSentResponse {
  message: string
  demo_otp: string
  expires_in_minutes: number
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return api<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function getMe(): Promise<User> {
  return api<User>('/api/auth/me')
}

export function forgotPasswordRequest(email: string): Promise<OtpSentResponse> {
  return api<OtpSentResponse>('/api/auth/forgot-password/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function forgotPasswordReset(
  email: string,
  otp: string,
  new_password: string,
): Promise<{ message: string }> {
  return api<{ message: string }>('/api/auth/forgot-password/reset', {
    method: 'POST',
    body: JSON.stringify({ email, otp, new_password }),
  })
}

export async function completeLogin(res: LoginResponse): Promise<User> {
  setToken(res.access_token)
  return res.user
}
