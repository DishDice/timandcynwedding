import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'db.json');

let cache = null;
let corrupt = false;

function loadCache() {
  if (cache !== null) return cache;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}));
  }
  try {
    cache = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    console.log(`[db] Loaded ${Object.keys(cache).length} records from disk`);
  } catch (err) {
    const backupPath = `${DB_PATH}.corrupt.${Date.now()}.bak`;
    try {
      fs.copyFileSync(DB_PATH, backupPath);
      console.error(`[db] db.json corrupted — backed up to ${path.basename(backupPath)}. Original file preserved.`);
    } catch (backupErr) {
      console.error('[db] db.json corrupted and backup failed:', backupErr.message);
    }
    corrupt = true;
    cache = {};
    console.error('[db] Refusing to overwrite corrupt db.json. Restore from backup or fix manually.');
  }
  return cache;
}

function persist() {
  if (corrupt) {
    console.error('[db] Skipping persist — database is in corrupt recovery mode');
    return;
  }
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2));
  fs.renameSync(tmp, DB_PATH);
}

export const db = {
  get:    (key)        => loadCache()[key] ?? null,
  set:    (key, value) => { loadCache(); cache[key] = value; persist(); },
  delete: (key)        => { loadCache(); delete cache[key]; persist(); },
  list:   (prefix)     => Object.keys(loadCache()).filter(k => k.startsWith(prefix)),
  isCorrupt: () => corrupt,
};
