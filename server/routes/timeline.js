import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const entries = db.list('timeline:')
    .map(k => db.get(k))
    .sort((a, b) => a.order - b.order);
  res.json(entries);
});

router.post('/', (req, res) => {
  const id = String(Date.now());
  const entries = db.list('timeline:').map(k => db.get(k));
  const order = entries.length;
  const entry = {
    id,
    time: req.body.time || '12:00',
    event: req.body.event || 'New event',
    location: '',
    responsible: '',
    notes: '',
    order,
  };
  db.set(`timeline:${id}`, entry);
  res.json(entry);
});

router.put('/reorder/all', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' });
  ids.forEach((id, index) => {
    const key = `timeline:${id}`;
    const current = db.get(key);
    if (current) {
      db.set(key, { ...current, order: index });
    }
  });
  const entries = db.list('timeline:')
    .map(k => db.get(k))
    .sort((a, b) => a.order - b.order);
  res.json(entries);
});

router.put('/:id', (req, res) => {
  const key = `timeline:${req.params.id}`;
  const current = db.get(key);
  if (!current) return res.status(404).json({ error: 'Not found' });
  const updated = { ...current, ...req.body };
  db.set(key, updated);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  db.delete(`timeline:${req.params.id}`);
  res.json({ ok: true });
});

export default router;
