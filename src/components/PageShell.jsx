import { useData } from '../DataContext'

export function PageShell({ children }) {
  const { loaded, error, hasCache, refresh } = useData()

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
