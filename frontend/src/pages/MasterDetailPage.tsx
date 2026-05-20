import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  createEntry,
  deleteEntry,
  exportMaster,
  importMaster,
  listEntries,
  listMasters,
  updateEntry,
} from '../api/masters'
import { ApiError } from '../api/client'
import { Modal } from '../components/Modal'
import type { MasterEntry, MasterSummary } from '../types/master'

interface FormState {
  code: string
  name: string
  description: string
  is_active: boolean
  sort_order: number
}

const emptyForm: FormState = {
  code: '',
  name: '',
  description: '',
  is_active: true,
  sort_order: 0,
}

export function MasterDetailPage() {
  const { key = '' } = useParams<{ key: string }>()

  const [summary, setSummary] = useState<MasterSummary | null>(null)
  const [entries, setEntries] = useState<MasterEntry[] | null>(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function refresh() {
    setLoading(true)
    Promise.all([listMasters(), listEntries(key, { q: search || undefined })])
      .then(([all, rows]) => {
        setSummary(all.find((m) => m.key === key) ?? null)
        setEntries(rows)
        setError(null)
      })
      .catch((err) => {
        if (err instanceof ApiError) setError(`${err.status}: ${err.detail}`)
        else setError(String(err))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
    setModalOpen(true)
  }

  function openEdit(entry: MasterEntry) {
    setEditingId(entry.id)
    setForm({
      code: entry.code,
      name: entry.name,
      description: entry.description ?? '',
      is_active: entry.is_active,
      sort_order: entry.sort_order,
    })
    setFormError(null)
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      is_active: form.is_active,
      sort_order: form.sort_order,
    }
    try {
      if (editingId === null) await createEntry(key, payload)
      else await updateEntry(key, editingId, payload)
      setModalOpen(false)
      refresh()
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.detail)
      else setFormError(String(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(entry: MasterEntry) {
    if (!confirm(`Delete "${entry.name}" (${entry.code})?`)) return
    try {
      await deleteEntry(key, entry.id)
      refresh()
    } catch (err) {
      if (err instanceof ApiError) alert(err.detail)
      else alert(String(err))
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <div className="mb-6">
        <Link to="/masters" className="text-sm text-blue-600 hover:underline">
          ← All masters
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">
          {summary?.label ?? key}
        </h1>
        {summary && <p className="text-sm text-slate-500">{summary.description}</p>}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input
          type="search"
          placeholder="Search by code or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') refresh()
          }}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={refresh}
          className="text-sm border border-slate-300 px-3 py-2 rounded-md hover:bg-slate-100"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => exportMaster(key)}
          className="text-sm border border-slate-300 px-3 py-2 rounded-md hover:bg-slate-100"
        >
          Export
        </button>
        <label className="text-sm border border-slate-300 px-3 py-2 rounded-md hover:bg-slate-100 cursor-pointer">
          Import
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              try {
                const r = await importMaster(key, f)
                alert(`Import: ${r.created} created, ${r.updated} updated`)
                refresh()
              } catch (err) {
                alert(err instanceof Error ? err.message : String(err))
              }
              e.target.value = ''
            }}
          />
        </label>
        <button
          onClick={openAdd}
          className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md"
        >
          + Add Entry
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading && <p className="p-6 text-sm text-slate-500">Loading…</p>}

        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-50 border-b border-red-200">
            {error}
          </div>
        )}

        {entries && entries.length === 0 && !loading && (
          <p className="p-6 text-sm text-slate-500 text-center">
            No entries yet. Click <strong>+ Add Entry</strong> to create one.
          </p>
        )}

        {entries && entries.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-2 px-4">Code</th>
                <th className="py-2 px-4">Name</th>
                <th className="py-2 px-4">Description</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Sort</th>
                <th className="py-2 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-2 px-4 font-mono text-xs text-slate-700">{entry.code}</td>
                  <td className="py-2 px-4 font-medium text-slate-900">{entry.name}</td>
                  <td className="py-2 px-4 text-slate-500">{entry.description || '—'}</td>
                  <td className="py-2 px-4">
                    {entry.is_active ? (
                      <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-slate-500">{entry.sort_order}</td>
                  <td className="py-2 px-4 text-right space-x-2">
                    <button
                      onClick={() => openEdit(entry)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editingId === null ? 'Add Entry' : 'Edit Entry'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="text-sm border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="master-form"
              disabled={saving}
              className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium px-4 py-1.5 rounded-md"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="master-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Code *</label>
            <input
              type="text"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. ROBOTIX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Industrial Robotics"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Active
            </label>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-700">Sort order:</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="w-20 px-2 py-1 border border-slate-300 rounded-md text-sm"
              />
            </div>
          </div>

          {formError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
              {formError}
            </div>
          )}
        </form>
      </Modal>
    </div>
  )
}
