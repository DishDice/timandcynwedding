import { db } from './db.js';
import { isPersistentStorage } from './paths.js';
import { populateDefaultsIfEmpty } from './seedData.js';
import { reconcileBannerPhotos } from './bannerStorage.js';

/**
 * Startup initialisation — file I/O rules:
 * - db.json is created empty by db.js only if it does not exist
 * - Existing records are never seeded, reset, or overwritten
 * - Only missing config keys receive default values
 */
export function runStartup() {
  console.log('[init] Running startup checks...');

  if (!isPersistentStorage()) {
    console.warn('[init] WARNING: DB_DATA_DIR is not set. Data will use a local fallback directory and will NOT survive Railway redeploys.');
  } else {
    console.log(`[init] DB_DATA_DIR=${process.env.DB_DATA_DIR}`);
  }

  if (!db.get('config:main')) {
    db.set('config:main', {
      coupleNames: 'Tim & Cyn',
      weddingDate: '2026-10-10',
      totalBudget: 70000,
    });
    console.log('[init] Created default config:main (file did not contain one)');
  }

  if (!db.get('config:bannerPhotos')) {
    db.set('config:bannerPhotos', []);
    console.log('[init] Created default config:bannerPhotos (file did not contain one)');
  }

  if (!db.get('meta:system')) {
    db.set('meta:system', {
      initializedAt: new Date().toISOString(),
      version: 1,
    });
    console.log('[init] Marked database as initialised');
  }

  const populated = populateDefaultsIfEmpty();
  if (populated.length === 0) {
    console.log('[init] Existing data loaded — no empty collections to populate');
  }

  const banner = reconcileBannerPhotos();
  console.log(`[init] Banner storage: ${banner.dir} (${banner.filesOnDisk} file(s), ${banner.urlsInDb} in db)`);

  return populated;
}
