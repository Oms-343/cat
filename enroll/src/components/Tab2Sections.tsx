import { useEffect, useState, type FormEvent } from 'react'
import { fetchMasterOptions, updateTags } from '../api/enroll'
import {
  certificationsApi,
  customersApi,
  machineryApi,
  productsApi,
  type CompanyCertification,
  type CompanyCustomer,
  type CompanyMachinery,
  type CompanyProduct,
} from '../api/enrollSubitems'
import { Modal } from './Modal'

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500'

function Shell({
  title,
  count,
  onAdd,
  children,
}: {
  title: string
  count: number
  onAdd: () => void
  children: React.ReactNode
}) {
  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="font-semibold text-slate-900">
          {title} <span className="text-xs font-normal text-slate-500">({count})</span>
        </h3>
        <button type="button" onClick={onAdd} className="rounded-md bg-teal-700 px-3 py-1 text-xs font-medium text-white hover:bg-teal-800">
          + Add
        </button>
      </header>
      {children}
    </section>
  )
}

export function Tab2Sections({
  token,
  initialTags,
  onRefresh,
}: {
  token: string
  initialTags: string[]
  onRefresh: () => void
}) {
  const [certMasters, setCertMasters] = useState<{ code: string; name: string }[]>([])
  const [capacityMasters, setCapacityMasters] = useState<{ code: string; name: string }[]>([])
  const [tags, setTags] = useState<string[]>(initialTags)
  const [tagInput, setTagInput] = useState('')
  const [savingTags, setSavingTags] = useState(false)

  useEffect(() => {
    void Promise.all([
      fetchMasterOptions('certifications'),
      fetchMasterOptions('production-capacities'),
    ]).then(([c, p]) => {
      setCertMasters(c)
      setCapacityMasters(p)
    })
  }, [])

  useEffect(() => {
    setTags(initialTags)
  }, [initialTags])

  async function saveTags(next: string[]) {
    setSavingTags(true)
    try {
      await updateTags(token, next)
      setTags(next)
      onRefresh()
    } finally {
      setSavingTags(false)
    }
  }

  function addTag(t: string) {
    const v = t.trim()
    if (!v || tags.includes(v)) return
    void saveTags([...tags, v])
    setTagInput('')
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-600">
        Optional: add products, certifications, customers, machinery, and tags. You can skip and finish later if TIDCO sends another reminder.
      </p>

      <ProductsBlock token={token} onRefresh={onRefresh} />
      <CertsBlock token={token} certMasters={certMasters} onRefresh={onRefresh} />
      <CustomersBlock token={token} onRefresh={onRefresh} />
      <MachineryBlock token={token} capacityMasters={capacityMasters} onRefresh={onRefresh} />

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-900">Tags</h3>
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs text-teal-900">
              {t}
              <button type="button" onClick={() => void saveTags(tags.filter((x) => x !== t))} className="text-teal-700">✕</button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input className={inputCls} value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Custom tag" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) } }} />
          <button type="button" disabled={savingTags} onClick={() => addTag(tagInput)} className="rounded-lg bg-teal-700 px-3 py-2 text-sm text-white disabled:opacity-60">Add</button>
        </div>
      </section>
    </div>
  )
}

