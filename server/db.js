import fs from 'fs';
import { getDataDir, getDbPath, isPersistentStorage } from './paths.js';

export const DB_PATH = getDbPath();

/**
 * Notes — stored as `note:${id}` in db.json
 * { id, title, content, createdAt, updatedAt }
 */

let cache = null;
let corrupt = false;

function loadCache() {
  if (cache !== null) return cache;
  const dataDir = getDataDir();
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}));
    console.log(`[db] Created new database at ${DB_PATH}`);
  }
  try {
    cache = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    console.log(`[db] Loaded ${Object.keys(cache).length} records from ${DB_PATH}`);
  } catch (err) {
    const backupPath = `${DB_PATH}.corrupt.${Date.now()}.bak`;
    try {
      fs.copyFileSync(DB_PATH, backupPath);
      console.error(`[db] db.json corrupted — backed up to ${backupPath}. Original file preserved.`);
    } catch (backupErr) {
      console.error('[db] db.json corrupted and backup failed:', backupErr.message);
    }
    corrupt = true;
    cache = {};
    console.error('[db] Refusing to overwrite corrupt db.json. Restore from backup or fix manually.');
  }
  return cache;
}

function writeBackup() {
  if (corrupt || !fs.existsSync(DB_PATH)) return;
  try {
    const backupPath = `${DB_PATH}.bak`;
    fs.copyFileSync(DB_PATH, backupPath);
  } catch {
    // non-fatal
  }
}

function persist() {
  if (corrupt) {
    console.error('[db] Skipping persist — database is in corrupt recovery mode');
    return;
  }
  writeBackup();
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2));
  fs.renameSync(tmp, DB_PATH);
}

export function getDbInfo() {
  loadCache();
  return {
    path: DB_PATH,
    dataDir: getDataDir(),
    fileExists: fs.existsSync(DB_PATH),
    records: Object.keys(cache).length,
    corrupt,
    persistent: isPersistentStorage(),
  };
}

export const db = {
  get:    (key)        => loadCache()[key] ?? null,
  set:    (key, value) => { loadCache(); cache[key] = value; persist(); },
  delete: (key)        => { loadCache(); delete cache[key]; persist(); },
  list:   (prefix)     => Object.keys(loadCache()).filter(k => k.startsWith(prefix)),
  isCorrupt: () => corrupt,
  replaceAll: (prefix, items, keyFn) => {
    loadCache();
    for (const key of Object.keys(cache).filter(k => k.startsWith(prefix))) {
      delete cache[key];
    }
    for (const item of items) {
      cache[keyFn(item)] = item;
    }
    persist();
  },
};
