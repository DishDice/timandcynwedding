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
  const [mobileView, setMobileView] = useState('list')
  const [toast, setToast] = useState('')
  const newFileRef = useRef(null)
  const appendFileRef = useRef(null)

  const selected = notes.find(n => n.id === selectedId) ?? null

  useEffect(() => {
    api.get('/api/notes')
      .then(data => {
        setNotes(data)
        if (data.length > 0) setSelectedId(prev => prev ?? data[0].id)
      })
      .catch(() => setToast('Failed to load notes'))
  }, [])

  const openNote = (id) => {
    setSelectedId(id)
    setMobileView('viewer')
  }

  const backToList = () => {
    setMobileView('list')
  }

  const deleteNote = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this note?')) return
    const snapshot = notes
    const next = notes.filter(n => n.id !== id)
    setNotes(next)
    if (selectedId === id) {
      setSelectedId(next[0]?.id ?? null)
      setMobileView('list')
    }
    try {
      await api.del(`/api/notes/${id}`)
    } catch {
      setNotes(snapshot)
      setToast('Failed to delete')
    }
  }

  const handleNewUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      const content = await file.text()
      const defaultTitle = file.name.replace(/\.md$/i, '')
      const title = window.prompt('Note title:', defaultTitle)
      if (!title?.trim()) return
      const created = await api.post('/api/notes', { title: title.trim(), content })
      setNotes(prev => [created, ...prev].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)))
      setSelectedId(created.id)
      setMobileView('viewer')
      setToast('Note created')
    } catch (err) {
      setToast(err.message || 'Failed to upload')
    }
  }

  const handleAppendUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !selected) return

    try {
      const content = await file.text()
      const updated = await api.patch(`/api/notes/${selected.id}`, { content })
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)))
      setToast(`Appended to "${selected.title}"`)
    } catch (err) {
      setToast(err.message || 'Failed to append')
    }
  }

  return (
    <PageShell>
      <div className="page-header notes-page-header">
        <h2>Notes</h2>
        <p>Upload and read markdown notes — create a new one or append to an existing note.</p>
      </div>

      <div className="filter-bar notes-toolbar">
        <button type="button" className="btn btn-primary" onClick={() => newFileRef.current?.click()}>
          <span aria-hidden="true">＋</span> New note from .md
        </button>
        <input
          ref={newFileRef}
          type="file"
          accept=".md,text/markdown"
          style={{ display: 'none' }}
          onChange={handleNewUpload}
        />
      </div>

      <div className={`notes-layout notes-view-${mobileView}`}>
        <aside className="card notes-list" aria-label="Notes list">
          {notes.length === 0 ? (
            <p className="card-list-empty notes-empty">
              <span className="notes-empty-icon" aria-hidden="true">📝</span>
              No notes yet
              <span className="notes-empty-sub">Upload a .md file to get started</span>
            </p>
          ) : (
            <>
              <div className="notes-list-header">
                <span>{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span>
              </div>
              <div className="notes-list-scroll">
                {notes.map(note => (
                  <div
                    key={note.id}
                    className={`notes-list-item ${note.id === selectedId ? 'active' : ''}`}
                    onClick={() => openNote(note.id)}
                    onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openNote(note.id) } }}
                    role="button"
                    tabIndex={0}
                    aria-current={note.id === selectedId ? 'true' : undefined}
                  >
                    <div className="notes-list-item-main">
                      <div className="notes-list-title">{note.title}</div>
                      <div className="notes-list-date">{formatUpdated(note.updatedAt)}</div>
                    </div>
                    <button
                      type="button"
                      className="btn-icon notes-list-delete"
                      aria-label={`Delete ${note.title}`}
                      onClick={ev => deleteNote(note.id, ev)}
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>

        <section className="card notes-viewer" aria-label="Note content">
          {selected ? (
            <>
              <header className="notes-viewer-header">
                <button
                  type="button"
                  className="notes-back-btn"
                  onClick={backToList}
                  aria-label="Back to notes list"
                >
                  <span aria-hidden="true">←</span> Notes
                </button>
                <div className="notes-viewer-title-wrap">
                  <h3 className="notes-viewer-title">{selected.title}</h3>
                  <div className="notes-viewer-meta">Updated {formatUpdated(selected.updatedAt)}</div>
                </div>
                <div className="notes-viewer-actions">
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => appendFileRef.current?.click()}
                    title={`Append a .md file to "${selected.title}"`}
                  >
                    <span aria-hidden="true">＋</span> Append .md
                  </button>
                  <input
                    ref={appendFileRef}
                    type="file"
                    accept=".md,text/markdown"
                    style={{ display: 'none' }}
                    onChange={handleAppendUpload}
                  />
                </div>
              </header>
              <div
                className="note-content"
                dangerouslySetInnerHTML={{ __html: marked.parse(selected.content) }}
              />
            </>
          ) : (
            <div className="notes-empty notes-empty-viewer">
              <span className="notes-empty-icon" aria-hidden="true">📄</span>
              Select a note to read
              <span className="notes-empty-sub">Or upload a new .md file</span>
            </div>
          )}
        </section>
      </div>

      <Toast message={toast} onClose={() => setToast('')} />
    </PageShell>
  )
}
