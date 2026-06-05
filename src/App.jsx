import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Budget from './pages/Budget'
import Vendors from './pages/Vendors'
import Checklist from './pages/Checklist'
import Guests from './pages/Guests'
import Documents from './pages/Documents'
import DayTimeline from './pages/DayTimeline'

function PinGate({ onSuccess }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    const data = await res.json()
    if (data.ok) {
      sessionStorage.setItem('pin', pin)
      onSuccess()
    } else {
      setError('Incorrect PIN. Try again.')
    }
  }

  return (
    <div className="pin-gate">
      <form className="pin-card" onSubmit={handleSubmit}>
        <h1>Tim & Cyn</h1>
        <p>Enter your PIN to access the wedding hub</p>
        {error && <p className="pin-error">{error}</p>}
        <input
          className="pin-input"
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          autoFocus
        />
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
          Enter
        </button>
      </form>
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    const pin = sessionStorage.getItem('pin')
    if (pin) {
      fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pin': pin },
        body: JSON.stringify({ pin }),
      })
        .then(r => r.json())
        .then(data => { if (data.ok) setAuthed(true) })
    }
  }, [])

  if (!authed) return <PinGate onSuccess={() => setAuthed(true)} />

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/checklist" element={<Checklist />} />
          <Route path="/guests" element={<Guests />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/timeline" element={<DayTimeline />} />
        </Routes>
      </main>
    </div>
  )
}
