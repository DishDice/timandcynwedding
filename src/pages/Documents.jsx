import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import { Toast } from '../components/Toast'

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
      onChange={e => setVal(e.target.value)} onBlur={save} onKeyDown={e => e.key === 'Enter' && save()} />
  )
}

export default function Documents() {
  const [documents, setDocuments] = useState([])
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    const data = await api.get('/api/documents')
    setDocuments(data)
  }, [])

  useEffect(() => { load() }, [load])

  const updateDoc = async (id, changes) => {
    const prev = documents
    setDocuments(documents.map(d => d.id === id ? { ...d, ...changes } : d))
    try {
      await api.put(`/api/documents/${id}`, changes)
    } catch {
      setDocuments(prev)
      setToast('Failed to save')
    }
  }

  const addDoc = async () => {
    const d = await api.post('/api/documents', { name: 'New Document' })
    setDocuments([d, ...documents])
  }

  const deleteDoc = async (id) => {
    if (!confirm('Delete this document?')) return
    setDocuments(documents.filter(d => d.id !== id))
    await api.del(`/api/documents/${id}`)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Documents</h2>
        <p>Track contracts, invoices, and inspiration links</p>
      </div>

      <div className="filter-bar">
        <button className="btn btn-primary" onClick={addDoc}>+ Add Document</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Category</th><th>Vendor</th><th>URL</th><th>Date Added</th><th>Notes</th><th></th></tr>
          </thead>
          <tbody>
            {documents.map(d => (
              <tr key={d.id}>
                <td><InlineCell value={d.name} onSave={v => updateDoc(d.id, { name: v })} /></td>
                <td>
                  <select className="filter-select" value={d.category} onChange={e => updateDoc(d.id, { category: e.target.value })} style={{ fontSize: '0.8rem' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </td>
                <td><InlineCell value={d.vendor} onSave={v => updateDoc(d.id, { vendor: v })} /></td>
                <td><InlineCell value={d.url} type="url" onSave={v => updateDoc(d.id, { url: v })} /></td>
                <td>{d.dateAdded}</td>
                <td><InlineCell value={d.notes} onSave={v => updateDoc(d.id, { notes: v })} /></td>
                <td><button className="btn-icon" onClick={() => deleteDoc(d.id)}>🗑</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}
