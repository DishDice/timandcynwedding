import { Router } from 'express';
import { db } from '../db.js';
import { SEATING_SEED } from '../seatingSeed.js';

const router = Router();

function listTables() {
  return db.list('seating:')
    .map(k => db.get(k))
    .filter(Boolean)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function normalizeGuestIds(table) {
  const seats = Math.max(1, Number(table.seats) || 10);
  const ids = Array.isArray(table.guestIds) ? [...table.guestIds] : [];
  while (ids.length < seats) ids.push(null);
  if (ids.length > seats) ids.length = seats;
  return ids.map(id => (id == null || id === '' ? null : String(id)));
}

router.get('/', (_req, res) => {
  res.json(listTables());
});

router.post('/seed-defaults', (_req, res) => {
  if (db.list('seating:').length > 0) {
    return res.status(409).json({ error: 'Seating tables already exist' });
  }
  let order = 0;
  for (const t of SEATING_SEED) {
    const id = String(Date.now() + order);
    db.set(`seating:${id}`, {
      id,
      ...t,
      guestIds: Array(t.seats).fill(null),
      order: order++,
    });
  }
  res.json(listTables());
});

router.post('/', (req, res) => {
  const id = String(Date.now());
  const existing = listTables();
  const seats = Math.max(1, Math.min(20, Number(req.body.seats) || 10));
  const kind = req.body.kind === 'rect' ? 'rect' : 'round';
  const table = {
    id,
    label: String(req.body.label || `T${existing.length + 1}`),
    kind,
    x: Number(req.body.x) || 800,
    y: Number(req.body.y) || 500,
    seats,
    width: kind === 'rect' ? (Number(req.body.width) || 220) : 0,
    height: kind === 'rect' ? (Number(req.body.height) || 40) : 0,
    locked: false,
    guestIds: Array(seats).fill(null),
    order: existing.length,
  };
  db.set(`seating:${id}`, table);
  res.json(table);
});

router.put('/:id', (req, res) => {
  const key = `seating:${req.params.id}`;
  const current = db.get(key);
  if (!current) return res.status(404).json({ error: 'Not found' });

  const next = { ...current, ...req.body, id: current.id };
  if (req.body.seats != null || req.body.guestIds != null) {
    next.seats = Math.max(1, Math.min(20, Number(next.seats) || current.seats || 10));
    next.guestIds = normalizeGuestIds(next);
  }
  db.set(key, next);
  res.json(next);
});

/** Assign / unassign a guest to a seat. Clears the guest from any other table seat. */
router.post('/assign', (req, res) => {
  const { guestId, tableId, seatIndex } = req.body;
  if (!guestId) return res.status(400).json({ error: 'guestId required' });

  const guestKey = `guest:${guestId}`;
  const guest = db.get(guestKey);
  if (!guest) return res.status(404).json({ error: 'Guest not found' });

  // Remove guest from every table first
  for (const key of db.list('seating:')) {
    const t = db.get(key);
    if (!t || !Array.isArray(t.guestIds)) continue;
    const ids = normalizeGuestIds(t);
    let changed = false;
    for (let i = 0; i < ids.length; i++) {
      if (ids[i] === String(guestId)) {
        ids[i] = null;
        changed = true;
      }
    }
    if (changed) db.set(key, { ...t, guestIds: ids });
  }

  // Unassign only
  if (!tableId) {
    db.set(guestKey, { ...guest, tableNumber: '' });
    return res.json({ guest: db.get(guestKey), tables: listTables() });
  }

  const tableKey = `seating:${tableId}`;
  const table = db.get(tableKey);
  if (!table) return res.status(404).json({ error: 'Table not found' });

  const ids = normalizeGuestIds(table);
  let idx = Number(seatIndex);
  if (!Number.isInteger(idx) || idx < 0 || idx >= ids.length) {
    idx = ids.findIndex(id => id == null);
  }
  if (idx < 0) return res.status(400).json({ error: 'Table is full' });

  // If target seat occupied, clear that guest's tableNumber
  if (ids[idx]) {
    const other = db.get(`guest:${ids[idx]}`);
    if (other) db.set(`guest:${ids[idx]}`, { ...other, tableNumber: '' });
  }

  ids[idx] = String(guestId);
  db.set(tableKey, { ...table, guestIds: ids });
  db.set(guestKey, { ...guest, tableNumber: String(table.label) });

  res.json({ guest: db.get(guestKey), tables: listTables() });
});

router.delete('/:id', (req, res) => {
  const key = `seating:${req.params.id}`;
  const table = db.get(key);
  if (!table) return res.status(404).json({ error: 'Not found' });

  const ids = normalizeGuestIds(table);
  for (const gid of ids) {
    if (!gid) continue;
    const g = db.get(`guest:${gid}`);
    if (g) db.set(`guest:${gid}`, { ...g, tableNumber: '' });
  }

  db.delete(key);
  res.json({ ok: true });
});

export default router;
