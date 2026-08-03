import { useLocation } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import Budget from '../pages/Budget'
import Vendors from '../pages/Vendors'
import Checklist from '../pages/Checklist'
import Guests from '../pages/Guests'
import Documents from '../pages/Documents'
import Notes from '../pages/Notes'
import SeatingChart from '../pages/SeatingChart'
import DayTimeline from '../pages/DayTimeline'

const ROUTES = [
  { path: '/', Component: Dashboard, exact: true },
  { path: '/budget', Component: Budget },
  { path: '/vendors', Component: Vendors },
  { path: '/checklist', Component: Checklist },
  { path: '/guests', Component: Guests },
  { path: '/seating', Component: SeatingChart },
  { path: '/documents', Component: Documents },
  { path: '/notes', Component: Notes },
  { path: '/timeline', Component: DayTimeline },
]

function isActive(pathname, path, exact) {
  if (exact) return pathname === path
  return pathname === path || pathname.startsWith(path + '/')
}

export function PersistentRoutes() {
  const { pathname } = useLocation()

  return (
    <>
      {ROUTES.map(({ path, Component, exact }) => (
        <div key={path} style={{ display: isActive(pathname, path, exact) ? 'block' : 'none' }}>
          <Component />
        </div>
      ))}
    </>
  )
}
