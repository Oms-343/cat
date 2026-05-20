import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  certifications as certsApi,
  customers as customersApi,
  machinery as machineryApi,
  products as productsApi,
} from '../api/company-subitems'
import { ApiError } from '../api/client'
import { Modal } from './Modal'
import type {
  CompanyCertification,
  CompanyCustomer,
  CompanyMachinery,
  CompanyProduct,
  CustomerType,
} from '../types/company-subitem'
import type { MasterEntry } from '../types/master'

interface SectionShellProps {
  title: string
  icon: string
  count: number
  canEdit: boolean
  onAdd: () => void
  children: ReactNode
}

function SectionShell({ title, icon, count, canEdit, onAdd, children }: SectionShellProps) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
      <header className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-300 px-2 py-0.5 rounded">
            {count}
          </span>
        </div>
        {canEdit && (
          <button
            onClick={onAdd}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1 rounded-md"
          >
            + Add
          </button>
        )}
      </header>
      {children}
    </section>
  )
}

function EmptyState({ message }: { message: string }) {
  return <p className="p-6 text-sm text-slate-500 text-center">{message}</p>
}

function RowActions({
  onEdit,
  onDelete,
  canEdit,
}: {
  onEdit: () => void
  onDelete: () => void
  canEdit: boolean
}) {
  if (!canEdit) return <td className="py-2 px-4" />
  return (
    <td className="py-2 px-4 text-right space-x-2 whitespace-nowrap">
      <button onClick={onEdit} className="text-xs text-blue-600 hover:underline">
        Edit
      </button>
      <button onClick={onDelete} className="text-xs text-red-600 hover:underline">
        Delete
      </button>
    </td>
  )
}

const inputCls =
  'w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

interface ProductsSectionProps {
  companyId: number
  canEdit: boolean
  onChange?: () => void
}

interface ProductForm {
  name: string
  description: string
  hsn_code: string
  image_url: string
  tags: string[]
}

const emptyProduct: ProductForm = {
  name: '',
  description: '',
  hsn_code: '',
  image_url: '',
  tags: [],
}

