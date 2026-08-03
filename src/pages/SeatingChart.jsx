import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { api } from '../api'
import { useData } from '../DataContext'
import { PageShell } from '../components/PageShell'
import { Toast } from '../components/Toast'

const VIEW_W = 1600
const VIEW_H = 1200
const MIN_ZOOM = 0.35
const MAX_ZOOM = 3.5

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function rsvpTone(rsvp) {
  if (rsvp === 'confirmed') return 'confirmed'
  if (rsvp === 'declined') return 'declined'
  return 'pending'
}

function seatPositions(table) {
  const n = Math.max(1, Number(table.seats) || 10)
  if (table.kind === 'rect') {
    const w = Number(table.width) || 220
    const h = Number(table.height) || 40
    const y = table.y - h / 2 - 18
    return Array.from({ length: n }, (_, i) => ({
      x: table.x - w / 2 + ((i + 0.5) / n) * w,
      y,
    }))
  }
  const radius = table.seats <= 4 ? 38 : 52
  return Array.from({ length: n }, (_, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2
    return {
      x: table.x + Math.cos(a) * radius,
      y: table.y + Math.sin(a) * radius,
    }
  })
}

function VenueBackground() {
  return (
    <g className="venue-bg" pointerEvents="none">
      {/* Outer grass */}
      <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="#c5d4a8" />

      {/* Top curved patio */}
      <path
        d="M 280 260 L 1320 260 L 1320 200 Q 800 40 280 200 Z"
        fill="#9a9a9a"
        stroke="#6e6e6e"
        strokeWidth="1.5"
      />
      <text x="800" y="175" textAnchor="middle" className="venue-label">Outdoor Patio</text>

      {/* Left outdoor patio */}
      <rect x="20" y="300" width="150" height="520" fill="#b0b0b0" stroke="#6e6e6e" strokeWidth="1.5" />
      <text x="95" y="330" textAnchor="middle" className="venue-label">Patio</text>

      {/* Left undercover */}
      <rect x="180" y="260" width="120" height="560" fill="#8e8e8e" stroke="#5a5a5a" strokeWidth="1.5" />
      <text x="240" y="520" textAnchor="middle" className="venue-label-v" transform="rotate(-90 240 520)">Area Undercover</text>

      {/* Right undercover */}
      <rect x="1300" y="260" width="120" height="560" fill="#8e8e8e" stroke="#5a5a5a" strokeWidth="1.5" />
      <text x="1360" y="520" textAnchor="middle" className="venue-label-v" transform="rotate(90 1360 520)">Area Undercover</text>

      {/* Main reception hall */}
      <rect x="300" y="260" width="1000" height="560" fill="#fafafa" stroke="#333" strokeWidth="2.5" />
      <text x="800" y="278" textAnchor="middle" className="venue-label-sm">Wedding Party</text>

      {/* Dancefloor */}
      <circle cx="800" cy="530" r="95" fill="none" stroke="#888" strokeWidth="2" strokeDasharray="8 6" />
      <text x="800" y="535" textAnchor="middle" className="venue-label">Dancefloor</text>

      {/* DJ / Band */}
      <rect x="730" y="735" width="140" height="55" fill="none" stroke="#666" strokeWidth="1.5" strokeDasharray="6 4" />
      <text x="800" y="768" textAnchor="middle" className="venue-label">DJ / Band</text>

      {/* Main Bar */}
      <rect x="340" y="735" width="110" height="55" fill="#e8e8e8" stroke="#444" strokeWidth="1.5" />
      <text x="395" y="768" textAnchor="middle" className="venue-label">Main Bar</text>

      {/* Harry Bar */}
      <rect x="1150" y="735" width="110" height="55" fill="#e8e8e8" stroke="#444" strokeWidth="1.5" />
      <text x="1205" y="768" textAnchor="middle" className="venue-label">Harry Bar</text>

      {/* Service rooms row */}
      <rect x="180" y="820" width="240" height="200" fill="#9a9a9a" stroke="#555" strokeWidth="1.5" />
      <text x="300" y="900" textAnchor="middle" className="venue-label">Harriett Foyer</text>
      <text x="300" y="925" textAnchor="middle" className="venue-label-sm">Guest Entry ↑</text>

      <rect x="420" y="820" width="420" height="200" fill="#8a8a8a" stroke="#555" strokeWidth="1.5" />
      <text x="630" y="930" textAnchor="middle" className="venue-label">Kitchen</text>

      <rect x="840" y="820" width="200" height="200" fill="#9a9a9a" stroke="#555" strokeWidth="1.5" />
      <text x="940" y="930" textAnchor="middle" className="venue-label">Bridal Room</text>

      <rect x="1040" y="820" width="380" height="200" fill="#9a9a9a" stroke="#555" strokeWidth="1.5" />
      <text x="1230" y="900" textAnchor="middle" className="venue-label">Restrooms</text>
      <text x="1120" y="940" textAnchor="middle" className="venue-label-sm">Male</text>
      <text x="1230" y="940" textAnchor="middle" className="venue-label-sm">Female</text>
      <text x="1340" y="940" textAnchor="middle" className="venue-label-sm">Accessible</text>

      {/* Entry arrow */}
      <path d="M 90 860 L 90 820 L 160 820" fill="none" stroke="#333" strokeWidth="2" markerEnd="url(#arrowhead)" />
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#333" />
        </marker>
      </defs>
    </g>
  )
}

