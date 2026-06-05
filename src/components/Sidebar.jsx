import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '♥' },
  { to: '/budget', label: 'Budget', icon: '$' },
  { to: '/vendors', label: 'Vendors', icon: '★' },
  { to: '/checklist', label: 'Checklist', icon: '✓' },
  { to: '/guests', label: 'Guests', icon: '◎' },
  { to: '/documents', label: 'Documents', icon: '▤' },
  { to: '/timeline', label: 'Day Timeline', icon: '⏱' },
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
            <span className="bottom-nav-label">{item.label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
