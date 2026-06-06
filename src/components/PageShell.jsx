import { useState } from 'react'
import { useData } from '../DataContext'

export function PageShell({ children }) {
  const { loaded, error, hasCache, refresh, restored, restoreAvailable, restoreFromBrowser } = useData()
  const [restoring, setRestoring] = useState(false)

  const handleRestore = async () => {
    setRestoring(true)
    try {
      await restoreFromBrowser()
    } finally {
      setRestoring(false)
    }
  }

  if (!loaded && !hasCache) {
    return (
      <div className="page-loading" role="status" aria-live="polite">
        <div className="page-loading-spinner" />
        <p>Loading your wedding data…</p>
      </div>
    )
  }

  return (
    <>
      {restoreAvailable && (
        <div className="restore-banner" role="alert">
          <span>The server was reset to defaults, but this browser still has your previous edits.</span>
          <button type="button" className="btn btn-sm btn-primary" disabled={restoring} onClick={handleRestore}>
            {restoring ? 'Restoring…' : 'Restore my data'}
          </button>
        </div>
      )}
      {restored && (
        <div className="restore-banner" role="status">
          Your edits were restored from this browser. Ensure Railway has a volume at <code>/data</code> with <code>DATA_PATH=/data</code> so data survives future deploys.
        </div>
      )}
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button type="button" className="btn btn-sm" onClick={refresh}>Retry</button>
        </div>
      )}
      {children}
    </>
  )
}

export function EmptyRow({ colSpan, message = 'No items match your filters.' }) {
  return (
    <tr className="empty-row">
      <td colSpan={colSpan}>{message}</td>
    </tr>
  )
}
