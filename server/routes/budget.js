import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

function getBudgetData() {
  const categories = db.list('budget:category:')
    .map(k => db.get(k))
    .sort((a, b) => a.order - b.order);

  const items = db.list('budget:item:')
    .map(k => db.get(k))
    .sort((a, b) => a.order - b.order);

  return { categories, items };
}

function calcOutstanding(item) {
  const actual = Number(item.actual) || 0;
  const paid = Number(item.paid) || 0;
  return actual - paid;
}

router.get('/', (_req, res) => {
  res.json(getBudgetData());
});

router.post('/category', (req, res) => {
  const id = String(Date.now());
  const categories = db.list('budget:category:').map(k => db.get(k));
  const order = categories.length;
  const category = { id, name: req.body.name || 'New Category', order, collapsed: false };
  db.set(`budget:category:${id}`, category);
  res.json(category);
});

router.put('/category/:id', (req, res) => {
  const key = `budget:category:${req.params.id}`;
  const current = db.get(key);
  if (!current) return res.status(404).json({ error: 'Not found' });
  const updated = { ...current, ...req.body };
  db.set(key, updated);
  res.json(updated);
});

router.delete('/category/:id', (req, res) => {
  const catId = req.params.id;
  db.delete(`budget:category:${catId}`);
  db.list('budget:item:').forEach(k => {
    const item = db.get(k);
    if (item?.categoryId === catId) db.delete(k);
  });
  res.json({ ok: true });
});

router.post('/item', (req, res) => {
  const id = String(Date.now());
  const categoryItems = db.list('budget:item:')
    .map(k => db.get(k))
    .filter(i => i.categoryId === req.body.categoryId);
  const order = categoryItems.length;
  const item = {
    id,
    categoryId: req.body.categoryId,
    item: req.body.item || 'New Item',
    vendor: '',
    estimate: 0,
    actual: 0,
    paid: 0,
    outstanding: 0,
    dueDate: '',
    status: 'Not Started',
    notes: '',
    order,
  };
  db.set(`budget:item:${id}`, item);
  res.json(item);
});

router.put('/item/:id', (req, res) => {
  const key = `budget:item:${req.params.id}`;
  const current = db.get(key);
  if (!current) return res.status(404).json({ error: 'Not found' });
  const updated = { ...current, ...req.body };
  updated.outstanding = calcOutstanding(updated);
  db.set(key, updated);
  res.json(updated);
});

router.delete('/item/:id', (req, res) => {
  db.delete(`budget:item:${req.params.id}`);
  res.json({ ok: true });
});

export default router;
