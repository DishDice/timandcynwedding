const STATUS_COLORS = {
  'Not Started': 'status-not-started',
  'Deposit Paid': 'status-deposit',
  'Paid in Full': 'status-paid',
  'None': 'status-none',
  'Sent': 'status-sent',
  'Signed': 'status-signed',
  'pending': 'status-pending',
  'confirmed': 'status-confirmed',
  'declined': 'status-declined',
}

const CYCLES = {
  budget: ['Not Started', 'Deposit Paid', 'Paid in Full'],
  contract: ['None', 'Sent', 'Signed'],
  rsvp: ['pending', 'confirmed', 'declined'],
}

export function StatusBadge({ value, type = 'budget', onChange }) {
  const className = STATUS_COLORS[value] || 'status-not-started'

  const handleClick = () => {
    if (!onChange) return
    const cycle = CYCLES[type] || CYCLES.budget
    const idx = cycle.indexOf(value)
    const next = cycle[(idx + 1) % cycle.length]
    onChange(next)
  }

  const label = type === 'rsvp'
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : value

  return (
    <button type="button" className={`status-badge ${className}`} onClick={handleClick} aria-label={`Status: ${label}. Click to change.`}>
      {label}
    </button>
  )
}

export function AssignedPill({ value, onChange }) {
  const colors = { Tim: 'pill-tim', Cyn: 'pill-cyn', Both: 'pill-both' }
  const options = ['Tim', 'Cyn', 'Both']

  const handleClick = () => {
    if (!onChange) return
    const idx = options.indexOf(value)
    onChange(options[(idx + 1) % options.length])
  }

  return (
    <button type="button" className={`assigned-pill ${colors[value] || 'pill-both'}`} onClick={handleClick} aria-label={`Assigned to ${value}. Click to change.`}>
      {value}
    </button>
  )
}
