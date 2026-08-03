import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Dashboard', short: 'Home', icon: '♥' },
  { to: '/budget', label: 'Budget', short: 'Budget', icon: '$' },
  { to: '/vendors', label: 'Vendors', short: 'Vendors', icon: '★' },
  { to: '/checklist', label: 'Checklist', short: 'Tasks', icon: '✓' },
  { to: '/guests', label: 'Guests', short: 'Guests', icon: '◎' },
  { to: '/seating', label: 'Seating Chart', short: 'Seats', icon: '◉' },
  { to: '/documents', label: 'Documents', short: 'Docs', icon: '▤' },
  { to: '/notes', label: 'Notes', short: 'Notes', icon: '✎' },
  { to: '/timeline', label: 'Day Timeline', short: 'Day', icon: '⏱' },
]

export function Sidebar() {
  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-heart">♥</span>
          <h1>Tim & Cyn</h1>
          <p className="sidebar-sub">Wedding Hub</p>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <nav className="bottom-nav">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.short}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
