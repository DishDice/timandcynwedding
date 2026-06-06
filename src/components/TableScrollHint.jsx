import { useCompactLayout } from '../hooks/useCompactLayout'

export function TableScrollHint() {
  const compact = useCompactLayout(1100)
  if (!compact) return null
  return <p className="table-scroll-hint">Swipe horizontally to see all columns</p>
}