export function ProductsSection({ companyId, canEdit, onChange }: ProductsSectionProps) {
  const [items, setItems] = useState<CompanyProduct[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ProductForm>(emptyProduct)
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function refresh() {
    productsApi.list(companyId).then(setItems).catch((err) => setError(String(err)))
  }
  useEffect(() => { refresh() }, [companyId])

  function openAdd() {
    setEditingId(null); setForm(emptyProduct); setTagInput(''); setError(null); setOpen(true)
  }
  function openEdit(p: CompanyProduct) {
    setEditingId(p.id)
    setForm({
      name: p.name,
      description: p.description ?? '',
      hsn_code: p.hsn_code ?? '',
      image_url: p.image_url ?? '',
      tags: [...p.tags],
    })
    setError(null); setOpen(true)
  }
  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(null); setSaving(true)
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      hsn_code: form.hsn_code.trim() || null,
      image_url: form.image_url.trim() || null,
      tags: form.tags,
    }
    try {
      if (editingId === null) await productsApi.create(companyId, payload)
      else await productsApi.update(companyId, editingId, payload)
      setOpen(false); refresh(); onChange?.()
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err))
    } finally { setSaving(false) }
  }
  async function handleDelete(p: CompanyProduct) {
    if (!confirm(`Delete product "${p.name}"?`)) return
    await productsApi.remove(companyId, p.id); refresh(); onChange?.()
  }
  function addTag(t: string) {
    const v = t.trim()
    if (!v || form.tags.includes(v)) return
    setForm({ ...form, tags: [...form.tags, v] }); setTagInput('')
  }

  return (
    <SectionShell title="Products / Services" icon="📦" count={items.length} canEdit={canEdit} onAdd={openAdd}>
      {items.length === 0 ? (
        <EmptyState message={canEdit ? 'No products yet. Click + Add to create one.' : 'No products listed.'} />
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-2 px-4">Name</th>
              <th className="py-2 px-4">HSN</th>
              <th className="py-2 px-4">Tags</th>
              <th className="py-2 px-4">Description</th>
              <th className="py-2 px-4" />
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="py-2 px-4 font-medium text-slate-900">{p.name}</td>
                <td className="py-2 px-4 font-mono text-xs text-slate-600">{p.hsn_code ?? '—'}</td>
                <td className="py-2 px-4">
                  <div className="flex flex-wrap gap-1">
                    {p.tags.length === 0 && <span className="text-slate-400 text-xs">—</span>}
                    {p.tags.map((t) => (
                      <span key={t} className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-200">{t}</span>
                    ))}
                  </div>
                </td>
                <td className="py-2 px-4 text-slate-600 max-w-xs truncate">{p.description ?? '—'}</td>
                <RowActions onEdit={() => openEdit(p)} onDelete={() => handleDelete(p)} canEdit={canEdit} />
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal
        open={open}
        title={editingId === null ? 'Add Product' : 'Edit Product'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button onClick={() => setOpen(false)} className="text-sm border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-100">Cancel</button>
            <button type="submit" form="product-form" disabled={saving} className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium px-4 py-1.5 rounded-md">{saving ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">HSN / SIC Code</label>
            <input type="text" value={form.hsn_code} onChange={(e) => setForm({ ...form, hsn_code: e.target.value })} className={inputCls + ' font-mono'} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
            <input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className={inputCls} placeholder="https://…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {form.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border bg-blue-50 text-blue-800 border-blue-200">
                  {t}
                  <button type="button" onClick={() => setForm({ ...form, tags: form.tags.filter((x) => x !== t) })} className="text-blue-700 hover:text-blue-900">✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) } }} placeholder="Type a tag and press Enter" className={inputCls + ' flex-1'} />
              <button type="button" onClick={() => addTag(tagInput)} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md">Add</button>
            </div>
          </div>
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>}
        </form>
      </Modal>
    </SectionShell>
  )
}

// ---------------------------------------------------------------------------
// Certifications
// ---------------------------------------------------------------------------

interface CertSectionProps {
  companyId: number
  canEdit: boolean
  certifications: MasterEntry[]
  onChange?: () => void
}

interface CertForm {
  certification_code: string
  certificate_number: string
  issued_date: string
  expiry_date: string
  issuer: string
  notes: string
}

const emptyCert: CertForm = {
  certification_code: '',
  certificate_number: '',
  issued_date: '',
  expiry_date: '',
  issuer: '',
  notes: '',
}

