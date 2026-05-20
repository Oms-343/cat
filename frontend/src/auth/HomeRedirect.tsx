import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { homePathForRole } from './homePath'

export function HomeRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={homePathForRole(user.role)} replace />
}
