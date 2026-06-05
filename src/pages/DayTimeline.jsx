import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import { Toast } from '../components/Toast'

function InlineCell({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)
  useEffect(() => { setVal(value) }, [value])

  const save = () => {
    setEditing(false)
    if (val !== value) onSave(val)
  }

  if (!editing) {
    return <span onClick={() => setEditing(true)} style={{ cursor: 'pointer', display: 'block' }}>{value || '—'}</span>
  }

  return (
    <input className="inline-edit" value={val} autoFocus
      onChange={e => setVal(e.target.value)} onBlur={save} onKeyDown={e => e.key === 'Enter' && save()} />
  )
}

export default function DayTimeline() {
  const [entries, setEntries] = useState([])
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    const data = await api.get('/api/timeline')
    setEntries(data)
  }, [])

  useEffect(() => { load() }, [load])

  const updateEntry = async (id, changes) => {
    const prev = entries
    setEntries(entries.map(e => e.id === id ? { ...e, ...changes } : e))
    try {
      await api.put(`/api/timeline/${id}`, changes)
    } catch {
      setEntries(prev)
      setToast('Failed to save')
    }
  }

  const addEntry = async () => {
    const e = await api.post('/api/timeline', { event: 'New event' })
    setEntries([...entries, e])
  }

  const deleteEntry = async (id) => {
    if (!confirm('Delete this entry?')) return
    setEntries(entries.filter(e => e.id !== id))
    await api.del(`/api/timeline/${id}`)
  }

  const moveEntry = async (id, direction) => {
    const idx = entries.findIndex(e => e.id === id)
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= entries.length) return
    const reordered = [...entries]
    const [item] = reordered.splice(idx, 1)
    reordered.splice(newIdx, 0, item)
    setEntries(reordered)
    await api.put('/api/timeline/reorder/all', { ids: reordered.map(e => e.id) })
  }

  return (
    <div>
      <div className="page-header">
        <h2>Day Timeline</h2>
        <p>Wedding day run sheet — Saturday 10 October 2026</p>
      </div>

      <div className="filter-bar">
        <button className="btn btn-primary" onClick={addEntry}>+ Add Entry</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Time</th><th>Event</th><th>Location</th><th>Responsible</th><th>Notes</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.id}>
                <td><InlineCell value={e.time} onSave={v => updateEntry(e.id, { time: v })} /></td>
                <td><InlineCell value={e.event} onSave={v => updateEntry(e.id, { event: v })} /></td>
                <td><InlineCell value={e.location} onSave={v => updateEntry(e.id, { location: v })} /></td>
                <td><InlineCell value={e.responsible} onSave={v => updateEntry(e.id, { responsible: v })} /></td>
                <td><InlineCell value={e.notes} onSave={v => updateEntry(e.id, { notes: v })} /></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn-sm" onClick={() => moveEntry(e.id, -1)} disabled={i === 0}>↑</button>
                  <button className="btn btn-sm" onClick={() => moveEntry(e.id, 1)} disabled={i === entries.length - 1}>↓</button>
                  <button className="btn-icon" style={{ opacity: 1 }} onClick={() => deleteEntry(e.id)}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}
