import fs from 'fs';
import path from 'path';
import { db } from './db.js';
import { getBannerPhotosPath } from './paths.js';

export function ensureBannerStorage() {
  const dir = getBannerPhotosPath();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getBannerFilePath(filename) {
  return path.join(getBannerPhotosPath(), filename);
}

export function listBannerFilesOnDisk() {
  const dir = ensureBannerStorage();
  return fs.readdirSync(dir).filter(f => !f.startsWith('.'));
}

/**
 * Sync config:bannerPhotos with files on disk.
 * - Removes DB URLs whose files are missing (stale references only)
 * - Adds DB URLs for image files found on disk but not listed
 * Never deletes image files.
 */
export function reconcileBannerPhotos() {
  ensureBannerStorage();
  const filesOnDisk = new Set(listBannerFilesOnDisk());
  const photos = db.get('config:bannerPhotos') || [];

  const valid = photos.filter(url => filesOnDisk.has(path.basename(url)));

  const known = new Set(valid);
  for (const filename of filesOnDisk) {
    const url = `/banner-photos/${filename}`;
    if (!known.has(url) && valid.length < 5) {
      valid.push(url);
      known.add(url);
    }
  }

  if (JSON.stringify(valid) !== JSON.stringify(photos)) {
    db.set('config:bannerPhotos', valid);
    console.log(`[banner] Reconciled banner photos: ${valid.length} URL(s), ${filesOnDisk.size} file(s) on disk`);
  }

  return {
    dir: getBannerPhotosPath(),
    filesOnDisk: filesOnDisk.size,
    urlsInDb: valid.length,
  };
}

export function getBannerDiagnostics() {
  let filesOnDisk = 0;
  try {
    filesOnDisk = listBannerFilesOnDisk().length;
  } catch {
    filesOnDisk = 0;
  }
  return {
    bannerDir: getBannerPhotosPath(),
    filesOnDisk,
    urlsInDb: (db.get('config:bannerPhotos') || []).length,
  };
}
