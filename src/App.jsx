import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { PersistentRoutes } from './components/PersistentRoutes'
import { DataProvider } from './DataContext'

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
        {error && <p className="pin-error" id="pin-error" role="alert">{error}</p>}
        <label htmlFor="pin-input" className="visually-hidden">PIN</label>
        <input
          id="pin-input"
          className="pin-input"
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          autoFocus
          aria-describedby={error ? 'pin-error' : undefined}
          aria-label="4-digit PIN"
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
    <DataProvider>
      <div className="app-layout">
        <Sidebar />
        <main id="main-content" className="main-content">
          <PersistentRoutes />
        </main>
      </div>
    </DataProvider>
  )
}
