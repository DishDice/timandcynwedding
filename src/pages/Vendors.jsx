import { useState, useEffect } from 'react'
import { api } from '../api'
import { useData } from '../DataContext'
import { useCompactLayout } from '../hooks/useCompactLayout'
import { DateInput } from '../components/DateInput'
import { StatusBadge } from '../components/StatusBadge'
import { Toast } from '../components/Toast'
import { PageShell, EmptyRow } from '../components/PageShell'
import { TableScrollHint } from '../components/TableScrollHint'

function InlineCell({ value, onSave, type = 'text' }) {
  const safeValue = value ?? ''
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(safeValue)
  useEffect(() => { setVal(value ?? '') }, [value])

  const save = () => {
    setEditing(false)
    const final = type === 'number' ? Number(val) || 0 : val
    if (final !== value) onSave(final)
  }

  if (type === 'checkbox') {
    return <input type="checkbox" checked={!!value} onChange={e => onSave(e.target.checked)} className="task-checkbox" aria-label="Deposit paid" />
  }

  if (!editing) {
    const numericDisplay = type === 'number' && (value === 0 || (value !== '' && value !== null && value !== undefined))
      ? `$${Number(value).toLocaleString()}`
      : null
    return (
      <span
        className="editable-cell"
        onClick={() => setEditing(true)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(true) } }}
        role="button"
        tabIndex={0}
      >
        {type === 'number' ? (numericDisplay || '—') : (safeValue !== '' ? safeValue : '—')}
      </span>
    )
  }

  return (
    <input className="inline-edit" type={type} value={val} autoFocus
      onChange={e => setVal(e.target.value)} onBlur={save}
      onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(safeValue); setEditing(false) } }} />
  )
}

function VendorCardList({ vendors, onUpdate, onDelete }) {
  if (vendors.length === 0) {
    return <p className="card-list-empty">No vendors match your filters.</p>
  }
  return (
    <div className="card-list">
      {vendors.map(v => (
        <div key={v.id} className="data-card">
          <div className="data-card-header">
            <div className="data-card-title">
              <InlineCell value={v.name} onSave={val => onUpdate(v.id, { name: val })} />
              {v.category && <div className="data-card-subtitle">{v.category}</div>}
            </div>
            <div className="data-card-actions">
              <StatusBadge value={v.contractStatus} type="contract" onChange={val => onUpdate(v.id, { contractStatus: val })} />
              <button type="button" className="btn-icon" aria-label={`Delete ${v.name || 'vendor'}`} onClick={() => onDelete(v.id)}>🗑</button>
            </div>
          </div>
          <div className="data-card-grid">
            <div className="data-card-field">
              <span className="data-card-label">Category</span>
              <div className="data-card-value">
                <InlineCell value={v.category} onSave={val => onUpdate(v.id, { category: val })} />
              </div>
            </div>
            <div className="data-card-field">
              <span className="data-card-label">Contact</span>
              <div className="data-card-value">
                <InlineCell value={v.contactName} onSave={val => onUpdate(v.id, { contactName: val })} />
              </div>
            </div>
            <div className="data-card-field">
              <span className="data-card-label">Phone</span>
              <div className="data-card-value">
                {v.phone ? <a href={`tel:${v.phone}`} className="data-card-link">{v.phone}</a> : <InlineCell value={v.phone} onSave={val => onUpdate(v.id, { phone: val })} />}
              </div>
            </div>
            <div className="data-card-field">
              <span className="data-card-label">Email</span>
              <div className="data-card-value">
                {v.email ? <a href={`mailto:${v.email}`} className="data-card-link">{v.email}</a> : <InlineCell value={v.email} onSave={val => onUpdate(v.id, { email: val })} />}
              </div>
            </div>
            <div className="data-card-field">
              <span className="data-card-label">Deposit</span>
              <div className="data-card-value data-card-meta-row">
                <InlineCell value={v.depositPaid} type="checkbox" onSave={val => onUpdate(v.id, { depositPaid: val })} />
                <InlineCell value={v.depositAmount} type="number" onSave={val => onUpdate(v.id, { depositAmount: val })} />
              </div>
            </div>
            <div className="data-card-field">
              <span className="data-card-label">Balance</span>
              <div className="data-card-value">
                <InlineCell value={v.balanceDue} type="number" onSave={val => onUpdate(v.id, { balanceDue: val })} />
              </div>
            </div>
            <div className="data-card-field">
              <span className="data-card-label">Payment Due</span>
              <div className="data-card-value">
                <DateInput value={v.paymentDueDate} onChange={val => onUpdate(v.id, { paymentDueDate: val })} />
              </div>
            </div>
            <div className="data-card-field data-card-field--full">
              <span className="data-card-label">Notes</span>
              <div className="data-card-value">
                <InlineCell value={v.notes} onSave={val => onUpdate(v.id, { notes: val })} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Vendors() {
  const compact = useCompactLayout(1100)
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

      {compact ? (
        <VendorCardList vendors={filtered} onUpdate={updateVendor} onDelete={deleteVendor} />
      ) : (
        <>
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
        </>
      )}
      <Toast message={toast} onClose={() => setToast('')} />
    </PageShell>
  )
}
