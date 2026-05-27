import { useEffect, useState } from 'react'
import { listPendingEditRequests, reviewEditRequest, type EditRequest } from '../api/editRequests'
import { ApiError } from '../api/client'

export function EditRequestsPanel() {
  const [items, setItems] = useState<EditRequest[]>([])
  const [error, setError] = useState<string | null>(null)

  function refresh() {
    listPendingEditRequests()
      .then(setItems)
      .catch((err) => setError(err instanceof ApiError ? err.detail : String(err)))
  }

  useEffect(() => {
    refresh()
  }, [])

  if (items.length === 0 && !error) return null

  return (
    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
      <h2 className="text-sm font-semibold text-amber-900 mb-2">Pending profile change requests</h2>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <ul className="space-y-2">
        {items.map((r) => (
          <li key={r.id} className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-3 text-sm flex flex-wrap gap-2 items-start justify-between">
            <div>
              <p className="font-medium text-slate-900">{r.company_name}</p>
              <p className="text-slate-500 text-xs">
                by {r.requested_by_name} · {Object.keys(r.proposed_changes).join(', ')}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-xs px-2 py-1 rounded bg-green-600 text-white"
                onClick={async () => {
                  await reviewEditRequest(r.id, true)
                  refresh()
                }}
              >
                Approve
              </button>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded border border-slate-300"
                onClick={async () => {
                  await reviewEditRequest(r.id, false, 'Rejected')
                  refresh()
                }}
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
