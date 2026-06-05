import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'db.json');

let cache = null;

function loadCache() {
  if (cache !== null) return cache;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}));
  }
  try {
    cache = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    console.warn('[db] db.json corrupted — starting fresh');
    cache = {};
    fs.writeFileSync(DB_PATH, JSON.stringify({}));
  }
  console.log(`[db] Loaded ${Object.keys(cache).length} records from disk`);
  return cache;
}

function persist() {
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2));
  fs.renameSync(tmp, DB_PATH);
}

export const db = {
  get:    (key)        => loadCache()[key] ?? null,
  set:    (key, value) => { loadCache(); cache[key] = value; persist(); },
  delete: (key)        => { loadCache(); delete cache[key]; persist(); },
  list:   (prefix)     => Object.keys(loadCache()).filter(k => k.startsWith(prefix)),
};
