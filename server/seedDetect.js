import { db } from './db.js';

export const GUEST_SEED_COUNT = 154;
export const CHECKLIST_SEED_COUNT = 91;

export function looksLikeFreshSeed(guests, checklist) {
  const guestsFresh =
    guests.length === GUEST_SEED_COUNT &&
    guests.every(g => g.rsvp === 'pending' && !g.dietary && !g.tableNumber);

  const checklistFresh =
    checklist.length === CHECKLIST_SEED_COUNT &&
    checklist.every(t => !t.done && !t.dueDate);

  return guestsFresh && checklistFresh;
}

export function getSeedDiagnostics() {
  const guests = db.list('guest:').map(k => db.get(k));
  const checklist = db.list('checklist:').map(k => db.get(k));
  const meta = db.get('meta:system');

  return {
    guestCount: guests.length,
    checklistCount: checklist.length,
    likelyFreshSeed: looksLikeFreshSeed(guests, checklist),
    meta,
  };
}
