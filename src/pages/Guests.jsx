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

const DEFAULT_COLUMN_ORDER = [
  'name', 'group', 'rsvp', 'inviteType', 'inviteSent', 'address', 'dietary', 'tableNumber', 'notes',
]

const COLUMN_LABELS = {
  name: 'Name',
  group: 'Group',
  rsvp: 'RSVP',
  inviteType: 'Invite',
  inviteSent: 'Invite Sent',
  address: 'Address',
  dietary: 'Dietary',
  tableNumber: 'Table',
  notes: 'Notes',
}

function loadColumnOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem('guests:columnOrder'))
    if (!Array.isArray(saved)) return DEFAULT_COLUMN_ORDER
    const valid = saved.filter(id => DEFAULT_COLUMN_ORDER.includes(id))
    const missing = DEFAULT_COLUMN_ORDER.filter(id => !valid.includes(id))
    return [...valid, ...missing]
  } catch {
    return DEFAULT_COLUMN_ORDER
  }
}

function InlineCell({ value, onSave, multiline = false }) {
  const safeValue = value ?? ''
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(safeValue)
  useEffect(() => { setVal(value ?? '') }, [value])

  const save = () => {
    setEditing(false)
    if (val !== value) onSave(val)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { setVal(value ?? ''); setEditing(false) }
    if (!multiline && e.key === 'Enter') e.target.blur()
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

  if (multiline) {
    return (
      <textarea
        className="inline-edit draft-textarea"
        value={val}
        rows={2}
        autoFocus
        onChange={e => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={onKeyDown}
      />
    )
  }

  return (
    <input className="inline-edit" value={val} autoFocus
      onChange={e => setVal(e.target.value)} onBlur={save}
      onKeyDown={onKeyDown} />
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
              <span className="data-card-label">Invite Sent</span>
              <div className="data-card-value">
                <input
                  type="checkbox"
                  className="task-checkbox"
                  checked={!!g.inviteSent}
                  aria-label={`Invite sent for ${g.name}`}
                  onChange={() => onUpdate(g.id, { inviteSent: !g.inviteSent })}
                />
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
              <span className="data-card-label">Address</span>
              <div className="data-card-value">
                <InlineCell value={g.address} multiline onSave={v => onUpdate(g.id, { address: v })} />
              </div>
            </div>
            <div className="data-card-field data-card-field--full">
              <span className="data-card-label">Notes</span>
              <div className="data-card-value">
                <InlineCell value={g.notes} multiline onSave={v => onUpdate(g.id, { notes: v })} />
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
  const [columnOrder, setColumnOrder] = useState(loadColumnOrder)
  const [dragCol, setDragCol] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => { localStorage.setItem('guests:group', filterGroup) }, [filterGroup])
  useEffect(() => { localStorage.setItem('guests:rsvp', filterRsvp) }, [filterRsvp])
  useEffect(() => { localStorage.setItem('guests:columnOrder', JSON.stringify(columnOrder)) }, [columnOrder])

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

  const exportCsv = () => {
    const headers = columnOrder.map(id => COLUMN_LABELS[id])
    const rows = filtered.map(g => columnOrder.map(id => {
      if (id === 'inviteType') return g.inviteType || ''
      if (id === 'inviteSent') return g.inviteSent ? 'Yes' : 'No'
      return g[id] || ''
    }))
    const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'guests.csv'
    a.click()
  }

  const handleColumnDrop = (targetId) => {
    if (!dragCol || dragCol === targetId) return
    setColumnOrder(prev => {
      const next = [...prev]
      const from = next.indexOf(dragCol)
      const to = next.indexOf(targetId)
      if (from === -1 || to === -1) return prev
      next.splice(from, 1)
      next.splice(to, 0, dragCol)
      return next
    })
    setDragCol(null)
  }

  const renderCell = (colId, g) => {
    switch (colId) {
      case 'name':
        return <InlineCell value={g.name} onSave={v => updateGuest(g.id, { name: v })} />
      case 'group':
        return (
          <select className="filter-select" value={g.group || ''} onChange={e => updateGuest(g.id, { group: e.target.value })} style={{ fontSize: '0.8rem' }} aria-label={`Group for ${g.name}`}>
            {assignableGroups.map(grp => <option key={grp} value={grp}>{grp}</option>)}
          </select>
        )
      case 'rsvp':
        return <StatusBadge value={g.rsvp} type="rsvp" onChange={v => updateGuest(g.id, { rsvp: v })} />
      case 'inviteType':
        return (
          <select
            className="filter-select"
            value={g.inviteType || ''}
            onChange={e => updateGuest(g.id, { inviteType: e.target.value })}
            style={{ fontSize: '0.8rem' }}
            aria-label={`Invite type for ${g.name}`}
          >
            {INVITE_TYPES.map(t => <option key={t.value || 'unset'} value={t.value}>{t.label}</option>)}
          </select>
        )
      case 'inviteSent':
        return (
          <input
            type="checkbox"
            className="task-checkbox"
            checked={!!g.inviteSent}
            aria-label={`Invite sent for ${g.name}`}
            onChange={() => updateGuest(g.id, { inviteSent: !g.inviteSent })}
          />
        )
      case 'address':
        return <InlineCell value={g.address} multiline onSave={v => updateGuest(g.id, { address: v })} />
      case 'dietary':
        return <InlineCell value={g.dietary} onSave={v => updateGuest(g.id, { dietary: v })} />
      case 'tableNumber':
        return <InlineCell value={g.tableNumber} onSave={v => updateGuest(g.id, { tableNumber: v })} />
      case 'notes':
        return <InlineCell value={g.notes} multiline onSave={v => updateGuest(g.id, { notes: v })} />
      default:
        return null
    }
  }

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
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>
            Drag column headers to rearrange
          </p>
          <TableScrollHint />
          <div className="table-wrap table-wrap--scroll">
            <table className="data-table guests-table">
              <thead>
                <tr>
                  {columnOrder.map(colId => (
                    <th
                      key={colId}
                      scope="col"
                      className={`th-draggable ${dragCol === colId ? 'th-dragging' : ''} ${colId === 'inviteSent' ? 'col-check' : ''}`}
                      draggable
                      onDragStart={() => setDragCol(colId)}
                      onDragEnd={() => setDragCol(null)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleColumnDrop(colId)}
                    >
                      <span className="th-draggable-label">{COLUMN_LABELS[colId]}</span>
                    </th>
                  ))}
                  <th scope="col" className="col-actions"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <EmptyRow colSpan={columnOrder.length + 1} />}
                {filtered.map(g => (
                  <tr key={g.id}>
                    {columnOrder.map(colId => (
                      <td key={colId} className={colId === 'address' ? 'col-address' : colId === 'inviteSent' ? 'col-check' : undefined}>{renderCell(colId, g)}</td>
                    ))}
                    <td className="col-actions">
                      <button type="button" className="btn-icon" aria-label={`Delete ${g.name}`} onClick={() => deleteGuest(g.id)}>🗑</button>
                    </td>
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
