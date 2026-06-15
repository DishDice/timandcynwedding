import { db } from './db.js';
import { BUDGET_CATEGORIES } from './budgetSeed.js';
import { CHECKLIST_TASKS } from './checklistSeed.js';
import { GUEST_SEED } from './guestSeed.js';

let idCounter = Date.now();

function nextId() {
  return String(++idCounter);
}

const TIMELINE_SEED = [
  { time: '08:00', event: 'Hair & makeup begins', location: 'Bridal suite', responsible: 'Bridal party', notes: '' },
  { time: '10:00', event: 'Groom & groomsmen getting ready', location: 'Groom suite', responsible: 'Groomsmen', notes: '' },
  { time: '11:30', event: 'Photographer arrives — detail shots', location: 'Venue', responsible: 'Photographer', notes: '' },
  { time: '12:30', event: 'First look (optional)', location: 'Garden', responsible: 'Couple', notes: '' },
  { time: '13:00', event: 'Guests seated for ceremony', location: 'Ceremony space', responsible: 'Ushers', notes: '' },
  { time: '13:30', event: 'Ceremony begins', location: 'Ceremony space', responsible: 'Celebrant', notes: '' },
  { time: '14:15', event: 'Confetti / receiving line', location: 'Ceremony exit', responsible: 'All', notes: '' },
  { time: '14:30', event: 'Group & couple photos', location: 'Grounds', responsible: 'Photographer', notes: '' },
  { time: '15:30', event: 'Cocktail hour', location: 'Terrace', responsible: 'Catering', notes: '' },
  { time: '16:30', event: 'Guests move to reception', location: 'Main hall', responsible: 'Coordinator', notes: '' },
  { time: '17:00', event: 'Grand entrance & first dance', location: 'Dance floor', responsible: 'DJ', notes: '' },
  { time: '17:30', event: 'Speeches & toasts', location: 'Main hall', responsible: 'Best man / MOH', notes: '' },
  { time: '18:00', event: 'Sit-down dinner served', location: 'Main hall', responsible: 'Catering', notes: '' },
  { time: '19:30', event: 'Cake cutting', location: 'Main hall', responsible: 'Couple', notes: '' },
  { time: '20:00', event: 'Open dancing', location: 'Dance floor', responsible: 'DJ', notes: '' },
  { time: '21:30', event: 'Evening snacks & last orders', location: 'Bar', responsible: 'Catering', notes: '' },
  { time: '23:00', event: 'Sparkler send-off / end of night', location: 'Venue entrance', responsible: 'All', notes: '' },
];

function seedBudget() {
  let order = 0;
  for (const cat of BUDGET_CATEGORIES) {
    const categoryId = nextId();
    db.set(`budget:category:${categoryId}`, {
      id: categoryId,
      name: cat.name,
      order: order++,
      collapsed: false,
    });
    let itemOrder = 0;
    for (const item of cat.items) {
      const itemId = nextId();
      const actual = item.actual ?? 0;
      const paid = item.paid ?? 0;
      db.set(`budget:item:${itemId}`, {
        id: itemId,
        categoryId,
        item: item.item,
        vendor: item.vendor || '',
        estimate: item.estimate ?? 0,
        actual,
        paid,
        outstanding: actual - paid,
        dueDate: item.dueDate || '',
        status: item.status || 'Not Started',
        notes: item.notes || '',
        order: itemOrder++,
      });
    }
  }
}

function seedChecklist() {
  let order = 0;
  for (const task of CHECKLIST_TASKS) {
    const id = nextId();
    db.set(`checklist:${id}`, {
      id,
      section: task.section,
      task: task.task,
      assignedTo: task.assignedTo,
      dueDate: '',
      notes: task.notes || '',
      done: false,
      order: order++,
    });
  }
}

function seedGuests() {
  let order = 0;
  for (const guest of GUEST_SEED) {
    const id = nextId();
    db.set(`guest:${id}`, {
      id,
      name: guest.name,
      group: guest.group,
      rsvp: guest.rsvp,
      dietary: guest.dietary,
      tableNumber: guest.tableNumber,
      notes: guest.notes,
      inviteType: guest.inviteType || '',
      order: order++,
    });
  }
}

function seedTimeline() {
  let order = 0;
  for (const entry of TIMELINE_SEED) {
    const id = nextId();
    db.set(`timeline:${id}`, { id, ...entry, order: order++ });
  }
}

/**
 * Populate default wedding data only for collections that are currently empty.
 * Never overwrites existing records.
 */
export function populateDefaultsIfEmpty() {
  const populated = [];

  if (db.list('budget:').length === 0) {
    seedBudget();
    populated.push('budget');
  }

  if (db.list('checklist:').length === 0) {
    seedChecklist();
    populated.push(`checklist (${CHECKLIST_TASKS.length} tasks)`);
  }

  if (db.list('guest:').length === 0) {
    seedGuests();
    populated.push(`guests (${GUEST_SEED.length})`);
  }

  if (db.list('timeline:').length === 0) {
    seedTimeline();
    populated.push(`timeline (${TIMELINE_SEED.length} entries)`);
  }

  if (populated.length > 0) {
    const existing = db.get('meta:system') || {};
    db.set('meta:system', {
      ...existing,
      lastPopulate: new Date().toISOString(),
      populated,
    });
    console.log(`[seed] Populated empty collections: ${populated.join(', ')}`);
  }

  return populated;
}
