import { useState, useEffect, useMemo } from 'react'
import { api } from '../api'
import { useData } from '../DataContext'
import { useCompactLayout } from '../hooks/useCompactLayout'
import { DateInput } from '../components/DateInput'
import { AssignedPill } from '../components/StatusBadge'
import { Toast } from '../components/Toast'
import { PageShell, EmptyRow } from '../components/PageShell'

function DraftInput({ value, onSave, className = 'inline-edit', multiline = false, placeholder = '' }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => { setDraft(value) }, [value])

  const save = () => { if (draft !== value) onSave(draft) }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { setDraft(value); e.target.blur() }
    if (!multiline && e.key === 'Enter') e.target.blur()
  }

  if (multiline) {
    return (
      <textarea
        className={`${className} draft-textarea`}
        value={draft}
        placeholder={placeholder}
        rows={2}
        onChange={e => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={onKeyDown}
      />
    )
  }

  return (
    <input
      className={className}
      value={draft}
      placeholder={placeholder}
      onChange={e => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={onKeyDown}
    />
  )
}

function CardView({ tasks, onUpdate, onDelete, onAdd }) {
  const [newTask, setNewTask] = useState('')

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newTask.trim()) return
    onAdd(newTask.trim())
    setNewTask('')
  }

  if (tasks.length === 0) {
    return (
      <div className="card-list">
        <p className="card-list-empty">No tasks match your filters.</p>
        <form className="task-card-add" onSubmit={handleAdd}>
          <textarea className="draft-textarea" placeholder="Add task..." value={newTask} rows={2} onChange={e => setNewTask(e.target.value)} />
          <button type="submit" className="btn btn-primary">Add task</button>
        </form>
      </div>
    )
  }

  return (
    <div className="card-list">
      {tasks.map((t, i) => (
        <div key={t.id} className={`task-card ${t.done ? 'row-done' : ''}`}>
          <div className="task-card-top">
            <input
              type="checkbox"
              className="task-checkbox"
              checked={t.done}
              aria-label={`Mark "${t.task}" as done`}
              onChange={() => onUpdate(t.id, { done: !t.done })}
            />
            <span className="task-card-num">#{i + 1}</span>
            <div className="task-card-meta">
              <AssignedPill value={t.assignedTo} onChange={v => onUpdate(t.id, { assignedTo: v })} />
              <DateInput value={t.dueDate} onChange={v => onUpdate(t.id, { dueDate: v })} />
            </div>
            <button type="button" className="btn-icon task-card-delete" aria-label={`Delete task ${t.task}`} onClick={() => onDelete(t.id)}>🗑</button>
          </div>
          <DraftInput
            value={t.task}
            className="inline-edit task-name"
            multiline
            onSave={v => onUpdate(t.id, { task: v })}
          />
          <DraftInput
            value={t.notes || ''}
            className="inline-edit task-notes"
            multiline
            placeholder="Notes"
            onSave={v => onUpdate(t.id, { notes: v })}
          />
        </div>
      ))}
      <form className="task-card-add" onSubmit={handleAdd}>
        <textarea className="draft-textarea" placeholder="Add task..." value={newTask} rows={2} onChange={e => setNewTask(e.target.value)} />
        <button type="submit" className="btn btn-primary">Add task</button>
      </form>
    </div>
  )
}

