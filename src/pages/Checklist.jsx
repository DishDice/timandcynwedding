import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '../api'
import { DateInput } from '../components/DateInput'
import { AssignedPill } from '../components/StatusBadge'
import { Toast } from '../components/Toast'

function TableView({ tasks, onUpdate, onDelete, onAdd }) {
  const [newTask, setNewTask] = useState('')

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newTask.trim()) return
    onAdd(newTask.trim())
    setNewTask('')
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th></th><th>#</th><th>Task</th><th>Assigned</th><th>Due Date</th><th>Notes</th><th></th></tr>
        </thead>
        <tbody>
          {tasks.map((t, i) => (
            <tr key={t.id} className={t.done ? 'row-done' : ''}>
              <td><input type="checkbox" className="task-checkbox" checked={t.done} onChange={() => onUpdate(t.id, { done: !t.done })} /></td>
              <td>{i + 1}</td>
              <td>
                <input className={`inline-edit task-name ${t.done ? '' : ''}`} value={t.task}
                  onChange={e => onUpdate(t.id, { task: e.target.value }, true)}
                  onBlur={e => onUpdate(t.id, { task: e.target.value })} />
              </td>
              <td><AssignedPill value={t.assignedTo} onChange={v => onUpdate(t.id, { assignedTo: v })} /></td>
              <td><DateInput value={t.dueDate} onChange={v => onUpdate(t.id, { dueDate: v })} /></td>
              <td>
                <input className="inline-edit" value={t.notes || ''}
                  onChange={e => onUpdate(t.id, { notes: e.target.value }, true)}
                  onBlur={e => onUpdate(t.id, { notes: e.target.value })} />
              </td>
              <td><button className="btn-icon" onClick={() => onDelete(t.id)}>🗑</button></td>
            </tr>
          ))}
          <tr>
            <td colSpan={7} style={{ padding: '8px 12px' }}>
              <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8 }}>
                <input className="inline-edit" placeholder="Add task..." value={newTask} onChange={e => setNewTask(e.target.value)} style={{ flex: 1 }} />
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

  const overdue = tasks.filter(t => !t.done && t.dueDate && new Date(t.dueDate + 'T00:00:00') < now)
  const dueMonth = tasks.filter(t => {
    if (t.done || !t.dueDate) return false
    const d = new Date(t.dueDate + 'T00:00:00')
    return d >= now && d <= monthEnd
  })
  const upcoming = tasks.filter(t => {
    if (t.done || !t.dueDate) return false
    const d = new Date(t.dueDate + 'T00:00:00')
    return d > monthEnd
  })
  const noDue = tasks.filter(t => !t.done && !t.dueDate)
  const done = tasks.filter(t => t.done)

  const thisWeekEnd = new Date(now); thisWeekEnd.setDate(thisWeekEnd.getDate() + 7)
  const thisWeek = tasks.filter(t => {
    if (t.done || !t.dueDate) return false
    const d = new Date(t.dueDate + 'T00:00:00')
    return d >= now && d <= thisWeekEnd
  })

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
        <input type="checkbox" className="task-checkbox" checked={t.done} onChange={() => onUpdate(t.id, { done: !t.done })} />
        <span className="timeline-task">{t.task}</span>
        <AssignedPill value={t.assignedTo} onChange={v => onUpdate(t.id, { assignedTo: v })} />
        {t.dueDate && <DateInput value={t.dueDate} onChange={v => onUpdate(t.id, { dueDate: v })} />}
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
        <div className="card overdue"><div className="metric-value" style={{ color: '#C44' }}>{overdue.length}</div><div className="metric-label">Overdue</div></div>
        <div className="card due-month"><div className="metric-value" style={{ color: '#B8860B' }}>{dueMonth.length}</div><div className="metric-label">Due This Month</div></div>
        <div className="card"><div className="metric-value">{upcoming.length}</div><div className="metric-label">Upcoming</div></div>
      </div>

      <div className="timeline-legend">
        <div className="legend-item"><span className="legend-swatch" style={{ background: 'var(--color-red-bg)', border: '1px solid var(--color-red-border)' }} /> Overdue</div>
        <div className="legend-item"><span className="legend-swatch" style={{ background: 'var(--color-amber-bg)', border: '1px solid var(--color-amber-border)' }} /> Due within 14 days</div>
      </div>

      <Group title="Overdue" items={overdue} />
      <Group title="This Week" items={thisWeek.filter(t => !overdue.includes(t))} />
      <Group title="No Due Date" items={noDue} />
      <Group title="Upcoming" items={upcoming} />

      {done.length > 0 && (
        <div className="timeline-group">
          <div className="timeline-group-title" style={{ cursor: 'pointer' }} onClick={() => setDoneOpen(!doneOpen)}>
            Done ({done.length}) {doneOpen ? '▼' : '▶'}
          </div>
          {doneOpen && done.map(t => <TaskRow key={t.id} t={t} />)}
        </div>
      )}
    </div>
  )
}

export default function Checklist() {
  const [tasks, setTasks] = useState([])
  const [toast, setToast] = useState('')
  const [filterAssign, setFilterAssign] = useState(() => localStorage.getItem('checklist:assign') || 'All')
  const [filterStatus, setFilterStatus] = useState(() => localStorage.getItem('checklist:status') || 'All')
  const [view, setView] = useState(() => localStorage.getItem('checklist:view') || 'table')

  const load = useCallback(async () => {
    const data = await api.get('/api/checklist')
    setTasks(data)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => { localStorage.setItem('checklist:assign', filterAssign) }, [filterAssign])
  useEffect(() => { localStorage.setItem('checklist:status', filterStatus) }, [filterStatus])
  useEffect(() => { localStorage.setItem('checklist:view', view) }, [view])

  const updateItem = async (id, changes, optimisticOnly = false) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...changes } : t))
    if (optimisticOnly) return
    const prev = tasks
    try {
      await api.put(`/api/checklist/${id}`, changes)
    } catch {
      setTasks(prev)
      setToast('Failed to save')
    }
  }

  const deleteItem = async (id) => {
    if (!confirm('Delete this task?')) return
    setTasks(tasks.filter(t => t.id !== id))
    await api.del(`/api/checklist/${id}`)
  }

  const addTask = async (taskName) => {
    const t = await api.post('/api/checklist', { task: taskName })
    setTasks([...tasks, t])
  }

  const filtered = useMemo(() => tasks.filter(t => {
    if (filterAssign !== 'All' && t.assignedTo !== filterAssign) return false
    if (filterStatus === 'To do' && t.done) return false
    if (filterStatus === 'Done' && !t.done) return false
    return true
  }), [tasks, filterAssign, filterStatus])

  return (
    <div>
      <div className="page-header">
        <h2>Checklist</h2>
        <p>{tasks.filter(t => !t.done).length} tasks remaining</p>
      </div>

      <div className="filter-bar">
        <label>Assigned</label>
        <select className="filter-select" value={filterAssign} onChange={e => setFilterAssign(e.target.value)}>
          {['All', 'Tim', 'Cyn', 'Both'].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <label>Status</label>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          {['All', 'To do', 'Done'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="view-toggle">
          <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>Table</button>
          <button className={view === 'timeline' ? 'active' : ''} onClick={() => setView('timeline')}>Timeline</button>
        </div>
      </div>

      {view === 'table'
        ? <TableView tasks={filtered} onUpdate={updateItem} onDelete={deleteItem} onAdd={addTask} />
        : <TimelineView tasks={filtered} onUpdate={updateItem} />}
      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}
