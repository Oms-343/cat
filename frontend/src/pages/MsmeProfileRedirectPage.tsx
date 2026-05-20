import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMyCompany } from '../api/companies'
import { ApiError } from '../api/client'

export function MsmeProfileRedirectPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMyCompany()
      .then((company) => navigate(`/companies/${company.id}`, { replace: true }))
      .catch((err) => {
        if (err instanceof ApiError) setError(err.detail)
        else setError(String(err))
      })
  }, [navigate])

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-8 py-16 text-center">
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-4">{error}</p>
        <p className="mt-4 text-sm text-slate-600">
          No company profile is linked to your account.{' '}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Register via MSME sign up
          </Link>
        </p>
      </div>
    )
  }

  return <p className="p-8 text-sm text-slate-500">Loading your profile…</p>
}
