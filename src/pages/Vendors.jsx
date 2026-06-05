import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import { DateInput } from '../components/DateInput'
import { StatusBadge } from '../components/StatusBadge'
import { Toast } from '../components/Toast'

function InlineCell({ value, onSave, type = 'text' }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)
  useEffect(() => { setVal(value) }, [value])

  const save = () => {
    setEditing(false)
    const final = type === 'number' ? Number(val) || 0 : type === 'checkbox' ? val : val
    if (final !== value) onSave(final)
  }

  if (type === 'checkbox') {
    return <input type="checkbox" checked={!!value} onChange={e => onSave(e.target.checked)} className="task-checkbox" />
  }

  if (!editing) {
    return (
      <span onClick={() => setEditing(true)} style={{ cursor: 'pointer', display: 'block' }}>
        {type === 'number' ? (value ? `$${Number(value).toLocaleString()}` : '—') : (value || '—')}
      </span>
    )
  }

  return (
    <input className="inline-edit" type={type} value={val} autoFocus
      onChange={e => setVal(e.target.value)} onBlur={save} onKeyDown={e => e.key === 'Enter' && save()} />
  )
}

export default function Vendors() {
  const [vendors, setVendors] = useState([])
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    const data = await api.get('/api/vendors')
    setVendors(data)
  }, [])

  useEffect(() => { load() }, [load])

  const updateVendor = async (id, changes) => {
    const prev = vendors
    setVendors(vendors.map(v => v.id === id ? { ...v, ...changes } : v))
    try {
      await api.put(`/api/vendors/${id}`, changes)
    } catch {
      setVendors(prev)
      setToast('Failed to save')
    }
  }

  const addVendor = async () => {
    const v = await api.post('/api/vendors', { name: 'New Vendor' })
    setVendors([...vendors, v])
  }

  const deleteVendor = async (id) => {
    if (!confirm('Delete this vendor?')) return
    setVendors(vendors.filter(v => v.id !== id))
    await api.del(`/api/vendors/${id}`)
  }

  const categories = ['All', ...new Set(vendors.map(v => v.category).filter(Boolean))]
  const statuses = ['All', 'None', 'Sent', 'Signed']

  const filtered = vendors.filter(v => {
    if (filterCategory !== 'All' && v.category !== filterCategory) return false
    if (filterStatus !== 'All' && v.contractStatus !== filterStatus) return false
    return true
  })

  return (
    <div>
      <div className="page-header">
        <h2>Vendors</h2>
        <p>Manage vendor contacts, contracts, and payments</p>
      </div>

      <div className="filter-bar">
        <label>Category</label>
        <select className="filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label>Contract</label>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-primary" onClick={addVendor}>+ Add Vendor</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Vendor Name</th><th>Category</th><th>Contact</th><th>Phone</th>
              <th>Email</th><th>Contract</th><th>Deposit Paid</th><th>Deposit $</th>
              <th>Balance</th><th>Due Date</th><th>Notes</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v.id}>
                <td><InlineCell value={v.name} onSave={val => updateVendor(v.id, { name: val })} /></td>
                <td><InlineCell value={v.category} onSave={val => updateVendor(v.id, { category: val })} /></td>
                <td><InlineCell value={v.contactName} onSave={val => updateVendor(v.id, { contactName: val })} /></td>
                <td><InlineCell value={v.phone} onSave={val => updateVendor(v.id, { phone: val })} /></td>
                <td><InlineCell value={v.email} onSave={val => updateVendor(v.id, { email: val })} /></td>
                <td><StatusBadge value={v.contractStatus} type="contract" onChange={val => updateVendor(v.id, { contractStatus: val })} /></td>
                <td><InlineCell value={v.depositPaid} type="checkbox" onSave={val => updateVendor(v.id, { depositPaid: val })} /></td>
                <td><InlineCell value={v.depositAmount} type="number" onSave={val => updateVendor(v.id, { depositAmount: val })} /></td>
                <td><InlineCell value={v.balanceDue} type="number" onSave={val => updateVendor(v.id, { balanceDue: val })} /></td>
                <td><DateInput value={v.paymentDueDate} onChange={val => updateVendor(v.id, { paymentDueDate: val })} /></td>
                <td><InlineCell value={v.notes} onSave={val => updateVendor(v.id, { notes: val })} /></td>
                <td><button className="btn-icon" onClick={() => deleteVendor(v.id)}>🗑</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}
