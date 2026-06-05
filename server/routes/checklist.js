import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const tasks = db.list('checklist:')
    .map(k => db.get(k))
    .sort((a, b) => a.order - b.order);
  res.json(tasks);
});

router.post('/', (req, res) => {
  const id = String(Date.now());
  const tasks = db.list('checklist:').map(k => db.get(k));
  const order = tasks.length;
  const task = {
    id,
    section: req.body.section || 'General',
    task: req.body.task || 'New task',
    assignedTo: req.body.assignedTo || 'Both',
    dueDate: '',
    notes: '',
    done: false,
    order,
  };
  db.set(`checklist:${id}`, task);
  res.json(task);
});

router.put('/:id', (req, res) => {
  const key = `checklist:${req.params.id}`;
  const current = db.get(key);
  if (!current) return res.status(404).json({ error: 'Not found' });
  const updated = { ...current, ...req.body };
  db.set(key, updated);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  db.delete(`checklist:${req.params.id}`);
  res.json({ ok: true });
});

export default router;