function TableView({ tasks, onUpdate, onDelete, onAdd }) {
  const [newTask, setNewTask] = useState('')

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newTask.trim()) return
    onAdd(newTask.trim())
    setNewTask('')
  }

  return (
    <div className="table-wrap table-wrap--scroll">
      <table className="data-table checklist-table">
        <thead>
          <tr>
            <th scope="col" className="col-check"></th>
            <th scope="col" className="col-num">#</th>
            <th scope="col" className="col-task">Task</th>
            <th scope="col" className="col-assign">Assigned</th>
            <th scope="col" className="col-date">Due Date</th>
            <th scope="col" className="col-notes">Notes</th>
            <th scope="col" className="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 && <EmptyRow colSpan={7} message="No tasks match your filters." />}
          {tasks.map((t, i) => (
            <tr key={t.id} className={t.done ? 'row-done' : ''}>
              <td className="col-check"><input type="checkbox" className="task-checkbox" checked={t.done} aria-label={`Mark "${t.task}" as done`} onChange={() => onUpdate(t.id, { done: !t.done })} /></td>
              <td className="col-num">{i + 1}</td>
              <td className="col-task"><DraftInput value={t.task} className="inline-edit task-name" multiline onSave={v => onUpdate(t.id, { task: v })} /></td>
              <td className="col-assign"><AssignedPill value={t.assignedTo} onChange={v => onUpdate(t.id, { assignedTo: v })} /></td>
              <td className="col-date"><DateInput value={t.dueDate} onChange={v => onUpdate(t.id, { dueDate: v })} /></td>
              <td className="col-notes"><DraftInput value={t.notes || ''} className="inline-edit" multiline placeholder="Notes" onSave={v => onUpdate(t.id, { notes: v })} /></td>
              <td className="col-actions"><button type="button" className="btn-icon" aria-label={`Delete task ${t.task}`} onClick={() => onDelete(t.id)}>🗑</button></td>
            </tr>
          ))}
          <tr className="add-row">
            <td colSpan={7}>
              <form className="add-row-form" onSubmit={handleAdd}>
                <textarea className="draft-textarea" placeholder="Add task..." value={newTask} rows={2} onChange={e => setNewTask(e.target.value)} />
                <button type="submit" className="btn btn-sm btn-primary">Add</button>
              </form>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function TimelineView({ tasks, onUpdate }) {
  const [doneOpen, setDoneOpen] = useState(false)
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const in14 = new Date(); in14.setDate(in14.getDate() + 14)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const thisWeekEnd = new Date(now); thisWeekEnd.setDate(thisWeekEnd.getDate() + 7)

  const overdue = tasks.filter(t => !t.done && t.dueDate && new Date(t.dueDate + 'T00:00:00') < now)
  const thisWeek = tasks.filter(t => {
    if (t.done || !t.dueDate) return false
    const d = new Date(t.dueDate + 'T00:00:00')
    return d >= now && d <= thisWeekEnd
  })
  const restOfMonth = tasks.filter(t => {
    if (t.done || !t.dueDate) return false
    const d = new Date(t.dueDate + 'T00:00:00')
    return d > thisWeekEnd && d <= monthEnd
  })
  const upcoming = tasks.filter(t => {
    if (t.done || !t.dueDate) return false
    const d = new Date(t.dueDate + 'T00:00:00')
    return d > monthEnd
  })
  const dueMonth = [...thisWeek, ...restOfMonth]
  const noDue = tasks.filter(t => !t.done && !t.dueDate)
  const done = tasks.filter(t => t.done)

  function rowClass(t) {
    if (t.done) return 'done'
    if (!t.dueDate) return ''
    const d = new Date(t.dueDate + 'T00:00:00')
    if (d < now) return 'overdue'
    if (d <= in14) return 'due-soon'
    return ''
  }

  function TaskRow({ t }) {
    return (
      <div className={`timeline-row ${rowClass(t)}`}>
        <div className="timeline-row-main">
          <input type="checkbox" className="task-checkbox" checked={t.done} aria-label={`Mark "${t.task}" as done`} onChange={() => onUpdate(t.id, { done: !t.done })} />
          <DraftInput
            value={t.task}
            className="inline-edit timeline-task"
            multiline
            onSave={v => onUpdate(t.id, { task: v })}
          />
        </div>
        <div className="timeline-row-meta">
          <AssignedPill value={t.assignedTo} onChange={v => onUpdate(t.id, { assignedTo: v })} />
          <DateInput value={t.dueDate} onChange={v => onUpdate(t.id, { dueDate: v })} />
        </div>
      </div>
    )
  }

  function Group({ title, items }) {
    if (!items.length) return null
    return (
      <div className="timeline-group">
        <div className="timeline-group-title">{title} ({items.length})</div>
        {items.map(t => <TaskRow key={t.id} t={t} />)}
      </div>
    )
  }

  return (
    <div>
      <div className="timeline-summary">
        <div className="card overdue"><div className="metric-value" style={{ color: 'var(--color-danger)' }}>{overdue.length}</div><div className="metric-label">Overdue</div></div>
        <div className="card due-month"><div className="metric-value" style={{ color: 'var(--color-warning)' }}>{dueMonth.length}</div><div className="metric-label">Due This Month</div></div>
        <div className="card"><div className="metric-value">{upcoming.length}</div><div className="metric-label">Upcoming</div></div>
      </div>

      <div className="timeline-legend">
        <div className="legend-item"><span className="legend-swatch" style={{ background: 'var(--color-red-bg)', border: '1px solid var(--color-red-border)' }} /> Overdue</div>
        <div className="legend-item"><span className="legend-swatch" style={{ background: 'var(--color-amber-bg)', border: '1px solid var(--color-amber-border)' }} /> Due within 14 days</div>
      </div>

      <Group title="Overdue" items={overdue} />
      <Group title="This Week" items={thisWeek} />
      <Group title="Rest of Month" items={restOfMonth} />
      <Group title="Upcoming" items={upcoming} />
      <Group title="No Due Date" items={noDue} />

      {done.length > 0 && (
        <div className="timeline-group">
          <button type="button" className="timeline-group-title timeline-group-toggle" onClick={() => setDoneOpen(!doneOpen)}>
            Done ({done.length}) {doneOpen ? '▼' : '▶'}
          </button>
          {doneOpen && done.map(t => <TaskRow key={t.id} t={t} />)}
        </div>
      )}
    </div>
  )
}

export default function Checklist() {
  const compact = useCompactLayout(1100)
  const { checklist: tasks, setChecklist: setTasks } = useData()
  const [toast, setToast] = useState('')
  const [filterAssign, setFilterAssign] = useState(() => localStorage.getItem('checklist:assign') || 'All')
  const [filterStatus, setFilterStatus] = useState(() => localStorage.getItem('checklist:status') || 'All')
  const [view, setView] = useState(() => localStorage.getItem('checklist:view') || 'table')

  useEffect(() => { localStorage.setItem('checklist:assign', filterAssign) }, [filterAssign])
  useEffect(() => { localStorage.setItem('checklist:status', filterStatus) }, [filterStatus])
  useEffect(() => { localStorage.setItem('checklist:view', view) }, [view])

  const updateItem = async (id, changes) => {
    let snapshot
    setTasks(prev => {
      snapshot = prev
      return prev.map(t => t.id === id ? { ...t, ...changes } : t)
    })
    try {
      await api.put(`/api/checklist/${id}`, changes)
    } catch {
      setTasks(snapshot)
      setToast('Failed to save')
    }
  }

  const deleteItem = async (id) => {
    if (!confirm('Delete this task?')) return
    let snapshot
    setTasks(prev => {
      snapshot = prev
      return prev.filter(t => t.id !== id)
    })
    try {
      await api.del(`/api/checklist/${id}`)
    } catch {
      setTasks(snapshot)
      setToast('Failed to delete')
    }
  }

  const addTask = async (taskName) => {
    try {
      const t = await api.post('/api/checklist', { task: taskName })
      setTasks(prev => [...prev, t])
    } catch {
      setToast('Failed to add task')
    }
  }

  const filtered = useMemo(() => tasks.filter(t => {
    if (filterAssign !== 'All' && t.assignedTo !== filterAssign) return false
    if (filterStatus === 'To do' && t.done) return false
    if (filterStatus === 'Done' && !t.done) return false
    return true
  }), [tasks, filterAssign, filterStatus])

  const showCards = compact && view === 'table'

  return (
    <PageShell>
      <div className="page-header">
        <h2>Checklist</h2>
        <p>{tasks.filter(t => !t.done).length} tasks remaining</p>
      </div>

      <div className="filter-bar">
        <label htmlFor="checklist-assign">Assigned</label>
        <select id="checklist-assign" className="filter-select" value={filterAssign} onChange={e => setFilterAssign(e.target.value)}>
          {['All', 'Tim', 'Cyn', 'Both'].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <label htmlFor="checklist-status">Status</label>
        <select id="checklist-status" className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          {['All', 'To do', 'Done'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="view-toggle" role="group" aria-label="View mode">
          <button type="button" className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>Table</button>
          <button type="button" className={view === 'timeline' ? 'active' : ''} onClick={() => setView('timeline')}>Timeline</button>
        </div>
      </div>

      {view === 'timeline' && <TimelineView tasks={filtered} onUpdate={updateItem} />}
      {view === 'table' && showCards && <CardView tasks={filtered} onUpdate={updateItem} onDelete={deleteItem} onAdd={addTask} />}
      {view === 'table' && !showCards && <TableView tasks={filtered} onUpdate={updateItem} onDelete={deleteItem} onAdd={addTask} />}
      <Toast message={toast} onClose={() => setToast('')} />
    </PageShell>
  )
}
