import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const vendors = db.list('vendor:')
    .map(k => db.get(k))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  res.json(vendors);
});

router.post('/', (req, res) => {
  const id = String(Date.now());
  const vendor = {
    id,
    name: req.body.name || '',
    category: req.body.category || '',
    contactName: '',
    phone: '',
    email: '',
    contractStatus: 'None',
    depositPaid: false,
    depositAmount: 0,
    balanceDue: 0,
    paymentDueDate: '',
    notes: '',
  };
  db.set(`vendor:${id}`, vendor);
  res.json(vendor);
});

router.put('/:id', (req, res) => {
  const key = `vendor:${req.params.id}`;
  const current = db.get(key);
  if (!current) return res.status(404).json({ error: 'Not found' });
  const updated = { ...current, ...req.body };
  db.set(key, updated);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  db.delete(`vendor:${req.params.id}`);
  res.json({ ok: true });
});

export default router;
