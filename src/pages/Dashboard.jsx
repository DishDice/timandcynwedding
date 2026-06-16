import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { api, uploadBannerPhoto, deleteBannerPhoto } from '../api'
import { useData } from '../DataContext'
import { Toast } from '../components/Toast'
import { PageShell } from '../components/PageShell'

function daysUntil(dateStr) {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((target - now) / 86400000))
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function Dashboard() {
  const { pathname } = useLocation()
  const isActive = pathname === '/'
  const {
    config, setConfig,
    bannerPhotos, setBannerPhotos,
    budgetItems, checklist, guests, vendors,
    setChecklist,
  } = useData()

  const [slide, setSlide] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [quickTask, setQuickTask] = useState('')
  const [toast, setToast] = useState('')
  const [editForm, setEditForm] = useState({})
  const drawerRef = useRef(null)

  useEffect(() => {
    if (!isActive || bannerPhotos.length <= 1) return
    const t = setInterval(() => setSlide(s => (s + 1) % bannerPhotos.length), 5000)
    return () => clearInterval(t)
  }, [isActive, bannerPhotos.length])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false) }
    document.addEventListener('keydown', onKey)
    drawerRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  const totalPaid = budgetItems.reduce((s, i) => s + (Number(i.paid) || 0), 0)
  const vendorCount = vendors.length
  const pendingTasks = checklist.filter(t => {
    if (t.done || !t.dueDate) return false
    const due = new Date(t.dueDate + 'T00:00:00')
    const in30 = new Date(); in30.setDate(in30.getDate() + 30)
    return due <= in30
  }).length
  const confirmedGuests = guests.filter(g => g.rsvp === 'confirmed').length

  const handleQuickAdd = async (e) => {
    e.preventDefault()
    if (!quickTask.trim()) return
    try {
      const t = await api.post('/api/checklist', { task: quickTask.trim(), section: 'General' })
      setChecklist(prev => [...prev, t])
      setQuickTask('')
      setToast('Task added')
    } catch (err) {
      setToast(err.message || 'Failed to add task')
    }
  }

  const openDrawer = () => {
    setEditForm({
      coupleNames: config?.coupleNames || 'Tim & Cyn',
      weddingDate: config?.weddingDate || '2026-10-10',
      totalBudget: config?.totalBudget || 70000,
    })
    setDrawerOpen(true)
  }

  const saveConfig = async () => {
    try {
      await api.put('/api/config', editForm)
      setConfig(editForm)
      setDrawerOpen(false)
      setToast('Details updated')
    } catch (err) {
      setToast(err.message || 'Failed to save')
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const res = await uploadBannerPhoto(file)
      setBannerPhotos(res.photos)
      setToast('Photo uploaded')
    } catch (err) {
      setToast(err.message || 'Failed to upload')
    }
  }

  const removePhoto = async (url) => {
    try {
      const res = await deleteBannerPhoto(url)
      setBannerPhotos(res.photos)
    } catch (err) {
      setToast(err.message || 'Failed to remove photo')
    }
  }

  const weddingDate = config?.weddingDate || '2026-10-10'
  const coupleNames = config?.coupleNames || 'Tim & Cyn'

  return (
    <PageShell>
      <div className="banner">
        {bannerPhotos.length > 0 ? bannerPhotos.map((url, i) => (
          <div
            key={url}
            className={`banner-slide ${i === slide ? 'active' : ''}`}
            style={{ backgroundImage: `url(${url})` }}
          />
        )) : (
          <div className="banner-gradient-fallback" />
        )}
        <div className="banner-overlay">
          <div className="banner-names">{coupleNames}</div>
          <div className="banner-date">{formatDate(weddingDate)}</div>
          <div className="banner-countdown">{daysUntil(weddingDate)}</div>
          <div className="banner-label">days to go</div>
        </div>
        {bannerPhotos.length > 1 && (
          <div className="banner-dots" role="tablist" aria-label="Banner photos">
            {bannerPhotos.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === slide}
                aria-label={`Photo ${i + 1}`}
                className={`banner-dot ${i === slide ? 'active' : ''}`}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-actions">
        <button type="button" className="btn btn-sm" onClick={openDrawer}>Edit details</button>
      </div>

      <div className="metrics-grid">
        <div className="card metric-card">
          <div className="metric-value">${totalPaid.toLocaleString()}</div>
          <div className="metric-label">Total Paid</div>
        </div>
        <div className="card metric-card">
          <div className="metric-value">{vendorCount}</div>
          <div className="metric-label">Vendors</div>
        </div>
        <div className="card metric-card">
          <div className="metric-value">{pendingTasks}</div>
          <div className="metric-label">Tasks Due (30 days)</div>
        </div>
        <div className="card metric-card">
          <div className="metric-value">{confirmedGuests}</div>
          <div className="metric-label">Confirmed Guests</div>
        </div>
      </div>

      <form className="quick-add" onSubmit={handleQuickAdd}>
        <input
          placeholder="Quick-add a task..."
          value={quickTask}
          onChange={e => setQuickTask(e.target.value)}
          aria-label="Quick-add task"
        />
        <button type="submit" className="btn btn-primary">Add</button>
      </form>

      {drawerOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div
            className="drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            tabIndex={-1}
          >
            <button type="button" className="drawer-close" aria-label="Close" onClick={() => setDrawerOpen(false)}>×</button>
            <h3 id="drawer-title">Edit Details</h3>
            <div className="form-group">
              <label htmlFor="edit-couple">Couple Names</label>
              <input id="edit-couple" value={editForm.coupleNames} onChange={e => setEditForm(f => ({ ...f, coupleNames: e.target.value }))} />
            </div>
            <div className="form-group">
              <label htmlFor="edit-date">Wedding Date</label>
              <input id="edit-date" type="date" value={editForm.weddingDate} onChange={e => setEditForm(f => ({ ...f, weddingDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label htmlFor="edit-budget">Total Budget</label>
              <input id="edit-budget" type="number" value={editForm.totalBudget} onChange={e => setEditForm(f => ({ ...f, totalBudget: Number(e.target.value) }))} />
            </div>
            <div className="form-group">
              <label htmlFor="edit-photos">Banner Photos (up to 5)</label>
              <input id="edit-photos" type="file" accept="image/*" onChange={handlePhotoUpload} disabled={bannerPhotos.length >= 5} />
              <div className="photo-preview">
                {bannerPhotos.map(url => (
                  <div key={url} className="photo-thumb-wrap">
                    <img src={url} alt="Banner" className="photo-thumb" />
                    <button type="button" className="photo-remove" aria-label="Remove photo" onClick={() => removePhoto(url)}>×</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button type="button" className="btn btn-primary" onClick={saveConfig}>Save</button>
              <button type="button" className="btn" onClick={() => setDrawerOpen(false)}>Cancel</button>
            </div>
          </div>
        </>
      )}

      <Toast message={toast} onClose={() => setToast('')} />
    </PageShell>
  )
}
