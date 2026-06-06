import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from './api'
import { readCache, writeCache } from './cache'
import { restoreFromCacheIfNeeded, wouldPoisonCache, cacheHasUserEdits, buildRestorePayload } from './syncGuard'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [config, setConfig] = useState(() => readCache('cache:config', null))
  const [bannerPhotos, setBannerPhotos] = useState(() => readCache('cache:bannerPhotos', []))
  const [budgetCategories, setBudgetCategories] = useState(() => readCache('cache:budgetCategories', []))
  const [budgetItems, setBudgetItems] = useState(() => readCache('cache:budgetItems', []))
  const [checklist, setChecklist] = useState(() => readCache('cache:checklist', []))
  const [guests, setGuests] = useState(() => readCache('cache:guests', []))
  const [vendors, setVendors] = useState(() => readCache('cache:vendors', []))
  const [documents, setDocuments] = useState(() => readCache('cache:documents', []))
  const [timeline, setTimeline] = useState(() => readCache('cache:timeline', []))
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)
  const [restored, setRestored] = useState(false)
  const [restoreAvailable, setRestoreAvailable] = useState(false)

  const hasCache = budgetItems.length > 0 || checklist.length > 0 || guests.length > 0

  const applyData = useCallback((cfg, budget, chk, gst, vnd, docs, tl) => {
    setConfig(cfg.config)
    setBannerPhotos(cfg.bannerPhotos || [])
    setBudgetCategories(budget.categories)
    setBudgetItems(budget.items)
    setChecklist(chk)
    setGuests(gst)
    setVendors(vnd)
    setDocuments(docs)
    setTimeline(tl)
  }, [])

  const loadAll = useCallback(async () => {
    try {
      setError(null)
      let [cfg, budget, chk, gst, vnd, docs, tl] = await Promise.all([
        api.get('/api/config'),
        api.get('/api/budget'),
        api.get('/api/checklist'),
        api.get('/api/guests'),
        api.get('/api/vendors'),
        api.get('/api/documents'),
        api.get('/api/timeline'),
      ])

      const canRestore = !!buildRestorePayload(gst, chk)
      setRestoreAvailable(canRestore)

      try {
        const didRestore = await restoreFromCacheIfNeeded(gst, chk)
        if (didRestore) {
          setRestored(true)
          setRestoreAvailable(false)
          ;[cfg, budget, chk, gst, vnd, docs, tl] = await Promise.all([
            api.get('/api/config'),
            api.get('/api/budget'),
            api.get('/api/checklist'),
            api.get('/api/guests'),
            api.get('/api/vendors'),
            api.get('/api/documents'),
            api.get('/api/timeline'),
          ])
        }
      } catch (restoreErr) {
        console.error('[sync] Auto-restore failed:', restoreErr)
        if (canRestore) setRestoreAvailable(true)
      }

      applyData(cfg, budget, chk, gst, vnd, docs, tl)
    } catch (e) {
      setError(e.message || 'Failed to load data')
    } finally {
      setLoaded(true)
    }
  }, [applyData])

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    if (!loaded) return
    if (wouldPoisonCache(guests, checklist)) {
      console.warn('[sync] Skipping cache write — server has fresh seed but browser still has your edits. Restore pending or failed.')
      return
    }
    writeCache('cache:config', config)
    writeCache('cache:bannerPhotos', bannerPhotos)
    writeCache('cache:budgetCategories', budgetCategories)
    writeCache('cache:budgetItems', budgetItems)
    writeCache('cache:checklist', checklist)
    writeCache('cache:guests', guests)
    writeCache('cache:vendors', vendors)
    writeCache('cache:documents', documents)
    writeCache('cache:timeline', timeline)
    const prevMeta = readCache('cache:meta', {})
    writeCache('cache:meta', {
      savedAt: new Date().toISOString(),
      hadUserEdits: prevMeta.hadUserEdits || restored || cacheHasUserEdits(),
    })
  }, [loaded, config, bannerPhotos, budgetCategories, budgetItems, checklist, guests, vendors, documents, timeline, restored])

  const restoreFromBrowser = useCallback(async () => {
    const gst = await api.get('/api/guests')
    const chk = await api.get('/api/checklist')
    const payload = buildRestorePayload(gst, chk)
    if (!payload) return false
    await api.post('/api/sync/restore', payload)
    setRestored(true)
    setRestoreAvailable(false)
    await loadAll()
    return true
  }, [loadAll])

  return (
    <DataContext.Provider value={{
      config, setConfig,
      bannerPhotos, setBannerPhotos,
      budgetCategories, setBudgetCategories,
      budgetItems, setBudgetItems,
      checklist, setChecklist,
      guests, setGuests,
      vendors, setVendors,
      documents, setDocuments,
      timeline, setTimeline,
      loaded,
      error,
      restored,
      restoreAvailable,
      restoreFromBrowser,
      hasCache,
      refresh: loadAll,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
