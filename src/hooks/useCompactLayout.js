import { useState, useEffect } from 'react'

export function useCompactLayout(breakpoint = 1100) {
  const query = `(max-width: ${breakpoint}px)`

  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(query).matches
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e) => setCompact(e.matches)
    mq.addEventListener('change', handler)
    setCompact(mq.matches)
    return () => mq.removeEventListener('change', handler)
  }, [query])

  return compact
}
