import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Persistent storage root — set DATA_PATH=/data on Railway with a volume mounted at /data. */
export function getDataPath() {
  if (process.env.DATA_PATH) {
    return process.env.DATA_PATH;
  }
  return path.join(__dirname, 'data');
}

export function getDbPath() {
  return path.join(getDataPath(), 'db.json');
}

export function getBannerPhotosPath() {
  return path.join(getDataPath(), 'banner-photos');
}

export function isPersistentStorage() {
  return Boolean(process.env.DATA_PATH);
}
