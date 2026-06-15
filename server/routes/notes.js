import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const notes = db.list('note:')
    .map(k => db.get(k))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(notes);
});

router.post('/', (req, res) => {
  const { title, content } = req.body;
  if (!title?.trim() || content == null) {
    return res.status(400).json({ error: 'title and content are required' });
  }
  const now = new Date().toISOString();
  const id = String(Date.now());
  const note = {
    id,
    title: title.trim(),
    content: String(content),
    createdAt: now,
    updatedAt: now,
  };
  db.set(`note:${id}`, note);
  res.json(note);
});

router.patch('/:id', (req, res) => {
  const key = `note:${req.params.id}`;
  const current = db.get(key);
  if (!current) return res.status(404).json({ error: 'Not found' });
  const { content } = req.body;
  if (content == null) {
    return res.status(400).json({ error: 'content is required' });
  }
  const updated = {
    ...current,
    content: `${current.content}\n\n---\n\n${String(content)}`,
    updatedAt: new Date().toISOString(),
  };
  db.set(key, updated);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const key = `note:${req.params.id}`;
  if (!db.get(key)) return res.status(404).json({ error: 'Not found' });
  db.delete(key);
  res.json({ ok: true });
});

export default router;
