import { useState, useEffect } from 'react'
import { api } from '../api'
import { useData } from '../DataContext'
import { useCompactLayout } from '../hooks/useCompactLayout'
import { Toast } from '../components/Toast'
import { PageShell, EmptyRow } from '../components/PageShell'
import { TableScrollHint } from '../components/TableScrollHint'

const CATEGORIES = ['Contract', 'Invoice', 'Inspiration', 'Legal', 'Other']

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function InlineCell({ value, onSave, type = 'text' }) {
  const safeValue = value ?? ''
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(safeValue)
  useEffect(() => { setVal(value ?? '') }, [value])

  const save = () => {
    setEditing(false)
    if (val !== value) onSave(val)
  }

  if (!editing) {
    return (
      <span
        className="editable-cell"
        onClick={() => setEditing(true)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(true) } }}
        role="button"
        tabIndex={0}
      >
        {type === 'url' && safeValue
          ? <a href={safeValue} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>{safeValue}</a>
          : (safeValue !== '' ? safeValue : '—')}
      </span>
    )
  }

  return (
    <input className="inline-edit" value={val} autoFocus
      onChange={e => setVal(e.target.value)} onBlur={save}
      onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(safeValue); setEditing(false) } }} />
  )
}

function DocCardList({ docs, onUpdate, onDelete }) {
  if (docs.length === 0) {
    return <p className="card-list-empty">No documents yet — add your first link above.</p>
  }
  return (
    <div className="card-list">
      {docs.map(d => (
        <div key={d.id} className="data-card">
          <div className="data-card-header">
            <div className="data-card-title">
              <InlineCell value={d.name} onSave={v => onUpdate(d.id, { name: v })} />
              <div className="data-card-subtitle">{d.category || 'Other'} · {formatDate(d.dateAdded)}</div>
            </div>
            <div className="data-card-actions">
              <button type="button" className="btn-icon" aria-label={`Delete ${d.name}`} onClick={() => onDelete(d.id)}>🗑</button>
            </div>
          </div>
          <div className="data-card-grid">
            <div className="data-card-field">
              <span className="data-card-label">Category</span>
              <div className="data-card-value">
                <select className="filter-select" value={d.category || 'Other'} onChange={e => onUpdate(d.id, { category: e.target.value })} aria-label={`Category for ${d.name}`}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="data-card-field">
              <span className="data-card-label">Vendor</span>
              <div className="data-card-value">
                <InlineCell value={d.vendor} onSave={v => onUpdate(d.id, { vendor: v })} />
              </div>
            </div>
            <div className="data-card-field data-card-field--full">
              <span className="data-card-label">URL</span>
              <div className="data-card-value">
                {d.url
                  ? <a href={d.url} target="_blank" rel="noreferrer" className="data-card-link">{d.url}</a>
                  : <InlineCell value={d.url} type="url" onSave={v => onUpdate(d.id, { url: v })} />}
              </div>
            </div>
            <div className="data-card-field data-card-field--full">
              <span className="data-card-label">Notes</span>
              <div className="data-card-value">
                <InlineCell value={d.notes} onSave={v => onUpdate(d.id, { notes: v })} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Documents() {
  const compact = useCompactLayout(900)
  const { documents, setDocuments } = useData()
  const [toast, setToast] = useState('')

  const updateDoc = async (id, changes) => {
    let snapshot
    setDocuments(prev => {
      snapshot = prev
      return prev.map(d => d.id === id ? { ...d, ...changes } : d)
    })
    try {
      await api.put(`/api/documents/${id}`, changes)
    } catch {
      setDocuments(snapshot)
      setToast('Failed to save')
    }
  }

  const addDoc = async () => {
    try {
      const d = await api.post('/api/documents', { name: 'New Document' })
      setDocuments(prev => [d, ...prev])
    } catch {
      setToast('Failed to add document')
    }
  }

  const deleteDoc = async (id) => {
    if (!confirm('Delete this document?')) return
    let snapshot
    setDocuments(prev => {
      snapshot = prev
      return prev.filter(d => d.id !== id)
    })
    try {
      await api.del(`/api/documents/${id}`)
    } catch {
      setDocuments(snapshot)
      setToast('Failed to delete')
    }
  }

  return (
    <PageShell>
      <div className="page-header">
        <h2>Documents</h2>
        <p>Track contracts, invoices, and inspiration links</p>
      </div>

      <div className="filter-bar">
        <button type="button" className="btn btn-primary" onClick={addDoc}>+ Add Document</button>
      </div>

      {compact ? (
        <DocCardList docs={documents} onUpdate={updateDoc} onDelete={deleteDoc} />
      ) : (
        <>
          <TableScrollHint />
          <div className="table-wrap table-wrap--scroll">
            <table className="data-table">
              <thead>
                <tr><th scope="col">Name</th><th scope="col">Category</th><th scope="col">Vendor</th><th scope="col">URL</th><th scope="col">Date Added</th><th scope="col">Notes</th><th scope="col"></th></tr>
              </thead>
              <tbody>
                {documents.length === 0 && <EmptyRow colSpan={7} message="No documents yet — add a link above." />}
                {documents.map(d => (
                  <tr key={d.id}>
                    <td><InlineCell value={d.name} onSave={v => updateDoc(d.id, { name: v })} /></td>
                    <td>
                      <select className="filter-select" value={d.category || 'Other'} onChange={e => updateDoc(d.id, { category: e.target.value })} style={{ fontSize: '0.8rem' }} aria-label={`Category for ${d.name}`}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td><InlineCell value={d.vendor} onSave={v => updateDoc(d.id, { vendor: v })} /></td>
                    <td><InlineCell value={d.url} type="url" onSave={v => updateDoc(d.id, { url: v })} /></td>
                    <td>{formatDate(d.dateAdded)}</td>
                    <td><InlineCell value={d.notes} onSave={v => updateDoc(d.id, { notes: v })} /></td>
                    <td><button type="button" className="btn-icon" aria-label={`Delete ${d.name}`} onClick={() => deleteDoc(d.id)}>🗑</button></td>
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
