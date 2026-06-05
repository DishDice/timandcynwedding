import { readCache } from './cache'
import { api } from './api'

const GUEST_SEED_COUNT = 154
const CHECKLIST_SEED_COUNT = 91

function guestFingerprint(guests) {
  return JSON.stringify(guests.map(g => ({
    id: g.id, name: g.name, group: g.group, rsvp: g.rsvp,
    dietary: g.dietary, tableNumber: g.tableNumber, notes: g.notes,
  })))
}

function checklistFingerprint(tasks) {
  return JSON.stringify(tasks.map(t => ({
    id: t.id, task: t.task, done: t.done, dueDate: t.dueDate,
    notes: t.notes, assignedTo: t.assignedTo,
  })))
}

function looksLikeFreshGuestSeed(guests) {
  if (guests.length !== GUEST_SEED_COUNT) return false
  return guests.every(g => g.rsvp === 'pending' && !g.dietary && !g.tableNumber && !g.notes)
}

function looksLikeFreshChecklistSeed(tasks) {
  if (tasks.length !== CHECKLIST_SEED_COUNT) return false
  return tasks.every(t => !t.done && !t.dueDate && !t.notes)
}

export function detectStaleServer(serverGuests, serverChecklist) {
  const cachedGuests = readCache('cache:guests', [])
  const cachedChecklist = readCache('cache:checklist', [])

  const restore = {}

  if (
    cachedGuests.length > 0 &&
    guestFingerprint(cachedGuests) !== guestFingerprint(serverGuests) &&
    looksLikeFreshGuestSeed(serverGuests)
  ) {
    restore.guests = cachedGuests
  }

  if (
    cachedChecklist.length > 0 &&
    checklistFingerprint(cachedChecklist) !== checklistFingerprint(serverChecklist) &&
    looksLikeFreshChecklistSeed(serverChecklist)
  ) {
    restore.checklist = cachedChecklist
  }

  return restore
}

export async function restoreFromCacheIfNeeded(serverGuests, serverChecklist) {
  const payload = detectStaleServer(serverGuests, serverChecklist)
  if (!payload.guests && !payload.checklist) return null

  console.info('[sync] Server reset detected — restoring your data from browser cache...')
  await api.post('/api/sync/restore', payload)
  return payload
}
