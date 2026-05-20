import { api, setToken } from './client'
import type { LoginResponse, User } from '../types/auth'

export type LoginUserType = 'official' | 'msme'

export interface OtpSentResponse {
  message: string
  demo_otp: string
  expires_in_minutes: number
}

export function login(
  email: string,
  password: string,
  userType?: LoginUserType,
): Promise<LoginResponse> {
  return api<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, user_type: userType ?? null }),
  })
}

export function getMe(): Promise<User> {
  return api<User>('/api/auth/me')
}

export function signupRequestOtp(body: {
  email: string
  password: string
  full_name: string
  gst_number?: string
}): Promise<OtpSentResponse> {
  return api<OtpSentResponse>('/api/auth/signup/request-otp', {
    method: 'POST',
    body: JSON.stringify({ ...body, user_type: 'msme' }),
  })
}

export function signupVerify(email: string, otp: string): Promise<LoginResponse> {
  return api<LoginResponse>('/api/auth/signup/verify', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  })
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

export function govtLookup(gst?: string): Promise<Record<string, unknown>> {
  const qs = gst ? `?gst=${encodeURIComponent(gst)}` : ''
  return api<Record<string, unknown>>(`/api/auth/govt-lookup${qs}`)
}

export async function completeLogin(res: LoginResponse): Promise<User> {
  setToken(res.access_token)
  return res.user
}
