import { useState, useEffect, useRef } from 'react'
import { marked } from 'marked'
import { api } from '../api'
import { Toast } from '../components/Toast'
import { PageShell } from '../components/PageShell'

function formatUpdated(iso) {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [toast, setToast] = useState('')
  const fileRef = useRef(null)

  const selected = notes.find(n => n.id === selectedId) ?? null

  useEffect(() => {
    api.get('/api/notes')
      .then(data => {
        setNotes(data)
        if (data.length > 0) setSelectedId(prev => prev ?? data[0].id)
      })
      .catch(() => setToast('Failed to load notes'))
  }, [])

  const deleteNote = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this note?')) return
    const snapshot = notes
    const next = notes.filter(n => n.id !== id)
    setNotes(next)
    if (selectedId === id) setSelectedId(next[0]?.id ?? null)
    try {
      await api.del(`/api/notes/${id}`)
    } catch {
      setNotes(snapshot)
      setToast('Failed to delete')
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      const content = await file.text()

      if (selected) {
        const updated = await api.patch(`/api/notes/${selected.id}`, { content })
        setNotes(prev => prev.map(n => n.id === updated.id ? updated : n)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)))
        setToast('Content appended to note')
      } else {
        const defaultTitle = file.name.replace(/\.md$/i, '')
        const title = window.prompt('Note title:', defaultTitle)
        if (!title?.trim()) return
        const created = await api.post('/api/notes', { title: title.trim(), content })
        setNotes(prev => [created, ...prev].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)))
        setSelectedId(created.id)
        setToast('Note created')
      }
    } catch (err) {
      setToast(err.message || 'Failed to upload')
    }
  }

  return (
    <PageShell>
      <div className="page-header">
        <h2>Notes</h2>
        <p>Upload and read markdown notes</p>
      </div>

      <div className="filter-bar">
        <button type="button" className="btn btn-primary" onClick={() => fileRef.current?.click()}>
          Upload .md file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".md,text/markdown"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
        {selected && (
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Upload will append to: <strong>{selected.title}</strong>
          </span>
        )}
      </div>

      <div className="notes-layout">
        <div className="card notes-list">
          {notes.length === 0 ? (
            <p className="card-list-empty">No notes yet — upload a .md file to get started.</p>
          ) : (
            notes.map(note => (
              <div
                key={note.id}
                className={`notes-list-item ${note.id === selectedId ? 'active' : ''}`}
                onClick={() => setSelectedId(note.id)}
                onKeyDown={ev => { if (ev.key === 'Enter') setSelectedId(note.id) }}
                role="button"
                tabIndex={0}
              >
                <div className="notes-list-item-main">
                  <div className="notes-list-title">{note.title}</div>
                  <div className="notes-list-date">{formatUpdated(note.updatedAt)}</div>
                </div>
                <button
                  type="button"
                  className="btn-icon"
                  aria-label={`Delete ${note.title}`}
                  onClick={ev => deleteNote(note.id, ev)}
                >
                  🗑
                </button>
              </div>
            ))
          )}
        </div>

        <div className="card notes-viewer">
          {selected ? (
            <div
              className="note-content"
              dangerouslySetInnerHTML={{ __html: marked.parse(selected.content) }}
            />
          ) : (
            <p className="card-list-empty">Select a note or upload a .md file.</p>
          )}
        </div>
      </div>

      <Toast message={toast} onClose={() => setToast('')} />
    </PageShell>
  )
}
