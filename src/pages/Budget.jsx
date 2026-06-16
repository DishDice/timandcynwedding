import { useState, useEffect, Fragment } from 'react'
import { api } from '../api'
import { useData } from '../DataContext'
import { useCompactLayout } from '../hooks/useCompactLayout'
import { DateInput } from '../components/DateInput'
import { StatusBadge } from '../components/StatusBadge'
import { Toast } from '../components/Toast'
import { PageShell } from '../components/PageShell'
import { TableScrollHint } from '../components/TableScrollHint'

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
  const safeValue = value ?? ''
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(safeValue)

  useEffect(() => { setVal(value ?? '') }, [value])

  const save = () => {
    setEditing(false)
    const final = type === 'number' ? Number(val) || 0 : val
    if (final !== value) onSave(final)
  }

  if (!editing) {
    return (
      <span
        className={`cell-text editable-cell ${className}`.trim()}
        onClick={() => setEditing(true)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(true) } }}
        role="button"
        tabIndex={0}
      >
        {type === 'number' ? `$${Number(value || 0).toLocaleString()}` : (safeValue !== '' ? safeValue : '—')}
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
      onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(safeValue); setEditing(false) } }}
    />
  )
}

function BudgetCardList({ categories, items, onUpdateItem, onAddItem, onDeleteItem, onToggleCategory, onAddCategory }) {
  let rowNum = 0
  return (
    <div className="card-list budget-card-list">
      {categories.map(cat => {
        const catItems = items.filter(i => i.categoryId === cat.id)
        const catTotal = catItems.reduce((s, i) => s + (Number(i.actual) || 0), 0)
        const catPaid = catItems.reduce((s, i) => s + (Number(i.paid) || 0), 0)
        return (
          <Fragment key={cat.id}>
            <div className="data-card-section budget-card-section">
              <button type="button" className="budget-card-section-toggle" onClick={() => onToggleCategory(cat)}>
                <span className="collapse-icon">{cat.collapsed ? '▶' : '▼'}</span>
                <span className="budget-card-section-name">{cat.name}</span>
                <span className="budget-card-section-totals">
                  ${catPaid.toLocaleString()} / ${catTotal.toLocaleString()}
                </span>
              </button>
              <button type="button" className="btn btn-sm" onClick={() => onAddItem(cat.id)}>+ Item</button>
            </div>
            {!cat.collapsed && catItems.map(item => {
              rowNum++
              return (
                <div key={item.id} className={`data-card ${rowClass(item)}`}>
                  <div className="data-card-header">
                    <div className="data-card-title">
                      <span className="budget-card-num">#{rowNum}</span>
                      <InlineCell value={item.item} onSave={v => onUpdateItem(item.id, { item: v })} />
                      {item.vendor && <div className="data-card-subtitle">{item.vendor}</div>}
                    </div>
                    <div className="data-card-actions">
                      <StatusBadge value={item.status} type="budget" onChange={v => onUpdateItem(item.id, { status: v })} />
                      <button type="button" className="btn-icon" aria-label={`Delete ${item.item || 'item'}`} onClick={() => onDeleteItem(item.id)}>🗑</button>
                    </div>
                  </div>
                  <div className="data-card-grid">
                    <div className="data-card-field">
                      <span className="data-card-label">Vendor</span>
                      <div className="data-card-value">
                        <InlineCell value={item.vendor} onSave={v => onUpdateItem(item.id, { vendor: v })} />
                      </div>
                    </div>
                    <div className="data-card-field">
                      <span className="data-card-label">Estimate</span>
                      <div className="data-card-value">
                        <InlineCell value={item.estimate} type="number" onSave={v => onUpdateItem(item.id, { estimate: v })} />
                      </div>
                    </div>
                    <div className="data-card-field">
                      <span className="data-card-label">Actual</span>
                      <div className="data-card-value">
                        <InlineCell value={item.actual} type="number" onSave={v => onUpdateItem(item.id, { actual: v })} />
                      </div>
                    </div>
                    <div className="data-card-field">
                      <span className="data-card-label">Paid</span>
                      <div className="data-card-value">
                        <InlineCell value={item.paid} type="number" onSave={v => onUpdateItem(item.id, { paid: v })} />
                      </div>
                    </div>
                    <div className="data-card-field">
                      <span className="data-card-label">Outstanding</span>
                      <div className="data-card-value budget-outstanding">
                        ${(Number(item.outstanding) || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="data-card-field">
                      <span className="data-card-label">Due Date</span>
                      <div className="data-card-value">
                        <DateInput value={item.dueDate} onChange={v => onUpdateItem(item.id, { dueDate: v })} />
                      </div>
                    </div>
                    <div className="data-card-field data-card-field--full">
                      <span className="data-card-label">Notes</span>
                      <div className="data-card-value">
                        <InlineCell value={item.notes} onSave={v => onUpdateItem(item.id, { notes: v })} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </Fragment>
        )
      })}
      <button type="button" className="btn" style={{ alignSelf: 'flex-start' }} onClick={onAddCategory}>+ Add Category</button>
    </div>
  )
}

export default function Budget() {
  const compact = useCompactLayout(1100)
  const { config, budgetCategories: categories, setBudgetCategories: setCategories, budgetItems: items, setBudgetItems: setItems } = useData()
  const [toast, setToast] = useState('')

  const updateItem = async (id, changes) => {
    let snapshot
    setItems(prev => {
      snapshot = prev
      return prev.map(i => i.id === id ? { ...i, ...changes, outstanding: (Number(changes.actual ?? i.actual) || 0) - (Number(changes.paid ?? i.paid) || 0) } : i)
    })
    try {
      await api.put(`/api/budget/item/${id}`, changes)
    } catch {
      setItems(snapshot)
      setToast('Failed to save')
    }
  }

  const toggleCategory = async (cat) => {
    const collapsed = !cat.collapsed
    let snapshot
    setCategories(prev => {
      snapshot = prev
      return prev.map(c => c.id === cat.id ? { ...c, collapsed } : c)
    })
    try {
      await api.put(`/api/budget/category/${cat.id}`, { collapsed })
    } catch {
      setCategories(snapshot)
      setToast('Failed to save')
    }
  }

  const addItem = async (categoryId) => {
    try {
      const item = await api.post('/api/budget/item', { categoryId })
      setItems(prev => [...prev, item])
    } catch {
      setToast('Failed to add item')
    }
  }

  const addCategory = async () => {
    try {
      const cat = await api.post('/api/budget/category', { name: 'New Category' })
      setCategories(prev => [...prev, cat])
    } catch {
      setToast('Failed to add category')
    }
  }

  const deleteItem = async (id) => {
    if (!confirm('Delete this item?')) return
    let snapshot
    setItems(prev => {
      snapshot = prev
      return prev.filter(i => i.id !== id)
    })
    try {
      await api.del(`/api/budget/item/${id}`)
    } catch {
      setItems(snapshot)
      setToast('Failed to delete')
    }
  }

  const totalEstimate = items.reduce((s, i) => s + (Number(i.estimate) || 0), 0)
  const totalPaid = items.reduce((s, i) => s + (Number(i.paid) || 0), 0)
  const totalOutstanding = items.reduce((s, i) => s + (Number(i.outstanding) || 0), 0)

  return (
    <PageShell>
      <div className="page-header">
        <h2>Budget</h2>
        <p>Track estimates, payments, and outstanding balances</p>
      </div>

      <div className="summary-bar">
        <div className="summary-item"><strong>${Number(config?.totalBudget || 70000).toLocaleString()}</strong>Total Budget</div>
        <div className="summary-item"><strong>${totalEstimate.toLocaleString()}</strong>Total Estimated</div>
        <div className="summary-item"><strong>${totalPaid.toLocaleString()}</strong>Total Paid</div>
        <div className="summary-item"><strong>${totalOutstanding.toLocaleString()}</strong>Outstanding</div>
      </div>

      {compact ? (
        <BudgetCardList
          categories={categories}
          items={items}
          onUpdateItem={updateItem}
          onAddItem={addItem}
          onDeleteItem={deleteItem}
          onToggleCategory={toggleCategory}
          onAddCategory={addCategory}
        />
      ) : (
        <>
          <TableScrollHint />
          <div className="table-wrap table-wrap--scroll">
            <table className="data-table budget-table">
              <thead>
                <tr>
                  <th>#</th><th>Item</th><th>Vendor</th><th>Estimate</th>
                  <th>Actual</th><th>Paid</th><th>Outstanding</th>
                  <th>Due Date</th><th>Status</th><th>Notes</th><th></th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let rowNum = 0
                  return categories.map(cat => {
                    const catItems = items.filter(i => i.categoryId === cat.id)
                    return (
                      <Fragment key={cat.id}>
                        <tr className="category-header" onClick={() => toggleCategory(cat)}>
                          <td colSpan={11}>
                            <span className="collapse-icon">{cat.collapsed ? '▶' : '▼'}</span>
                            {cat.name}
                            <button type="button" className="btn btn-sm" style={{ float: 'right', opacity: 1 }} onClick={e => { e.stopPropagation(); addItem(cat.id) }}>+ Item</button>
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
                              <td><button type="button" className="btn-icon" aria-label={`Delete ${item.item}`} onClick={() => deleteItem(item.id)}>🗑</button></td>
                            </tr>
                          )
                        })}
                      </Fragment>
                    )
                  })
                })()}
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
          <button type="button" className="btn" style={{ marginTop: 16 }} onClick={addCategory}>+ Add Category</button>
        </>
      )}
      <Toast message={toast} onClose={() => setToast('')} />
    </PageShell>
  )
}