export function CertificationsSection({
  companyId,
  canEdit,
  certifications,
  onChange,
}: CertSectionProps) {
  const [items, setItems] = useState<CompanyCertification[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CertForm>(emptyCert)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function refresh() {
    certsApi.list(companyId).then(setItems).catch((err) => setError(String(err)))
  }
  useEffect(() => { refresh() }, [companyId])

  function openAdd() {
    setEditingId(null); setForm(emptyCert); setError(null); setOpen(true)
  }
  function openEdit(c: CompanyCertification) {
    setEditingId(c.id)
    setForm({
      certification_code: c.certification_code,
      certificate_number: c.certificate_number ?? '',
      issued_date: c.issued_date ?? '',
      expiry_date: c.expiry_date ?? '',
      issuer: c.issuer ?? '',
      notes: c.notes ?? '',
    })
    setError(null); setOpen(true)
  }
  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(null); setSaving(true)
    const payload = {
      certification_code: form.certification_code,
      certificate_number: form.certificate_number.trim() || null,
      issued_date: form.issued_date || null,
      expiry_date: form.expiry_date || null,
      issuer: form.issuer.trim() || null,
      notes: form.notes.trim() || null,
    }
    try {
      if (editingId === null) await certsApi.create(companyId, payload)
      else await certsApi.update(companyId, editingId, payload)
      setOpen(false); refresh(); onChange?.()
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err))
    } finally { setSaving(false) }
  }
  async function handleDelete(c: CompanyCertification) {
    if (!confirm(`Remove certification ${c.certification_code}?`)) return
    await certsApi.remove(companyId, c.id); refresh(); onChange?.()
  }

  return (
    <SectionShell title="Certifications" icon="🏆" count={items.length} canEdit={canEdit} onAdd={openAdd}>
      {items.length === 0 ? (
        <EmptyState message={canEdit ? 'No certifications yet. Click + Add to create one.' : 'No certifications listed.'} />
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-2 px-4">Certification</th>
              <th className="py-2 px-4">Cert No.</th>
              <th className="py-2 px-4">Issued</th>
              <th className="py-2 px-4">Expiry</th>
              <th className="py-2 px-4">Issuer</th>
              <th className="py-2 px-4" />
            </tr>
          </thead>
          <tbody>
            {items.map((c) => {
              const cert = certifications.find((x) => x.code === c.certification_code)
              const today = new Date().toISOString().slice(0, 10)
              const expired = c.expiry_date && c.expiry_date < today
              return (
                <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-2 px-4">
                    <div className="font-medium text-slate-900">{cert?.name ?? c.certification_code}</div>
                    <div className="text-xs font-mono text-slate-500">{c.certification_code}</div>
                  </td>
                  <td className="py-2 px-4 font-mono text-xs text-slate-600">{c.certificate_number ?? '—'}</td>
                  <td className="py-2 px-4 text-slate-600">{c.issued_date ?? '—'}</td>
                  <td className={`py-2 px-4 ${expired ? 'text-red-700 font-semibold' : 'text-slate-600'}`}>
                    {c.expiry_date ?? '—'}
                    {expired && <span className="ml-1 text-[10px] uppercase">expired</span>}
                  </td>
                  <td className="py-2 px-4 text-slate-600">{c.issuer ?? '—'}</td>
                  <RowActions onEdit={() => openEdit(c)} onDelete={() => handleDelete(c)} canEdit={canEdit} />
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <Modal
        open={open}
        title={editingId === null ? 'Add Certification' : 'Edit Certification'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button onClick={() => setOpen(false)} className="text-sm border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-100">Cancel</button>
            <button type="submit" form="cert-form" disabled={saving} className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium px-4 py-1.5 rounded-md">{saving ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        <form id="cert-form" onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Certification *</label>
            <select required value={form.certification_code} onChange={(e) => setForm({ ...form, certification_code: e.target.value })} className={inputCls + ' bg-white'}>
              <option value="">Select…</option>
              {certifications.map((c) => (<option key={c.code} value={c.code}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Certificate Number</label>
            <input type="text" value={form.certificate_number} onChange={(e) => setForm({ ...form, certificate_number: e.target.value })} className={inputCls + ' font-mono'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Issued Date</label>
              <input type="date" value={form.issued_date} onChange={(e) => setForm({ ...form, issued_date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
              <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Issuer</label>
            <input type="text" value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} className={inputCls} placeholder="e.g. BSI Group India" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
          </div>
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>}
        </form>
      </Modal>
    </SectionShell>
  )
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

interface CustomerForm {
  name: string
  customer_type: CustomerType
  country: string
  relationship_years: string
  notes: string
}

const emptyCustomer: CustomerForm = {
  name: '',
  customer_type: 'business',
  country: '',
  relationship_years: '',
  notes: '',
}

const customerTypeStyles: Record<CustomerType, string> = {
  business: 'bg-blue-100 text-blue-800 border-blue-200',
  government: 'bg-purple-100 text-purple-800 border-purple-200',
  export: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

export function CustomersSection({
  companyId,
  canEdit,
  onChange,
}: { companyId: number; canEdit: boolean; onChange?: () => void }) {
  const [items, setItems] = useState<CompanyCustomer[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CustomerForm>(emptyCustomer)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function refresh() {
    customersApi.list(companyId).then(setItems).catch((err) => setError(String(err)))
  }
  useEffect(() => { refresh() }, [companyId])

  function openAdd() { setEditingId(null); setForm(emptyCustomer); setError(null); setOpen(true) }
  function openEdit(c: CompanyCustomer) {
    setEditingId(c.id)
    setForm({
      name: c.name,
      customer_type: c.customer_type,
      country: c.country ?? '',
      relationship_years: c.relationship_years?.toString() ?? '',
      notes: c.notes ?? '',
    })
    setError(null); setOpen(true)
  }
  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(null); setSaving(true)
    const payload = {
      name: form.name.trim(),
      customer_type: form.customer_type,
      country: form.country.trim() || null,
      relationship_years: form.relationship_years.trim() === '' ? null : Number(form.relationship_years),
      notes: form.notes.trim() || null,
    }
    try {
      if (editingId === null) await customersApi.create(companyId, payload)
      else await customersApi.update(companyId, editingId, payload)
      setOpen(false); refresh(); onChange?.()
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err))
    } finally { setSaving(false) }
  }
  async function handleDelete(c: CompanyCustomer) {
    if (!confirm(`Remove customer "${c.name}"?`)) return
    await customersApi.remove(companyId, c.id); refresh(); onChange?.()
  }

  return (
    <SectionShell title="Customers" icon="🤝" count={items.length} canEdit={canEdit} onAdd={openAdd}>
      {items.length === 0 ? (
        <EmptyState message={canEdit ? 'No customers yet. Click + Add to create one.' : 'No customers listed.'} />
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-2 px-4">Name</th>
              <th className="py-2 px-4">Type</th>
              <th className="py-2 px-4">Country</th>
              <th className="py-2 px-4">Years</th>
              <th className="py-2 px-4">Notes</th>
              <th className="py-2 px-4" />
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="py-2 px-4 font-medium text-slate-900">{c.name}</td>
                <td className="py-2 px-4">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase ${customerTypeStyles[c.customer_type]}`}>
                    {c.customer_type}
                  </span>
                </td>
                <td className="py-2 px-4 text-slate-600">{c.country ?? '—'}</td>
                <td className="py-2 px-4 text-slate-600 tabular-nums">{c.relationship_years ?? '—'}</td>
                <td className="py-2 px-4 text-slate-600 max-w-xs truncate">{c.notes ?? '—'}</td>
                <RowActions onEdit={() => openEdit(c)} onDelete={() => handleDelete(c)} canEdit={canEdit} />
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal
        open={open}
        title={editingId === null ? 'Add Customer' : 'Edit Customer'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button onClick={() => setOpen(false)} className="text-sm border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-100">Cancel</button>
            <button type="submit" form="customer-form" disabled={saving} className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium px-4 py-1.5 rounded-md">{saving ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        <form id="customer-form" onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
            <select value={form.customer_type} onChange={(e) => setForm({ ...form, customer_type: e.target.value as CustomerType })} className={inputCls + ' bg-white'}>
              <option value="business">Business</option>
              <option value="government">Government</option>
              <option value="export">Export</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
              <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Relationship (years)</label>
              <input type="number" min={0} value={form.relationship_years} onChange={(e) => setForm({ ...form, relationship_years: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
          </div>
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>}
        </form>
      </Modal>
    </SectionShell>
  )
}

// ---------------------------------------------------------------------------
// Machinery
// ---------------------------------------------------------------------------

interface MachineryForm {
  name: string
  quantity: string
  capacity_value: string
  capacity_unit: string
  description: string
}

const emptyMachinery: MachineryForm = {
  name: '',
  quantity: '',
  capacity_value: '',
  capacity_unit: '',
  description: '',
}

export function MachinerySection({
  companyId,
  canEdit,
  productionCapacities,
  onChange,
}: {
  companyId: number
  canEdit: boolean
  productionCapacities: MasterEntry[]
  onChange?: () => void
}) {
  const [items, setItems] = useState<CompanyMachinery[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<MachineryForm>(emptyMachinery)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function refresh() {
    machineryApi.list(companyId).then(setItems).catch((err) => setError(String(err)))
  }
  useEffect(() => { refresh() }, [companyId])

  function openAdd() { setEditingId(null); setForm(emptyMachinery); setError(null); setOpen(true) }
  function openEdit(m: CompanyMachinery) {
    setEditingId(m.id)
    setForm({
      name: m.name,
      quantity: m.quantity?.toString() ?? '',
      capacity_value: m.capacity_value?.toString() ?? '',
      capacity_unit: m.capacity_unit ?? '',
      description: m.description ?? '',
    })
    setError(null); setOpen(true)
  }
  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(null); setSaving(true)
    const payload = {
      name: form.name.trim(),
      quantity: form.quantity.trim() === '' ? null : Number(form.quantity),
      capacity_value: form.capacity_value.trim() === '' ? null : Number(form.capacity_value),
      capacity_unit: form.capacity_unit || null,
      description: form.description.trim() || null,
    }
    try {
      if (editingId === null) await machineryApi.create(companyId, payload)
      else await machineryApi.update(companyId, editingId, payload)
      setOpen(false); refresh(); onChange?.()
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err))
    } finally { setSaving(false) }
  }
  async function handleDelete(m: CompanyMachinery) {
    if (!confirm(`Remove machinery "${m.name}"?`)) return
    await machineryApi.remove(companyId, m.id); refresh(); onChange?.()
  }

  return (
    <SectionShell title="Machinery / Capabilities" icon="⚙️" count={items.length} canEdit={canEdit} onAdd={openAdd}>
      {items.length === 0 ? (
        <EmptyState message={canEdit ? 'No machinery yet. Click + Add to create one.' : 'No machinery listed.'} />
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-2 px-4">Name</th>
              <th className="py-2 px-4">Quantity</th>
              <th className="py-2 px-4">Capacity</th>
              <th className="py-2 px-4">Description</th>
              <th className="py-2 px-4" />
            </tr>
          </thead>
          <tbody>
            {items.map((m) => {
              const unit = productionCapacities.find((u) => u.code === m.capacity_unit)
              return (
                <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-2 px-4 font-medium text-slate-900">{m.name}</td>
                  <td className="py-2 px-4 text-slate-600 tabular-nums">{m.quantity ?? '—'}</td>
                  <td className="py-2 px-4 text-slate-600">
                    {m.capacity_value != null && m.capacity_value > 0
                      ? `${m.capacity_value.toLocaleString()} ${unit?.name ?? m.capacity_unit ?? ''}`.trim()
                      : '—'}
                  </td>
                  <td className="py-2 px-4 text-slate-600 max-w-xs truncate">{m.description ?? '—'}</td>
                  <RowActions onEdit={() => openEdit(m)} onDelete={() => handleDelete(m)} canEdit={canEdit} />
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <Modal
        open={open}
        title={editingId === null ? 'Add Machinery' : 'Edit Machinery'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button onClick={() => setOpen(false)} className="text-sm border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-100">Cancel</button>
            <button type="submit" form="machinery-form" disabled={saving} className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium px-4 py-1.5 rounded-md">{saving ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        <form id="machinery-form" onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. CNC Lathe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
            <input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Capacity Value</label>
              <input type="number" min={0} step="any" value={form.capacity_value} onChange={(e) => setForm({ ...form, capacity_value: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Capacity Unit</label>
              <select value={form.capacity_unit} onChange={(e) => setForm({ ...form, capacity_unit: e.target.value })} className={inputCls + ' bg-white'}>
                <option value="">Select…</option>
                {productionCapacities.map((u) => (<option key={u.code} value={u.code}>{u.name}</option>))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} placeholder="Model, year, manufacturer…" />
          </div>
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>}
        </form>
      </Modal>
    </SectionShell>
  )
}
