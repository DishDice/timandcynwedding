/**
 * Child process worker for test-persistence.js — each invocation is a fresh Node
 * process (simulates a new Railway container after deploy).
 */
import fs from 'fs';
import path from 'path';
import { db, getDbInfo } from '../db.js';
import { runStartup } from '../seed.js';
import { getBannerDiagnostics, getBannerFilePath } from '../bannerStorage.js';

const phase = process.argv[2];
const MARKER_GUEST_ID = 'persist-test-guest-001';
const MARKER_NAME = 'Persistence Test Guest — DO NOT DELETE';
const BANNER_FILENAME = 'banner-persist-test.jpg';

function snapshot() {
  const info = getDbInfo();
  const marker = db.get(`guest:${MARKER_GUEST_ID}`);
  const banner = getBannerDiagnostics();
  const bannerPhotos = db.get('config:bannerPhotos') || [];
  const bannerFileExists = fs.existsSync(getBannerFilePath(BANNER_FILENAME));
  return {
    dbPath: info.path,
    persistent: info.persistent,
    guestCount: db.list('guest:').length,
    checklistCount: db.list('checklist:').length,
    budgetCount: db.list('budget:').length,
    markerFound: marker?.name === MARKER_NAME,
    markerName: marker?.name ?? null,
    bannerDir: banner.bannerDir,
    bannerFilesOnDisk: banner.filesOnDisk,
    bannerUrlsInDb: banner.urlsInDb,
    bannerUrlSaved: bannerPhotos.includes(`/banner-photos/${BANNER_FILENAME}`),
    bannerFileExists,
    populated: [],
  };
}

if (phase === 'first-deploy') {
  runStartup();
  db.set(`guest:${MARKER_GUEST_ID}`, {
    id: MARKER_GUEST_ID,
    name: MARKER_NAME,
    group: 'Test',
    rsvp: 'confirmed',
    dietary: 'Test marker — proves persistence',
    tableNumber: '99',
    notes: 'Created by persistence test',
    order: 9999,
  });
  const bannerPath = getBannerFilePath(BANNER_FILENAME);
  fs.writeFileSync(bannerPath, Buffer.from('persist-test-banner'));
  const photos = db.get('config:bannerPhotos') || [];
  photos.push(`/banner-photos/${BANNER_FILENAME}`);
  db.set('config:bannerPhotos', photos);
  console.log(JSON.stringify(snapshot()));
} else if (phase === 'redeploy') {
  const populated = runStartup();
  const out = snapshot();
  out.populated = populated;
  console.log(JSON.stringify(out));
} else {
  console.error(`Unknown phase: ${phase}`);
  process.exit(1);
}
