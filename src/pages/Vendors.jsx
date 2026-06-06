import { useState, useEffect } from 'react'
import { api } from '../api'
import { useData } from '../DataContext'
import { DateInput } from '../components/DateInput'
import { StatusBadge } from '../components/StatusBadge'
import { Toast } from '../components/Toast'
import { PageShell, EmptyRow } from '../components/PageShell'
import { TableScrollHint } from '../components/TableScrollHint'

function InlineCell({ value, onSave, type = 'text' }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)
  useEffect(() => { setVal(value) }, [value])

  const save = () => {
    setEditing(false)
    const final = type === 'number' ? Number(val) || 0 : val
    if (final !== value) onSave(final)
  }

  if (type === 'checkbox') {
    return <input type="checkbox" checked={!!value} onChange={e => onSave(e.target.checked)} className="task-checkbox" aria-label="Deposit paid" />
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
      onChange={e => setVal(e.target.value)} onBlur={save}
      onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(value); setEditing(false) } }} />
  )
}

export default function Vendors() {
  const { vendors, setVendors } = useData()
  const [filterCategory, setFilterCategory] = useState(() => localStorage.getItem('vendors:category') || 'All')
  const [filterStatus, setFilterStatus] = useState(() => localStorage.getItem('vendors:status') || 'All')
  const [toast, setToast] = useState('')

  useEffect(() => { localStorage.setItem('vendors:category', filterCategory) }, [filterCategory])
  useEffect(() => { localStorage.setItem('vendors:status', filterStatus) }, [filterStatus])

  const updateVendor = async (id, changes) => {
    let snapshot
    setVendors(prev => {
      snapshot = prev
      return prev.map(v => v.id === id ? { ...v, ...changes } : v)
    })
    try {
      await api.put(`/api/vendors/${id}`, changes)
    } catch {
      setVendors(snapshot)
      setToast('Failed to save')
    }
  }

  const addVendor = async () => {
    try {
      const v = await api.post('/api/vendors', { name: 'New Vendor' })
      setVendors(prev => [...prev, v])
    } catch {
      setToast('Failed to add vendor')
    }
  }

  const deleteVendor = async (id) => {
    if (!confirm('Delete this vendor?')) return
    let snapshot
    setVendors(prev => {
      snapshot = prev
      return prev.filter(v => v.id !== id)
    })
    try {
      await api.del(`/api/vendors/${id}`)
    } catch {
      setVendors(snapshot)
      setToast('Failed to delete')
    }
  }

  const categories = ['All', ...new Set(vendors.map(v => v.category).filter(Boolean))]
  const statuses = ['All', 'None', 'Sent', 'Signed']

  const filtered = vendors.filter(v => {
    if (filterCategory !== 'All' && v.category !== filterCategory) return false
    if (filterStatus !== 'All' && v.contractStatus !== filterStatus) return false
    return true
  })

  return (
    <PageShell>
      <div className="page-header">
        <h2>Vendors</h2>
        <p>Manage vendor contacts, contracts, and payments</p>
      </div>

      <div className="filter-bar">
        <label htmlFor="vendors-category">Category</label>
        <select id="vendors-category" className="filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label htmlFor="vendors-status">Contract</label>
        <select id="vendors-status" className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="button" className="btn btn-primary" onClick={addVendor}>+ Add Vendor</button>
      </div>

      <TableScrollHint />
      <div className="table-wrap table-wrap--scroll">
        <table className="data-table vendors-table">
          <thead>
            <tr>
              <th scope="col">Vendor Name</th><th scope="col">Category</th><th scope="col">Contact</th><th scope="col">Phone</th>
              <th scope="col">Email</th><th scope="col">Contract</th><th scope="col">Deposit Paid</th><th scope="col">Deposit $</th>
              <th scope="col">Balance</th><th scope="col">Due Date</th><th scope="col">Notes</th><th scope="col"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <EmptyRow colSpan={12} message={vendors.length === 0 ? 'No vendors yet — add your first vendor above.' : 'No vendors match your filters.'} />}
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
                <td><button type="button" className="btn-icon" aria-label={`Delete ${v.name || 'vendor'}`} onClick={() => deleteVendor(v.id)}>🗑</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Toast message={toast} onClose={() => setToast('')} />
    </PageShell>
  )
}
