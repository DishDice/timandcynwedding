import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const guests = db.list('guest:')
    .map(k => db.get(k))
    .sort((a, b) => a.order - b.order);
  res.json(guests);
});

router.post('/', (req, res) => {
  const id = String(Date.now());
  const guests = db.list('guest:').map(k => db.get(k));
  const order = guests.length;
  const guest = {
    id,
    name: req.body.name || 'New Guest',
    group: req.body.group || 'Tim Friends',
    rsvp: 'pending',
    dietary: '',
    tableNumber: '',
    notes: '',
    order,
  };
  db.set(`guest:${id}`, guest);
  res.json(guest);
});

router.put('/:id', (req, res) => {
  const key = `guest:${req.params.id}`;
  const current = db.get(key);
  if (!current) return res.status(404).json({ error: 'Not found' });
  const updated = { ...current, ...req.body };
  db.set(key, updated);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  db.delete(`guest:${req.params.id}`);
  res.json({ ok: true });
});

export default router;