function TableNode({
  table,
  guestsById,
  selected,
  selectedSeat,
  pickingGuest,
  onSelectTable,
  onSelectSeat,
  onDragStart,
}) {
  const seats = seatPositions(table)
  const guestIds = Array.isArray(table.guestIds) ? table.guestIds : []
  const isRect = table.kind === 'rect'
  const tableR = table.seats <= 4 ? 22 : 32

  return (
    <g
      className={`seating-table ${selected ? 'is-selected' : ''}`}
      transform={`translate(0,0)`}
      onPointerDown={e => onDragStart(e, table)}
    >
      {isRect ? (
        <rect
          x={table.x - (table.width || 220) / 2}
          y={table.y - (table.height || 40) / 2}
          width={table.width || 220}
          height={table.height || 40}
          rx="4"
          className="table-body table-body-rect"
          onClick={e => { e.stopPropagation(); onSelectTable(table.id) }}
        />
      ) : (
        <circle
          cx={table.x}
          cy={table.y}
          r={tableR}
          className="table-body"
          onClick={e => { e.stopPropagation(); onSelectTable(table.id) }}
        />
      )}
      <text
        x={table.x}
        y={table.y + 5}
        textAnchor="middle"
        className={`table-label ${isRect ? 'table-label-rect' : ''}`}
        onClick={e => { e.stopPropagation(); onSelectTable(table.id) }}
      >
        {table.label === 'WP' ? 'Party' : table.label}
      </text>

      {seats.map((pos, i) => {
        const gid = guestIds[i]
        const guest = gid ? guestsById.get(String(gid)) : null
        const tone = guest ? rsvpTone(guest.rsvp) : 'empty'
        const isSeatSelected = selected && selectedSeat === i
        return (
          <g
            key={i}
            className={`seat seat-${tone} ${isSeatSelected ? 'is-selected' : ''} ${pickingGuest ? 'is-pickable' : ''}`}
            onClick={e => {
              e.stopPropagation()
              onSelectSeat(table.id, i)
            }}
            style={{ cursor: 'pointer' }}
          >
            <circle cx={pos.x} cy={pos.y} r={table.seats <= 4 ? 12 : 14} className="seat-circle" />
            {guest && (
              <text x={pos.x} y={pos.y + 4} textAnchor="middle" className="seat-initials">
                {initials(guest.name)}
              </text>
            )}
            <title>{guest ? `${guest.name} (${guest.rsvp})` : `Empty seat ${i + 1} — click to assign`}</title>
          </g>
        )
      })}
    </g>
  )
}

