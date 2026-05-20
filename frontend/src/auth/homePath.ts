import type { UserRole } from '../types/auth'

/** Default post-login route per walkthrough: officials → dashboard, MSME → profile. */
export function homePathForRole(role: UserRole): string {
  return role === 'msme' ? '/my-profile' : '/dashboard'
}
