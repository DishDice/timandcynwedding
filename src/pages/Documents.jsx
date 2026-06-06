import { useState, useEffect } from 'react'
import { api } from '../api'
import { useData } from '../DataContext'
import { Toast } from '../components/Toast'
import { PageShell, EmptyRow } from '../components/PageShell'
import { TableScrollHint } from '../components/TableScrollHint'

const CATEGORIES = ['Contract', 'Invoice', 'Inspiration', 'Legal', 'Other']

function InlineCell({ value, onSave, type = 'text' }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)
  useEffect(() => { setVal(value) }, [value])

  const save = () => {
    setEditing(false)
    if (val !== value) onSave(val)
  }

  if (!editing) {
    return (
      <span onClick={() => setEditing(true)} style={{ cursor: 'pointer', display: 'block' }}>
        {type === 'url' && value ? <a href={value} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>{value}</a> : (value || '—')}
      </span>
    )
  }

  return (
    <input className="inline-edit" value={val} autoFocus
      onChange={e => setVal(e.target.value)} onBlur={save}
      onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(value); setEditing(false) } }} />
  )
}

export default function Documents() {
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
                  <select className="filter-select" value={d.category} onChange={e => updateDoc(d.id, { category: e.target.value })} style={{ fontSize: '0.8rem' }} aria-label={`Category for ${d.name}`}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </td>
                <td><InlineCell value={d.vendor} onSave={v => updateDoc(d.id, { vendor: v })} /></td>
                <td><InlineCell value={d.url} type="url" onSave={v => updateDoc(d.id, { url: v })} /></td>
                <td>{d.dateAdded}</td>
                <td><InlineCell value={d.notes} onSave={v => updateDoc(d.id, { notes: v })} /></td>
                <td><button type="button" className="btn-icon" aria-label={`Delete ${d.name}`} onClick={() => deleteDoc(d.id)}>🗑</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Toast message={toast} onClose={() => setToast('')} />
    </PageShell>
  )
}
