import { readCache } from './cache'
import { api } from './api'

export const GUEST_SEED_COUNT = 154
export const CHECKLIST_SEED_COUNT = 91

function guestFingerprint(guests) {
  return JSON.stringify(guests.map(g => ({
    id: g.id, name: g.name, group: g.group, rsvp: g.rsvp,
    dietary: g.dietary, tableNumber: g.tableNumber, notes: g.notes, inviteType: g.inviteType, address: g.address, inviteSent: g.inviteSent,
  })))
}

function checklistFingerprint(tasks) {
  return JSON.stringify(tasks.map(t => ({
    id: t.id, task: t.task, done: t.done, dueDate: t.dueDate,
    notes: t.notes, assignedTo: t.assignedTo,
  })))
}

export function serverLooksLikeFreshSeed(guests, checklist) {
  const guestsFresh =
    guests.length === GUEST_SEED_COUNT &&
    guests.every(g => g.rsvp === 'pending' && !g.dietary && !g.tableNumber)

  const checklistFresh =
    checklist.length === CHECKLIST_SEED_COUNT &&
    checklist.every(t => !t.done && !t.dueDate)

  return guestsFresh && checklistFresh
}

export function cacheHasUserEdits() {
  const guests = readCache('cache:guests', [])
  const checklist = readCache('cache:checklist', [])
  const budgetItems = readCache('cache:budgetItems', [])
  const vendors = readCache('cache:vendors', [])
  const documents = readCache('cache:documents', [])
  const timeline = readCache('cache:timeline', [])

  if (guests.some(g => g.rsvp !== 'pending' || g.dietary || g.tableNumber)) return true
  if (checklist.some(t => t.done || t.dueDate)) return true
  if (budgetItems.some(i =>
    (Number(i.paid) || 0) > 0 ||
    (Number(i.actual) || 0) !== (Number(i.estimate) || 0) ||
    (i.status && i.status !== 'Not Started') ||
    i.notes
  )) return true
  if (vendors.length > 0) return true
  if (documents.length > 0) return true
  if (timeline.length !== 17) return true
  if (timeline.some(e => e.notes)) return true

  const meta = readCache('cache:meta', null)
  if (meta?.hadUserEdits) return true

  return false
}

export function buildRestorePayload(serverGuests, serverChecklist) {
  if (!cacheHasUserEdits()) return null
  if (!serverLooksLikeFreshSeed(serverGuests, serverChecklist)) return null

  const guests = readCache('cache:guests', [])
  const checklist = readCache('cache:checklist', [])

  if (
    guestFingerprint(guests) === guestFingerprint(serverGuests) &&
    checklistFingerprint(checklist) === checklistFingerprint(serverChecklist)
  ) {
    return null
  }

  const payload = {}
  const budgetCategories = readCache('cache:budgetCategories', [])
  const budgetItems = readCache('cache:budgetItems', [])
  const vendors = readCache('cache:vendors', [])
  const documents = readCache('cache:documents', [])
  const timeline = readCache('cache:timeline', [])
  const config = readCache('cache:config', null)
  const bannerPhotos = readCache('cache:bannerPhotos', [])

  if (guests.length > 0) payload.guests = guests
  if (checklist.length > 0) payload.checklist = checklist
  if (budgetCategories.length > 0) payload.budgetCategories = budgetCategories
  if (budgetItems.length > 0) payload.budgetItems = budgetItems
  if (vendors.length > 0) payload.vendors = vendors
  if (documents.length > 0) payload.documents = documents
  if (timeline.length > 0) payload.timeline = timeline
  if (config) payload.config = config
  if (bannerPhotos.length > 0) payload.bannerPhotos = bannerPhotos

  return Object.keys(payload).length > 0 ? payload : null
}

export function wouldPoisonCache(serverGuests, serverChecklist) {
  return cacheHasUserEdits() && serverLooksLikeFreshSeed(serverGuests, serverChecklist)
}

export async function restoreFromCacheIfNeeded(serverGuests, serverChecklist) {
  const payload = buildRestorePayload(serverGuests, serverChecklist)
  if (!payload) return null

  console.info('[sync] Server reset detected — restoring your data from browser cache...')
  await api.post('/api/sync/restore', payload)
  return payload
}