export default function SeatingChart() {
  const { guests, setGuests, seating, setSeating } = useData()
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedTableId, setSelectedTableId] = useState(null)
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [pickingGuestId, setPickingGuestId] = useState(null)
  const [panelOpen, setPanelOpen] = useState(true)

  const viewportRef = useRef(null)
  const [view, setView] = useState({ x: 0, y: 0, zoom: 0.55 })
  const viewRef = useRef(view)
  viewRef.current = view

  const dragRef = useRef(null) // { mode: 'pan'|'table', tableId, startX, startY, origX, origY, pointerId }
  const [draggingId, setDraggingId] = useState(null)

  const guestsById = useMemo(() => {
    const m = new Map()
    for (const g of guests) m.set(String(g.id), g)
    return m
  }, [guests])

  const assignedIds = useMemo(() => {
    const s = new Set()
    for (const t of seating) {
      for (const id of t.guestIds || []) {
        if (id) s.add(String(id))
      }
    }
    return s
  }, [seating])

  const unassigned = useMemo(() => {
    const q = search.trim().toLowerCase()
    return guests.filter(g => {
      if (assignedIds.has(String(g.id))) return false
      if (!q) return true
      return g.name.toLowerCase().includes(q) || (g.group || '').toLowerCase().includes(q)
    })
  }, [guests, assignedIds, search])

  const seatedCount = assignedIds.size
  const confirmedSeated = useMemo(() => {
    let n = 0
    for (const id of assignedIds) {
      if (guestsById.get(id)?.rsvp === 'confirmed') n++
    }
    return n
  }, [assignedIds, guestsById])

  const selectedTable = seating.find(t => t.id === selectedTableId) || null

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  // Seed defaults if empty (first visit after deploy)
  useEffect(() => {
    if (!seating || seating.length > 0) return
    let cancelled = false
    ;(async () => {
      try {
        const tables = await api.post('/api/seating/seed-defaults')
        if (!cancelled) setSeating(tables)
      } catch {
        // already seeded elsewhere or race — ignore
      }
    })()
    return () => { cancelled = true }
  }, [seating, setSeating])

  // Reconcile: guests with tableNumber but missing from seat arrays
  useEffect(() => {
    if (!seating.length || !guests.length) return
    let changed = false
    const next = seating.map(t => {
      const ids = Array.isArray(t.guestIds) ? [...t.guestIds] : Array(t.seats).fill(null)
      while (ids.length < t.seats) ids.push(null)
      const present = new Set(ids.filter(Boolean).map(String))
      const missing = guests.filter(g =>
        String(g.tableNumber) === String(t.label) && g.tableNumber && !present.has(String(g.id))
      )
      if (missing.length === 0) return t
      for (const g of missing) {
        const slot = ids.findIndex(x => x == null)
        if (slot < 0) break
        ids[slot] = String(g.id)
        changed = true
      }
      return { ...t, guestIds: ids }
    })
    if (!changed) return
    ;(async () => {
      try {
        const saved = []
        for (const t of next) {
          const orig = seating.find(o => o.id === t.id)
          if (orig && JSON.stringify(orig.guestIds) !== JSON.stringify(t.guestIds)) {
            saved.push(await api.put(`/api/seating/${t.id}`, { guestIds: t.guestIds }))
          } else {
            saved.push(t)
          }
        }
        setSeating(saved.length ? next.map(t => saved.find(s => s.id === t.id) || t) : next)
      } catch (e) {
        console.warn('[seating] reconcile failed', e)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seating.length, guests.length])

  const clientToSvg = useCallback((clientX, clientY) => {
    const el = viewportRef.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    const v = viewRef.current
    return {
      x: (clientX - rect.left - v.x) / v.zoom,
      y: (clientY - rect.top - v.y) / v.zoom,
    }
  }, [])

  const onWheel = useCallback((e) => {
    e.preventDefault()
    const el = viewportRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const v = viewRef.current
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * factor))
    const nx = mx - ((mx - v.x) / v.zoom) * nextZoom
    const ny = my - ((my - v.y) / v.zoom) * nextZoom
    setView({ x: nx, y: ny, zoom: nextZoom })
  }, [])

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onWheel])

  const onDragStart = (e, table) => {
    if (e.button !== 0) return
    if (e.target.closest?.('.seat')) return
    e.stopPropagation()
    e.preventDefault()
    const svg = clientToSvg(e.clientX, e.clientY)
    dragRef.current = {
      mode: 'table',
      tableId: table.id,
      pointerId: e.pointerId,
      offsetX: svg.x - table.x,
      offsetY: svg.y - table.y,
      moved: false,
    }
    setDraggingId(table.id)
    setSelectedTableId(table.id)
  }

  const onViewportPointerDown = (e) => {
    if (e.button !== 0 && e.button !== 1) return
    if (e.target.closest?.('.seating-table')) return
    dragRef.current = {
      mode: 'pan',
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: viewRef.current.x,
      origY: viewRef.current.y,
    }
    setPickingGuestId(null)
    setSelectedSeat(null)
  }

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current
      if (!d) return
      if (d.mode === 'pan') {
        setView(v => ({
          ...v,
          x: d.origX + (e.clientX - d.startX),
          y: d.origY + (e.clientY - d.startY),
        }))
        return
      }
      if (d.mode === 'table') {
        const svg = clientToSvg(e.clientX, e.clientY)
        const x = Math.round(svg.x - d.offsetX)
        const y = Math.round(svg.y - d.offsetY)
        d.moved = true
        setSeating(prev => prev.map(t => t.id === d.tableId ? { ...t, x, y } : t))
      }
    }

    const onUp = () => {
      const d = dragRef.current
      dragRef.current = null
      setDraggingId(null)
      if (!d || d.mode !== 'table' || !d.moved) return
      setSeating(prev => {
        const t = prev.find(x => x.id === d.tableId)
        if (t) {
          api.put(`/api/seating/${t.id}`, { x: t.x, y: t.y }).catch(err => {
            setToast(err.message || 'Failed to save table position')
            setTimeout(() => setToast(null), 2800)
          })
        }
        return prev
      })
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [clientToSvg])

  const zoomBy = (factor) => {
    const el = viewportRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const mx = rect.width / 2
    const my = rect.height / 2
    setView(v => {
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * factor))
      return {
        zoom: nextZoom,
        x: mx - ((mx - v.x) / v.zoom) * nextZoom,
        y: my - ((my - v.y) / v.zoom) * nextZoom,
      }
    })
  }

  const resetView = () => setView({ x: 0, y: 0, zoom: 0.55 })

  const assignGuest = async (guestId, tableId, seatIndex) => {
    try {
      const result = await api.post('/api/seating/assign', { guestId, tableId, seatIndex })
      setSeating(result.tables)
      setGuests(prev => prev.map(g => g.id === result.guest.id ? result.guest : g))
      setPickingGuestId(null)
      setSelectedSeat(seatIndex)
      setSelectedTableId(tableId)
    } catch (err) {
      showToast(err.message || 'Could not assign guest')
    }
  }

  const unassignGuest = async (guestId) => {
    try {
      const result = await api.post('/api/seating/assign', { guestId, tableId: null })
      setSeating(result.tables)
      setGuests(prev => prev.map(g => g.id === result.guest.id ? result.guest : g))
    } catch (err) {
      showToast(err.message || 'Could not unassign guest')
    }
  }

  const onSelectSeat = (tableId, seatIndex) => {
    setSelectedTableId(tableId)
    setSelectedSeat(seatIndex)
    const table = seating.find(t => t.id === tableId)
    const occupied = table?.guestIds?.[seatIndex]

    if (pickingGuestId) {
      assignGuest(pickingGuestId, tableId, seatIndex)
      return
    }
    if (occupied) {
      // toggle: click occupied seat to unassign? Better keep selected for panel actions
      return
    }
  }

  const addTable = async () => {
    try {
      const label = String(prompt('Table label?', `T${seating.length + 1}`) || '').trim()
      if (!label) return
      const seats = Number(prompt('Number of seats?', '10')) || 10
      const table = await api.post('/api/seating', {
        label,
        seats,
        kind: 'round',
        x: 800,
        y: 530,
      })
      setSeating(prev => [...prev, table])
      setSelectedTableId(table.id)
      showToast(`Added table ${label}`)
    } catch (err) {
      showToast(err.message || 'Could not add table')
    }
  }

  const deleteSelectedTable = async () => {
    if (!selectedTable) return
    if (!confirm(`Delete table ${selectedTable.label}? Guests will be unassigned.`)) return
    try {
      await api.del(`/api/seating/${selectedTable.id}`)
      setSeating(prev => prev.filter(t => t.id !== selectedTable.id))
      // refresh guests tableNumbers
      const refreshed = await api.get('/api/guests')
      setGuests(refreshed)
      setSelectedTableId(null)
      setSelectedSeat(null)
    } catch (err) {
      showToast(err.message || 'Could not delete table')
    }
  }

  return (
    <PageShell>
      <div className="page-header seating-header">
        <div>
          <h2>Seating Chart</h2>
          <p>Drag tables to rearrange · scroll to zoom · click a guest then a seat to assign</p>
        </div>
        <div className="seating-toolbar">
          <button type="button" className="btn btn-sm" onClick={() => zoomBy(1 / 1.2)} aria-label="Zoom out">−</button>
          <button type="button" className="btn btn-sm" onClick={() => zoomBy(1.2)} aria-label="Zoom in">+</button>
          <button type="button" className="btn btn-sm" onClick={resetView}>Reset view</button>
          <button type="button" className="btn btn-sm" onClick={addTable}>Add table</button>
          <button type="button" className="btn btn-sm" onClick={() => setPanelOpen(o => !o)}>
            {panelOpen ? 'Hide guests' : 'Show guests'}
          </button>
        </div>
      </div>

      <div className="summary-bar seating-summary">
        <div className="summary-item"><strong>{seating.length}</strong> tables</div>
        <div className="summary-item"><strong>{seatedCount}</strong> seated</div>
        <div className="summary-item"><strong>{unassigned.length}</strong> unassigned</div>
        <div className="summary-item"><strong>{confirmedSeated}</strong> confirmed seated</div>
        <div className="seating-legend">
          <span className="legend-dot legend-confirmed" /> RSVP’d
          <span className="legend-dot legend-pending" /> Not RSVP’d
          <span className="legend-dot legend-declined" /> Declined
          <span className="legend-dot legend-empty" /> Empty
        </div>
      </div>

      <div className={`seating-layout ${panelOpen ? '' : 'panel-collapsed'}`}>
        <div
          className={`seating-viewport ${draggingId ? 'is-dragging' : ''}`}
          ref={viewportRef}
          onPointerDown={onViewportPointerDown}
        >
          <div
            className="seating-canvas"
            style={{
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
              transformOrigin: '0 0',
              width: VIEW_W,
              height: VIEW_H,
            }}
          >
            <svg
              className="seating-svg"
              width={VIEW_W}
              height={VIEW_H}
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            >
              <VenueBackground />
              {seating.map(table => (
                <TableNode
                  key={table.id}
                  table={table}
                  guestsById={guestsById}
                  selected={table.id === selectedTableId}
                  selectedSeat={table.id === selectedTableId ? selectedSeat : null}
                  pickingGuest={!!pickingGuestId}
                  onSelectTable={(id) => { setSelectedTableId(id); setSelectedSeat(null) }}
                  onSelectSeat={onSelectSeat}
                  onDragStart={onDragStart}
                />
              ))}
            </svg>
          </div>
        </div>

        {panelOpen && (
          <aside className="seating-panel">
            {pickingGuestId && (
              <div className="seating-pick-banner">
                Click an empty seat to place{' '}
                <strong>{guestsById.get(String(pickingGuestId))?.name}</strong>
                <button type="button" className="btn btn-sm" onClick={() => setPickingGuestId(null)}>Cancel</button>
              </div>
            )}

            {selectedTable && (
              <div className="seating-selected">
                <div className="seating-selected-head">
                  <h3>
                    {selectedTable.label === 'WP' ? 'Wedding Party' : `Table ${selectedTable.label}`}
                  </h3>
                  <button type="button" className="btn btn-sm btn-danger-ghost" onClick={deleteSelectedTable}>Delete</button>
                </div>
                <ul className="seating-seat-list">
                  {Array.from({ length: selectedTable.seats }, (_, i) => {
                    const gid = selectedTable.guestIds?.[i]
                    const guest = gid ? guestsById.get(String(gid)) : null
                    return (
                      <li key={i} className={selectedSeat === i ? 'is-active' : ''}>
                        <button
                          type="button"
                          className={`seat-list-btn seat-${guest ? rsvpTone(guest.rsvp) : 'empty'}`}
                          onClick={() => onSelectSeat(selectedTable.id, i)}
                        >
                          <span className="seat-list-num">{i + 1}</span>
                          <span className="seat-list-name">
                            {guest ? (
                              <>
                                <strong>{initials(guest.name)}</strong> {guest.name}
                              </>
                            ) : (
                              <em>Empty</em>
                            )}
                          </span>
                        </button>
                        {guest && (
                          <button
                            type="button"
                            className="btn-icon"
                            aria-label={`Unassign ${guest.name}`}
                            onClick={() => unassignGuest(guest.id)}
                          >
                            ×
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            <div className="seating-unassigned">
              <h3>Unassigned guests</h3>
              <input
                className="filter-select seating-search"
                type="search"
                placeholder="Search guests…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <ul className="seating-guest-list">
                {unassigned.length === 0 && (
                  <li className="seating-empty">{search ? 'No matches' : 'Everyone is seated'}</li>
                )}
                {unassigned.map(g => (
                  <li key={g.id}>
                    <button
                      type="button"
                      className={`seating-guest-btn seat-${rsvpTone(g.rsvp)} ${pickingGuestId === g.id ? 'is-picking' : ''}`}
                      onClick={() => {
                        setPickingGuestId(g.id)
                        setPanelOpen(true)
                        // If a seat is already selected and empty, assign immediately
                        if (selectedTableId != null && selectedSeat != null) {
                          const t = seating.find(x => x.id === selectedTableId)
                          if (t && !t.guestIds?.[selectedSeat]) {
                            assignGuest(g.id, selectedTableId, selectedSeat)
                            return
                          }
                        }
                      }}
                    >
                      <span className="guest-initials">{initials(g.name)}</span>
                      <span className="guest-meta">
                        <strong>{g.name}</strong>
                        <small>{g.group} · {g.rsvp}</small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>

      {toast && <Toast message={toast} />}
    </PageShell>
  )
}
