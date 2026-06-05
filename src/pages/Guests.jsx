import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import { StatusBadge } from '../components/StatusBadge'
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

export default function Guests() {
  const [guests, setGuests] = useState([])
  const [filterGroup, setFilterGroup] = useState('All')
  const [filterRsvp, setFilterRsvp] = useState('All')
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    const data = await api.get('/api/guests')
    setGuests(data)
  }, [])

  useEffect(() => { load() }, [load])

  const updateGuest = async (id, changes) => {
    const prev = guests
    setGuests(guests.map(g => g.id === id ? { ...g, ...changes } : g))
    try {
      await api.put(`/api/guests/${id}`, changes)
    } catch {
      setGuests(prev)
      setToast('Failed to save')
    }
  }

  const addGuest = async () => {
    const g = await api.post('/api/guests', { name: 'New Guest' })
    setGuests([...guests, g])
  }

  const deleteGuest = async (id) => {
    if (!confirm('Delete this guest?')) return
    setGuests(guests.filter(g => g.id !== id))
    await api.del(`/api/guests/${id}`)
  }

  const exportCsv = () => {
    const headers = ['Name', 'Group', 'RSVP', 'Dietary', 'Table', 'Notes']
    const rows = filtered.map(g => [g.name, g.group, g.rsvp, g.dietary, g.tableNumber, g.notes])
    const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'guests.csv'
    a.click()
  }

  const groups = ['All', 'Tim Family', 'Tim Friends', 'Cyn Family', 'Cyn Friends']
  const filtered = guests.filter(g => {
    if (filterGroup !== 'All' && g.group !== filterGroup) return false
    if (filterRsvp !== 'All' && g.rsvp !== filterRsvp.toLowerCase()) return false
    return true
  })

  const total = guests.length
  const confirmed = guests.filter(g => g.rsvp === 'confirmed').length
  const declined = guests.filter(g => g.rsvp === 'declined').length
  const pending = guests.filter(g => g.rsvp === 'pending').length

  return (
    <div>
      <div className="page-header">
        <h2>Guests</h2>
        <p>{total} guests invited</p>
      </div>

      <div className="summary-bar">
        <div className="summary-item"><strong>{total}</strong>Total Invited</div>
        <div className="summary-item"><strong>{confirmed}</strong>Confirmed</div>
        <div className="summary-item"><strong>{declined}</strong>Declined</div>
        <div className="summary-item"><strong>{pending}</strong>Pending</div>
      </div>

      <div className="filter-bar">
        <label>Group</label>
        <select className="filter-select" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
          {groups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <label>RSVP</label>
        <select className="filter-select" value={filterRsvp} onChange={e => setFilterRsvp(e.target.value)}>
          {['All', 'Pending', 'Confirmed', 'Declined'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button className="btn btn-primary" onClick={addGuest}>+ Add Guest</button>
        <button className="btn" onClick={exportCsv}>Export CSV</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Group</th><th>RSVP</th><th>Dietary</th><th>Table</th><th>Notes</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map(g => (
              <tr key={g.id}>
                <td><InlineCell value={g.name} onSave={v => updateGuest(g.id, { name: v })} /></td>
                <td>
                  <select className="filter-select" value={g.group} onChange={e => updateGuest(g.id, { group: e.target.value })} style={{ fontSize: '0.8rem' }}>
                    {groups.slice(1).map(grp => <option key={grp} value={grp}>{grp}</option>)}
                  </select>
                </td>
                <td><StatusBadge value={g.rsvp} type="rsvp" onChange={v => updateGuest(g.id, { rsvp: v })} /></td>
                <td><InlineCell value={g.dietary} onSave={v => updateGuest(g.id, { dietary: v })} /></td>
                <td><InlineCell value={g.tableNumber} onSave={v => updateGuest(g.id, { tableNumber: v })} /></td>
                <td><InlineCell value={g.notes} onSave={v => updateGuest(g.id, { notes: v })} /></td>
                <td><button className="btn-icon" onClick={() => deleteGuest(g.id)}>🗑</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}
