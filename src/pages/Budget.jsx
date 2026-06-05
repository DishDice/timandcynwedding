import { useState, useEffect, useCallback, Fragment } from 'react'
import { api } from '../api'
import { DateInput } from '../components/DateInput'
import { StatusBadge } from '../components/StatusBadge'
import { Toast } from '../components/Toast'

function rowClass(item) {
  if (!item.dueDate) return ''
  const due = new Date(item.dueDate + 'T00:00:00')
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const in14 = new Date(); in14.setDate(in14.getDate() + 14)
  const outstanding = (Number(item.actual) || 0) - (Number(item.paid) || 0)
  if (due < now && outstanding > 0) return 'row-red'
  if (due <= in14) return 'row-amber'
  return ''
}

function InlineCell({ value, onSave, type = 'text', className = '' }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)

  useEffect(() => { setVal(value) }, [value])

  const save = () => {
    setEditing(false)
    const final = type === 'number' ? Number(val) || 0 : val
    if (final !== value) onSave(final)
  }

  if (!editing) {
    return (
      <span className={className} onClick={() => setEditing(true)} style={{ cursor: 'pointer', display: 'block', minHeight: 20 }}>
        {type === 'number' ? `$${Number(value || 0).toLocaleString()}` : (value || '—')}
      </span>
    )
  }

  return (
    <input
      className={`inline-edit ${type === 'number' ? 'inline-edit-num' : ''}`}
      type={type}
      value={val}
      autoFocus
      onChange={e => setVal(e.target.value)}
      onBlur={save}
      onKeyDown={e => e.key === 'Enter' && save()}
    />
  )
}

export default function Budget() {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [config, setConfig] = useState({ totalBudget: 70000 })
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    const [data, cfg] = await Promise.all([
      api.get('/api/budget'),
      api.get('/api/config'),
    ])
    setCategories(data.categories)
    setItems(data.items)
    setConfig(cfg.config || { totalBudget: 70000 })
  }, [])

  useEffect(() => { load() }, [load])

  const updateItem = async (id, changes) => {
    const prev = items
    setItems(items.map(i => i.id === id ? { ...i, ...changes, outstanding: (Number(changes.actual ?? i.actual) || 0) - (Number(changes.paid ?? i.paid) || 0) } : i))
    try {
      await api.put(`/api/budget/item/${id}`, changes)
    } catch {
      setItems(prev)
      setToast('Failed to save')
    }
  }

  const toggleCategory = async (cat) => {
    const collapsed = !cat.collapsed
    setCategories(categories.map(c => c.id === cat.id ? { ...c, collapsed } : c))
    await api.put(`/api/budget/category/${cat.id}`, { collapsed })
  }

  const addItem = async (categoryId) => {
    const item = await api.post('/api/budget/item', { categoryId })
    setItems([...items, item])
  }

  const addCategory = async () => {
    const cat = await api.post('/api/budget/category', { name: 'New Category' })
    setCategories([...categories, cat])
  }

  const deleteItem = async (id) => {
    if (!confirm('Delete this item?')) return
    setItems(items.filter(i => i.id !== id))
    await api.del(`/api/budget/item/${id}`)
  }

  const totalEstimate = items.reduce((s, i) => s + (Number(i.estimate) || 0), 0)
  const totalPaid = items.reduce((s, i) => s + (Number(i.paid) || 0), 0)
  const totalOutstanding = items.reduce((s, i) => s + (Number(i.outstanding) || 0), 0)

  let rowNum = 0

  return (
    <div>
      <div className="page-header">
        <h2>Budget</h2>
        <p>Track estimates, payments, and outstanding balances</p>
      </div>

      <div className="summary-bar">
        <div className="summary-item"><strong>${Number(config.totalBudget).toLocaleString()}</strong>Total Budget</div>
        <div className="summary-item"><strong>${totalEstimate.toLocaleString()}</strong>Total Estimated</div>
        <div className="summary-item"><strong>${totalPaid.toLocaleString()}</strong>Total Paid</div>
        <div className="summary-item"><strong>${totalOutstanding.toLocaleString()}</strong>Outstanding</div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Item</th><th>Vendor</th><th>Estimate</th>
              <th>Actual</th><th>Paid</th><th>Outstanding</th>
              <th>Due Date</th><th>Status</th><th>Notes</th><th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => {
              const catItems = items.filter(i => i.categoryId === cat.id)
              return (
                <Fragment key={cat.id}>
                  <tr className="category-header" onClick={() => toggleCategory(cat)}>
                    <td colSpan={11}>
                      <span className="collapse-icon">{cat.collapsed ? '▶' : '▼'}</span>
                      {cat.name}
                      <button className="btn btn-sm" style={{ float: 'right', opacity: 1 }} onClick={e => { e.stopPropagation(); addItem(cat.id) }}>+ Item</button>
                    </td>
                  </tr>
                  {!cat.collapsed && catItems.map(item => {
                    rowNum++
                    return (
                      <tr key={item.id} className={rowClass(item)}>
                        <td>{rowNum}</td>
                        <td><InlineCell value={item.item} onSave={v => updateItem(item.id, { item: v })} /></td>
                        <td><InlineCell value={item.vendor} onSave={v => updateItem(item.id, { vendor: v })} /></td>
                        <td><InlineCell value={item.estimate} type="number" onSave={v => updateItem(item.id, { estimate: v })} /></td>
                        <td><InlineCell value={item.actual} type="number" onSave={v => updateItem(item.id, { actual: v })} /></td>
                        <td><InlineCell value={item.paid} type="number" onSave={v => updateItem(item.id, { paid: v })} /></td>
                        <td>${(Number(item.outstanding) || 0).toLocaleString()}</td>
                        <td><DateInput value={item.dueDate} onChange={v => updateItem(item.id, { dueDate: v })} /></td>
                        <td><StatusBadge value={item.status} type="budget" onChange={v => updateItem(item.id, { status: v })} /></td>
                        <td><InlineCell value={item.notes} onSave={v => updateItem(item.id, { notes: v })} /></td>
                        <td><button className="btn-icon" onClick={() => deleteItem(item.id)} title="Delete">🗑</button></td>
                      </tr>
                    )
                  })}
                </Fragment>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="sticky-footer">
              <td colSpan={3}>Totals</td>
              <td>${totalEstimate.toLocaleString()}</td>
              <td></td>
              <td>${totalPaid.toLocaleString()}</td>
              <td>${totalOutstanding.toLocaleString()}</td>
              <td colSpan={4}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <button className="btn" style={{ marginTop: 16 }} onClick={addCategory}>+ Add Category</button>
      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}
