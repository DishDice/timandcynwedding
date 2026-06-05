import { useState, useEffect, useCallback } from 'react'
import { api, uploadBannerPhoto, deleteBannerPhoto } from '../api'
import { Toast } from '../components/Toast'

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
  const [config, setConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cache:config')) || null } catch { return null }
  })
  const [photos, setPhotos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cache:bannerPhotos')) || [] } catch { return [] }
  })
  const [budget, setBudget] = useState(null)
  const [checklist, setChecklist] = useState(null)
  const [guests, setGuests] = useState(null)
  const [vendors, setVendors] = useState(null)
  const [slide, setSlide] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [quickTask, setQuickTask] = useState('')
  const [toast, setToast] = useState('')
  const [editForm, setEditForm] = useState({})

  const load = useCallback(async () => {
    const [cfg, bud, chk, gst, vnd] = await Promise.all([
      api.get('/api/config'),
      api.get('/api/budget'),
      api.get('/api/checklist'),
      api.get('/api/guests'),
      api.get('/api/vendors'),
    ])
    setConfig(cfg.config)
    setPhotos(cfg.bannerPhotos || [])
    localStorage.setItem('cache:config', JSON.stringify(cfg.config))
    localStorage.setItem('cache:bannerPhotos', JSON.stringify(cfg.bannerPhotos || []))
    setBudget(bud)
    setChecklist(chk)
    setGuests(gst)
    setVendors(vnd)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (photos.length <= 1) return
    const t = setInterval(() => setSlide(s => (s + 1) % photos.length), 5000)
    return () => clearInterval(t)
  }, [photos.length])

  const totalPaid = budget?.items?.reduce((s, i) => s + (Number(i.paid) || 0), 0) || 0
  const vendorCount = vendors?.length || 0
  const pendingTasks = checklist?.filter(t => {
    if (t.done || !t.dueDate) return false
    const due = new Date(t.dueDate + 'T00:00:00')
    const in30 = new Date(); in30.setDate(in30.getDate() + 30)
    return due <= in30
  }).length || 0
  const confirmedGuests = guests?.filter(g => g.rsvp === 'confirmed').length || 0

  const handleQuickAdd = async (e) => {
    e.preventDefault()
    if (!quickTask.trim()) return
    await api.post('/api/checklist', { task: quickTask.trim(), section: 'General' })
    setQuickTask('')
    setToast('Task added')
    load()
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
    await api.put('/api/config', editForm)
    setDrawerOpen(false)
    load()
    setToast('Details updated')
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const res = await uploadBannerPhoto(file)
    if (res.error) { setToast(res.error); return }
    setPhotos(res.photos)
    localStorage.setItem('cache:bannerPhotos', JSON.stringify(res.photos))
    setToast('Photo uploaded')
  }

  const removePhoto = async (url) => {
    const res = await deleteBannerPhoto(url)
    setPhotos(res.photos)
    localStorage.setItem('cache:bannerPhotos', JSON.stringify(res.photos))
  }

  const weddingDate = config?.weddingDate || '2026-10-10'
  const coupleNames = config?.coupleNames || 'Tim & Cyn'

  return (
    <div>
      <div className="banner">
        {photos.length > 0 ? photos.map((url, i) => (
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
        {photos.length > 1 && (
          <div className="banner-dots">
            {photos.map((_, i) => (
              <div key={i} className={`banner-dot ${i === slide ? 'active' : ''}`} />
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-sm" onClick={openDrawer}>Edit details</button>
      </div>

      <div className="metrics-grid">
        <div className="card metric-card">
          <div className="metric-value">${totalPaid.toLocaleString()}</div>
          <div className="metric-label">Total Budget Spent</div>
        </div>
        <div className="card metric-card">
          <div className="metric-value">{vendorCount}</div>
          <div className="metric-label">Vendors</div>
        </div>
        <div className="card metric-card">
          <div className="metric-value">{pendingTasks}</div>
          <div className="metric-label">Pending Tasks (30 days)</div>
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
        />
        <button type="submit" className="btn btn-primary">Add</button>
      </form>

      {drawerOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <div className="drawer">
            <h3>Edit Details</h3>
            <div className="form-group">
              <label>Couple Names</label>
              <input value={editForm.coupleNames} onChange={e => setEditForm(f => ({ ...f, coupleNames: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Wedding Date</label>
              <input type="date" value={editForm.weddingDate} onChange={e => setEditForm(f => ({ ...f, weddingDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Total Budget</label>
              <input type="number" value={editForm.totalBudget} onChange={e => setEditForm(f => ({ ...f, totalBudget: Number(e.target.value) }))} />
            </div>
            <div className="form-group">
              <label>Banner Photos (up to 5)</label>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={photos.length >= 5} />
              <div className="photo-preview">
                {photos.map(url => (
                  <div key={url} className="photo-thumb-wrap">
                    <img src={url} alt="" className="photo-thumb" />
                    <button type="button" className="photo-remove" onClick={() => removePhoto(url)}>×</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="btn btn-primary" onClick={saveConfig}>Save</button>
              <button className="btn" onClick={() => setDrawerOpen(false)}>Cancel</button>
            </div>
          </div>
        </>
      )}

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}
