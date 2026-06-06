import { Router } from 'express';
import { db } from '../db.js';
import { populateDefaultsIfEmpty } from '../seedData.js';

const router = Router();

router.post('/restore', (req, res) => {
  const { guests, checklist, budgetCategories, budgetItems, vendors, documents, timeline, config, bannerPhotos } = req.body;
  let restored = [];

  if (Array.isArray(guests) && guests.length > 0) {
    db.replaceAll('guest:', guests, g => `guest:${g.id}`);
    restored.push(`guests (${guests.length})`);
  }

  if (Array.isArray(checklist) && checklist.length > 0) {
    db.replaceAll('checklist:', checklist, t => `checklist:${t.id}`);
    restored.push(`checklist (${checklist.length})`);
  }

  if (Array.isArray(budgetCategories) && budgetCategories.length > 0) {
    db.list('budget:').forEach(k => db.delete(k));
    for (const cat of budgetCategories) {
      db.set(`budget:category:${cat.id}`, cat);
    }
    if (Array.isArray(budgetItems)) {
      for (const item of budgetItems) {
        db.set(`budget:item:${item.id}`, item);
      }
    }
    restored.push('budget');
  }

  if (Array.isArray(vendors) && vendors.length > 0) {
    db.replaceAll('vendor:', vendors, v => `vendor:${v.id}`);
    restored.push(`vendors (${vendors.length})`);
  }

  if (Array.isArray(documents) && documents.length > 0) {
    db.replaceAll('document:', documents, d => `document:${d.id}`);
    restored.push(`documents (${documents.length})`);
  }

  if (Array.isArray(timeline) && timeline.length > 0) {
    db.replaceAll('timeline:', timeline, e => `timeline:${e.id}`);
    restored.push(`timeline (${timeline.length})`);
  }

  if (config) {
    db.set('config:main', { ...db.get('config:main'), ...config });
    restored.push('config');
  }

  if (Array.isArray(bannerPhotos)) {
    db.set('config:bannerPhotos', bannerPhotos);
    restored.push('bannerPhotos');
  }

  const existing = db.get('meta:system') || {};
  db.set('meta:system', {
    ...existing,
    lastClientRestore: new Date().toISOString(),
    restored,
  });

  console.log(`[sync] Client restore: ${restored.join(', ') || 'nothing'}`);
  res.json({ ok: true, restored });
});

router.post('/populate-defaults', (_req, res) => {
  const populated = populateDefaultsIfEmpty();
  res.json({ ok: true, populated });
});

router.get('/backup', (_req, res) => {
  res.json({
    config: db.get('config:main'),
    bannerPhotos: db.get('config:bannerPhotos') || [],
    budget: {
      categories: db.list('budget:category:').map(k => db.get(k)),
      items: db.list('budget:item:').map(k => db.get(k)),
    },
    checklist: db.list('checklist:').map(k => db.get(k)),
    guests: db.list('guest:').map(k => db.get(k)),
    vendors: db.list('vendor:').map(k => db.get(k)),
    documents: db.list('document:').map(k => db.get(k)),
    timeline: db.list('timeline:').map(k => db.get(k)),
    meta: db.get('meta:system'),
  });
});

export default router;
