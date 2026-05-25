import type { UserRole } from '../types/auth'

/** Default post-login route for the TIDCO admin. */
export function homePathForRole(_role: UserRole): string {
  return '/dashboard'
}
