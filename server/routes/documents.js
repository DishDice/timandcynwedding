import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const documents = db.list('document:')
    .map(k => db.get(k))
    .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  res.json(documents);
});

router.post('/', (req, res) => {
  const id = String(Date.now());
  const doc = {
    id,
    name: req.body.name || 'New Document',
    category: req.body.category || 'Other',
    vendor: '',
    url: '',
    dateAdded: new Date().toISOString().split('T')[0],
    notes: '',
  };
  db.set(`document:${id}`, doc);
  res.json(doc);
});

router.put('/:id', (req, res) => {
  const key = `document:${req.params.id}`;
  const current = db.get(key);
  if (!current) return res.status(404).json({ error: 'Not found' });
  const updated = { ...current, ...req.body };
  db.set(key, updated);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  db.delete(`document:${req.params.id}`);
  res.json({ ok: true });
});

export default router;
