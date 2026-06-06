import { useState, useEffect } from 'react'
import { api } from '../api'
import { useData } from '../DataContext'
import { Toast } from '../components/Toast'
import { PageShell } from '../components/PageShell'
import { TableScrollHint } from '../components/TableScrollHint'

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
      onChange={e => setVal(e.target.value)} onBlur={save}
      onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(value); setEditing(false) } }} />
  )
}

function formatWeddingDate(dateStr) {
  if (!dateStr) return 'Saturday 10 October 2026'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function DayTimeline() {
  const { config, timeline: entries, setTimeline: setEntries } = useData()
  const [toast, setToast] = useState('')

  const updateEntry = async (id, changes) => {
    let snapshot
    setEntries(prev => {
      snapshot = prev
      return prev.map(e => e.id === id ? { ...e, ...changes } : e)
    })
    try {
      await api.put(`/api/timeline/${id}`, changes)
    } catch {
      setEntries(snapshot)
      setToast('Failed to save')
    }
  }

  const addEntry = async () => {
    try {
      const e = await api.post('/api/timeline', { event: 'New event' })
      setEntries(prev => [...prev, e])
    } catch {
      setToast('Failed to add entry')
    }
  }

  const deleteEntry = async (id) => {
    if (!confirm('Delete this entry?')) return
    let snapshot
    setEntries(prev => {
      snapshot = prev
      return prev.filter(e => e.id !== id)
    })
    try {
      await api.del(`/api/timeline/${id}`)
    } catch {
      setEntries(snapshot)
      setToast('Failed to delete')
    }
  }

  const moveEntry = async (id, direction) => {
    const idx = entries.findIndex(e => e.id === id)
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= entries.length) return
    const snapshot = entries
    const reordered = [...entries]
    const [item] = reordered.splice(idx, 1)
    reordered.splice(newIdx, 0, item)
    setEntries(reordered)
    try {
      await api.put('/api/timeline/reorder/all', { ids: reordered.map(e => e.id) })
    } catch {
      setEntries(snapshot)
      setToast('Failed to reorder')
    }
  }

  return (
    <PageShell>
      <div className="page-header">
        <h2>Day Timeline</h2>
        <p>Wedding day run sheet — {formatWeddingDate(config?.weddingDate)}</p>
      </div>

      <div className="filter-bar">
        <button type="button" className="btn btn-primary" onClick={addEntry}>+ Add Entry</button>
      </div>

      <TableScrollHint />
      <div className="table-wrap table-wrap--scroll">
        <table className="data-table">
          <thead>
            <tr><th scope="col">Time</th><th scope="col">Event</th><th scope="col">Location</th><th scope="col">Responsible</th><th scope="col">Notes</th><th scope="col">Actions</th></tr>
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
                  <button type="button" className="btn btn-sm" onClick={() => moveEntry(e.id, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                  <button type="button" className="btn btn-sm" onClick={() => moveEntry(e.id, 1)} disabled={i === entries.length - 1} aria-label="Move down">↓</button>
                  <button type="button" className="btn-icon" style={{ opacity: 1 }} aria-label={`Delete ${e.event}`} onClick={() => deleteEntry(e.id)}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Toast message={toast} onClose={() => setToast('')} />
    </PageShell>
  )
}
