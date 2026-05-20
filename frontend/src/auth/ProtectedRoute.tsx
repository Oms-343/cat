import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import type { UserRole } from '../types/auth'

interface Props {
  children: ReactNode
  roles?: UserRole[]
}

export function ProtectedRoute({ children, roles }: Props) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex h-screen items-center justify-center text-red-600">
        You don't have permission to view this page.
      </div>
    )
  }

  return <>{children}</>
}
