import { useState, useEffect } from 'react'
import { api } from '../api'
import { useData } from '../DataContext'
import { useCompactLayout } from '../hooks/useCompactLayout'
import { StatusBadge } from '../components/StatusBadge'
import { Toast } from '../components/Toast'
import { PageShell, EmptyRow } from '../components/PageShell'
import { TableScrollHint } from '../components/TableScrollHint'

const DEFAULT_GROUPS = ['Tim Family', 'Tim Friends', 'Cyn Family', 'Cyn Friends']
const INVITE_TYPES = [
  { value: '', label: '—' },
  { value: 'digital', label: 'Digital' },
  { value: 'physical', label: 'Physical' },
]

function InlineCell({ value, onSave }) {
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
        className="cell-text editable-cell"
        onClick={() => setEditing(true)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(true) } }}
        role="button"
        tabIndex={0}
      >
        {safeValue !== '' ? safeValue : '—'}
      </span>
    )
  }

  return (
    <input className="inline-edit" value={val} autoFocus
      onChange={e => setVal(e.target.value)} onBlur={save}
      onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(safeValue); setEditing(false) } }} />
  )
}

function GuestCardList({ guests, assignableGroups, onUpdate, onDelete }) {
  if (guests.length === 0) {
    return <p className="card-list-empty">No guests match your filters.</p>
  }
  return (
    <div className="card-list">
      {guests.map(g => (
        <div key={g.id} className="data-card">
          <div className="data-card-header">
            <div className="data-card-title">
              <InlineCell value={g.name} onSave={v => onUpdate(g.id, { name: v })} />
            </div>
            <div className="data-card-actions">
              <StatusBadge value={g.rsvp} type="rsvp" onChange={v => onUpdate(g.id, { rsvp: v })} />
              <button type="button" className="btn-icon" aria-label={`Delete ${g.name}`} onClick={() => onDelete(g.id)}>🗑</button>
            </div>
          </div>
          <div className="data-card-grid">
            <div className="data-card-field">
              <span className="data-card-label">Group</span>
              <div className="data-card-value">
                <select
                  className="filter-select"
                  value={g.group || ''}
                  onChange={e => onUpdate(g.id, { group: e.target.value })}
                  aria-label={`Group for ${g.name}`}
                >
                  {assignableGroups.map(grp => <option key={grp} value={grp}>{grp}</option>)}
                </select>
              </div>
            </div>
            <div className="data-card-field">
              <span className="data-card-label">Invite</span>
              <div className="data-card-value">
                <select
                  className="filter-select"
                  value={g.inviteType || ''}
                  onChange={e => onUpdate(g.id, { inviteType: e.target.value })}
                  aria-label={`Invite type for ${g.name}`}
                >
                  {INVITE_TYPES.map(t => <option key={t.value || 'unset'} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="data-card-field">
              <span className="data-card-label">Table</span>
              <div className="data-card-value">
                <InlineCell value={g.tableNumber} onSave={v => onUpdate(g.id, { tableNumber: v })} />
              </div>
            </div>
            <div className="data-card-field">
              <span className="data-card-label">Dietary</span>
              <div className="data-card-value">
                <InlineCell value={g.dietary} onSave={v => onUpdate(g.id, { dietary: v })} />
              </div>
            </div>
            <div className="data-card-field data-card-field--full">
              <span className="data-card-label">Notes</span>
              <div className="data-card-value">
                <InlineCell value={g.notes} onSave={v => onUpdate(g.id, { notes: v })} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Guests() {
  const compact = useCompactLayout(900)
  const { guests, setGuests } = useData()
  const [filterGroup, setFilterGroup] = useState(() => localStorage.getItem('guests:group') || 'All')
  const [filterRsvp, setFilterRsvp] = useState(() => localStorage.getItem('guests:rsvp') || 'All')
  const [toast, setToast] = useState('')

  useEffect(() => { localStorage.setItem('guests:group', filterGroup) }, [filterGroup])
  useEffect(() => { localStorage.setItem('guests:rsvp', filterRsvp) }, [filterRsvp])

  const updateGuest = async (id, changes) => {
    let snapshot
    setGuests(prev => {
      snapshot = prev
      return prev.map(g => g.id === id ? { ...g, ...changes } : g)
    })
    try {
      await api.put(`/api/guests/${id}`, changes)
    } catch {
      setGuests(snapshot)
      setToast('Failed to save')
    }
  }

  const addGuest = async () => {
    try {
      const g = await api.post('/api/guests', { name: 'New Guest' })
      setGuests(prev => [...prev, g])
    } catch {
      setToast('Failed to add guest')
    }
  }

  const deleteGuest = async (id) => {
    if (!confirm('Delete this guest?')) return
    let snapshot
    setGuests(prev => {
      snapshot = prev
      return prev.filter(g => g.id !== id)
    })
    try {
      await api.del(`/api/guests/${id}`)
    } catch {
      setGuests(snapshot)
      setToast('Failed to delete')
    }
  }

  const exportCsv = () => {
    const headers = ['Name', 'Group', 'RSVP', 'Invite', 'Dietary', 'Table', 'Notes']
    const rows = filtered.map(g => [g.name, g.group, g.rsvp, g.inviteType, g.dietary, g.tableNumber, g.notes])
    const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'guests.csv'
    a.click()
  }

  const allGroups = ['All', ...new Set([...DEFAULT_GROUPS, ...guests.map(g => g.group).filter(Boolean)])]
  const assignableGroups = [...new Set([...DEFAULT_GROUPS, ...guests.map(g => g.group).filter(Boolean)])]

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
    <PageShell>
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
        <label htmlFor="guests-group">Group</label>
        <select id="guests-group" className="filter-select" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
          {allGroups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <label htmlFor="guests-rsvp">RSVP</label>
        <select id="guests-rsvp" className="filter-select" value={filterRsvp} onChange={e => setFilterRsvp(e.target.value)}>
          {['All', 'Pending', 'Confirmed', 'Declined'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button type="button" className="btn btn-primary" onClick={addGuest}>+ Add Guest</button>
        <button type="button" className="btn" onClick={exportCsv}>Export CSV</button>
      </div>

      {compact ? (
        <GuestCardList
          guests={filtered}
          assignableGroups={assignableGroups}
          onUpdate={updateGuest}
          onDelete={deleteGuest}
        />
      ) : (
        <>
          <TableScrollHint />
          <div className="table-wrap table-wrap--scroll">
            <table className="data-table guests-table">
              <thead>
                <tr><th scope="col">Name</th><th scope="col">Group</th><th scope="col">RSVP</th><th scope="col">Invite</th><th scope="col">Dietary</th><th scope="col">Table</th><th scope="col">Notes</th><th scope="col"></th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <EmptyRow colSpan={8} />}
                {filtered.map(g => (
                  <tr key={g.id}>
                    <td><InlineCell value={g.name} onSave={v => updateGuest(g.id, { name: v })} /></td>
                    <td>
                      <select className="filter-select" value={g.group || ''} onChange={e => updateGuest(g.id, { group: e.target.value })} style={{ fontSize: '0.8rem' }} aria-label={`Group for ${g.name}`}>
                        {assignableGroups.map(grp => <option key={grp} value={grp}>{grp}</option>)}
                      </select>
                    </td>
                    <td><StatusBadge value={g.rsvp} type="rsvp" onChange={v => updateGuest(g.id, { rsvp: v })} /></td>
                    <td>
                      <select
                        className="filter-select"
                        value={g.inviteType || ''}
                        onChange={e => updateGuest(g.id, { inviteType: e.target.value })}
                        style={{ fontSize: '0.8rem' }}
                        aria-label={`Invite type for ${g.name}`}
                      >
                        {INVITE_TYPES.map(t => <option key={t.value || 'unset'} value={t.value}>{t.label}</option>)}
                      </select>
                    </td>
                    <td><InlineCell value={g.dietary} onSave={v => updateGuest(g.id, { dietary: v })} /></td>
                    <td><InlineCell value={g.tableNumber} onSave={v => updateGuest(g.id, { tableNumber: v })} /></td>
                    <td><InlineCell value={g.notes} onSave={v => updateGuest(g.id, { notes: v })} /></td>
                    <td><button type="button" className="btn-icon" aria-label={`Delete ${g.name}`} onClick={() => deleteGuest(g.id)}>🗑</button></td>
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
