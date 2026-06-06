import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Persistent storage root — set DB_DATA_DIR=/data on Railway with a volume mounted at /data. */
export function getDataDir() {
  if (process.env.DB_DATA_DIR) {
    return process.env.DB_DATA_DIR;
  }
  return path.join(__dirname, 'data');
}

export function getDbPath() {
  return path.join(getDataDir(), 'db.json');
}

export function getBannerPhotosPath() {
  return path.join(getDataDir(), 'banner-photos');
}

export function isPersistentStorage() {
  return Boolean(process.env.DB_DATA_DIR);
}
