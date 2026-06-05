import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from './api'
import { readCache, writeCache } from './cache'

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

  const hasCache = budgetItems.length > 0 || checklist.length > 0 || guests.length > 0

  const loadAll = useCallback(async () => {
    try {
      setError(null)
      const [cfg, budget, chk, gst, vnd, docs, tl] = await Promise.all([
        api.get('/api/config'),
        api.get('/api/budget'),
        api.get('/api/checklist'),
        api.get('/api/guests'),
        api.get('/api/vendors'),
        api.get('/api/documents'),
        api.get('/api/timeline'),
      ])
      setConfig(cfg.config)
      setBannerPhotos(cfg.bannerPhotos || [])
      setBudgetCategories(budget.categories)
      setBudgetItems(budget.items)
      setChecklist(chk)
      setGuests(gst)
      setVendors(vnd)
      setDocuments(docs)
      setTimeline(tl)
    } catch (e) {
      setError(e.message || 'Failed to load data')
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    if (!loaded) return
    writeCache('cache:config', config)
    writeCache('cache:bannerPhotos', bannerPhotos)
    writeCache('cache:budgetCategories', budgetCategories)
    writeCache('cache:budgetItems', budgetItems)
    writeCache('cache:checklist', checklist)
    writeCache('cache:guests', guests)
    writeCache('cache:vendors', vendors)
    writeCache('cache:documents', documents)
    writeCache('cache:timeline', timeline)
  }, [loaded, config, bannerPhotos, budgetCategories, budgetItems, checklist, guests, vendors, documents, timeline])

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
