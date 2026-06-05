import { useData } from '../DataContext'

export function PageShell({ children }) {
  const { loaded, error, hasCache, refresh, restored } = useData()

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
      {restored && (
        <div className="restore-banner" role="status">
          Your edits were restored from this browser after a server reset. Mount a Railway volume to prevent this in future deploys.
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