function ProductsBlock({ token, onRefresh }: { token: string; onRefresh: () => void }) {
  const [items, setItems] = useState<CompanyProduct[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [hsn, setHsn] = useState('')
  const [desc, setDesc] = useState('')

  function refresh() {
    void productsApi.list(token).then(setItems)
  }
  useEffect(() => { refresh() }, [token])

  async function save(e: FormEvent) {
    e.preventDefault()
    const payload = { name: name.trim(), hsn_code: hsn || null, description: desc || null, tags: [] }
    if (editingId) await productsApi.update(token, editingId, payload)
    else await productsApi.create(token, payload)
    setOpen(false)
    refresh()
    onRefresh()
  }

  return (
    <Shell title="Products / services" count={items.length} onAdd={() => { setEditingId(null); setName(''); setHsn(''); setDesc(''); setOpen(true) }}>
      {items.length === 0 ? <p className="p-4 text-sm text-slate-500">No products yet.</p> : (
        <ul className="divide-y divide-slate-100 text-sm">
          {items.map((p) => (
            <li key={p.id} className="flex justify-between gap-2 px-4 py-2">
              <span><strong>{p.name}</strong> {p.hsn_code ? `· ${p.hsn_code}` : ''}</span>
              <span className="shrink-0 space-x-2">
                <button type="button" className="text-teal-700" onClick={() => { setEditingId(p.id); setName(p.name); setHsn(p.hsn_code ?? ''); setDesc(p.description ?? ''); setOpen(true) }}>Edit</button>
                <button type="button" className="text-red-600" onClick={() => { if (confirm('Delete?')) void productsApi.remove(token, p.id).then(() => { refresh(); onRefresh() }) }}>Delete</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <Modal open={open} title={editingId ? 'Edit product' : 'Add product'} onClose={() => setOpen(false)} footer={
        <button type="submit" form="prod-f" className="rounded-lg bg-teal-700 px-4 py-2 text-sm text-white">Save</button>
      }>
        <form id="prod-f" onSubmit={save} className="space-y-3">
          <input className={inputCls} placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className={inputCls} placeholder="HSN code" value={hsn} onChange={(e) => setHsn(e.target.value)} />
          <textarea className={inputCls} placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
        </form>
      </Modal>
    </Shell>
  )
}

function CertsBlock({ token, certMasters, onRefresh }: { token: string; certMasters: { code: string; name: string }[]; onRefresh: () => void }) {
  const [items, setItems] = useState<CompanyCertification[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [code, setCode] = useState('')
  const [certNo, setCertNo] = useState('')

  function refresh() { void certificationsApi.list(token).then(setItems) }
  useEffect(() => { refresh() }, [token])

  async function save(e: FormEvent) {
    e.preventDefault()
    const payload = { certification_code: code, certificate_number: certNo || null }
    if (editingId) await certificationsApi.update(token, editingId, payload)
    else await certificationsApi.create(token, payload)
    setOpen(false)
    refresh()
    onRefresh()
  }

  return (
    <Shell title="Certifications" count={items.length} onAdd={() => { setEditingId(null); setCode(''); setCertNo(''); setOpen(true) }}>
      {items.length === 0 ? <p className="p-4 text-sm text-slate-500">No certifications yet.</p> : (
        <ul className="divide-y divide-slate-100 px-4 py-2 text-sm">
          {items.map((c) => (
            <li key={c.id} className="flex justify-between py-1">
              <span>{certMasters.find((m) => m.code === c.certification_code)?.name ?? c.certification_code}</span>
              <span className="space-x-2">
                <button type="button" className="text-teal-700" onClick={() => { setEditingId(c.id); setCode(c.certification_code); setCertNo(c.certificate_number ?? ''); setOpen(true) }}>Edit</button>
                <button type="button" className="text-red-600" onClick={() => { if (confirm('Delete?')) void certificationsApi.remove(token, c.id).then(() => { refresh(); onRefresh() }) }}>Delete</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <Modal open={open} title="Certification" onClose={() => setOpen(false)} footer={<button type="submit" form="cert-f" className="rounded-lg bg-teal-700 px-4 py-2 text-sm text-white">Save</button>}>
        <form id="cert-f" onSubmit={save} className="space-y-3">
          <select className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} required>
            <option value="">Select certification</option>
            {certMasters.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
          </select>
          <input className={inputCls} placeholder="Certificate number" value={certNo} onChange={(e) => setCertNo(e.target.value)} />
        </form>
      </Modal>
    </Shell>
  )
}

function CustomersBlock({ token, onRefresh }: { token: string; onRefresh: () => void }) {
  const [items, setItems] = useState<CompanyCustomer[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [ctype, setCtype] = useState<'business' | 'government' | 'export'>('business')

  function refresh() { void customersApi.list(token).then(setItems) }
  useEffect(() => { refresh() }, [token])

  async function save(e: FormEvent) {
    e.preventDefault()
    const payload = { name: name.trim(), customer_type: ctype }
    if (editingId) await customersApi.update(token, editingId, payload)
    else await customersApi.create(token, payload)
    setOpen(false)
    refresh()
    onRefresh()
  }

  return (
    <Shell title="Customers" count={items.length} onAdd={() => { setEditingId(null); setName(''); setCtype('business'); setOpen(true) }}>
      {items.length === 0 ? <p className="p-4 text-sm text-slate-500">No customers yet.</p> : (
        <ul className="divide-y divide-slate-100 px-4 py-2 text-sm">
          {items.map((c) => (
            <li key={c.id} className="flex justify-between py-1">
              <span>{c.name} <span className="text-slate-500">({c.customer_type})</span></span>
              <span className="space-x-2">
                <button type="button" className="text-teal-700" onClick={() => { setEditingId(c.id); setName(c.name); setCtype(c.customer_type); setOpen(true) }}>Edit</button>
                <button type="button" className="text-red-600" onClick={() => { if (confirm('Delete?')) void customersApi.remove(token, c.id).then(() => { refresh(); onRefresh() }) }}>Delete</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <Modal open={open} title="Customer" onClose={() => setOpen(false)} footer={<button type="submit" form="cust-f" className="rounded-lg bg-teal-700 px-4 py-2 text-sm text-white">Save</button>}>
        <form id="cust-f" onSubmit={save} className="space-y-3">
          <input className={inputCls} placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} required />
          <select className={inputCls} value={ctype} onChange={(e) => setCtype(e.target.value as typeof ctype)}>
            <option value="business">Business</option>
            <option value="government">Government</option>
            <option value="export">Export</option>
          </select>
        </form>
      </Modal>
    </Shell>
  )
}

function MachineryBlock({ token, capacityMasters, onRefresh }: { token: string; capacityMasters: { code: string; name: string }[]; onRefresh: () => void }) {
  const [items, setItems] = useState<CompanyMachinery[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [qty, setQty] = useState('')
  const [capUnit, setCapUnit] = useState('')

  function refresh() { void machineryApi.list(token).then(setItems) }
  useEffect(() => { refresh() }, [token])

  async function save(e: FormEvent) {
    e.preventDefault()
    const payload = {
      name: name.trim(),
      quantity: qty ? Number(qty) : null,
      capacity_unit: capUnit || null,
    }
    if (editingId) await machineryApi.update(token, editingId, payload)
    else await machineryApi.create(token, payload)
    setOpen(false)
    refresh()
    onRefresh()
  }

  return (
    <Shell title="Machinery / capabilities" count={items.length} onAdd={() => { setEditingId(null); setName(''); setQty(''); setCapUnit(''); setOpen(true) }}>
      {items.length === 0 ? <p className="p-4 text-sm text-slate-500">No machinery yet.</p> : (
        <ul className="divide-y divide-slate-100 px-4 py-2 text-sm">
          {items.map((m) => (
            <li key={m.id} className="flex justify-between py-1">
              <span>{m.name}</span>
              <span className="space-x-2">
                <button type="button" className="text-teal-700" onClick={() => { setEditingId(m.id); setName(m.name); setQty(m.quantity?.toString() ?? ''); setCapUnit(m.capacity_unit ?? ''); setOpen(true) }}>Edit</button>
                <button type="button" className="text-red-600" onClick={() => { if (confirm('Delete?')) void machineryApi.remove(token, m.id).then(() => { refresh(); onRefresh() }) }}>Delete</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <Modal open={open} title="Machinery" onClose={() => setOpen(false)} footer={<button type="submit" form="mach-f" className="rounded-lg bg-teal-700 px-4 py-2 text-sm text-white">Save</button>}>
        <form id="mach-f" onSubmit={save} className="space-y-3">
          <input className={inputCls} placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} required />
          <input type="number" className={inputCls} placeholder="Quantity" value={qty} onChange={(e) => setQty(e.target.value)} min={0} />
          <select className={inputCls} value={capUnit} onChange={(e) => setCapUnit(e.target.value)}>
            <option value="">Capacity unit</option>
            {capacityMasters.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
          </select>
        </form>
      </Modal>
    </Shell>
  )
}
