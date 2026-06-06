/**
 * Simulates a Railway redeploy: write data to DB_DATA_DIR, start a fresh Node
 * process (new container), run startup, and verify nothing was lost or re-seeded.
 *
 * Usage: node server/scripts/test-persistence.js
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '../..');
const worker = path.join(__dirname, 'persistence-worker.js');

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wedding-persist-'));
const MARKER_GUEST_ID = 'persist-test-guest-001';
const MARKER_NAME = 'Persistence Test Guest — DO NOT DELETE';

function runWorker(phase) {
  const result = spawnSync(process.execPath, [worker, phase], {
    cwd: projectRoot,
    env: { ...process.env, DB_DATA_DIR: testDir },
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    throw new Error(`Worker phase "${phase}" failed with exit ${result.status}`);
  }
  const lines = result.stdout.trim().split(/\r?\n/).filter(Boolean);
  const jsonLine = lines[lines.length - 1];
  return JSON.parse(jsonLine);
}

function readDbFromDisk() {
  const dbPath = path.join(testDir, 'db.json');
  if (!fs.existsSync(dbPath)) return null;
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function countKeys(db, prefix) {
  return Object.keys(db).filter(k => k.startsWith(prefix)).length;
}

console.log('=== Wedding Hub persistence test ===');
console.log(`Simulated volume (DB_DATA_DIR): ${testDir}`);
console.log('');

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

try {
  // --- Phase 1: First deploy — startup + user writes a marker guest ---
  console.log('Phase 1: First deploy (startup + save marker guest)');
  const afterFirst = runWorker('first-deploy');
  assert('DB_DATA_DIR is used', afterFirst.dbPath === path.join(testDir, 'db.json'));
  assert('Persistent flag true', afterFirst.persistent === true);
  assert('Marker guest saved', afterFirst.markerFound === true, `name=${afterFirst.markerName}`);
  assert('Guests exist after first deploy', afterFirst.guestCount >= 1, `count=${afterFirst.guestCount}`);

  const diskAfterFirst = readDbFromDisk();
  assert('db.json exists on disk', diskAfterFirst !== null);
  assert('Marker on disk before redeploy', diskAfterFirst?.[`guest:${MARKER_GUEST_ID}`]?.name === MARKER_NAME);

  const guestCountDisk1 = countKeys(diskAfterFirst, 'guest:');
  const checklistCountDisk1 = countKeys(diskAfterFirst, 'checklist:');

  // --- Phase 2: Simulated git push → new container, same volume ---
  console.log('');
  console.log('Phase 2: Redeploy (fresh Node process, same DB_DATA_DIR)');
  const afterRedeploy = runWorker('redeploy');
  assert('Marker guest survived redeploy', afterRedeploy.markerFound === true, `name=${afterRedeploy.markerName}`);
  assert('Guest count unchanged', afterRedeploy.guestCount === guestCountDisk1,
    `before=${guestCountDisk1} after=${afterRedeploy.guestCount}`);
  assert('Checklist count unchanged', afterRedeploy.checklistCount === checklistCountDisk1,
    `before=${checklistCountDisk1} after=${afterRedeploy.checklistCount}`);
  assert('Startup did not re-populate', afterRedeploy.populated.length === 0,
    `populated=${JSON.stringify(afterRedeploy.populated)}`);

  // --- Phase 3: Direct disk read (bypasses any in-memory cache) ---
  console.log('');
  console.log('Phase 3: Direct disk verification');
  const diskAfterRedeploy = readDbFromDisk();
  assert('db.json still on disk', diskAfterRedeploy !== null);
  assert('Marker on disk after redeploy', diskAfterRedeploy?.[`guest:${MARKER_GUEST_ID}`]?.name === MARKER_NAME);
  assert('Disk guest count matches', countKeys(diskAfterRedeploy, 'guest:') === guestCountDisk1);

  // --- Phase 4: Second redeploy (double-check consistency) ---
  console.log('');
  console.log('Phase 4: Second redeploy (consistency check)');
  const afterSecond = runWorker('redeploy');
  assert('Marker still present after 2nd redeploy', afterSecond.markerFound === true);
  assert('Counts stable after 2nd redeploy', afterSecond.guestCount === guestCountDisk1);

} finally {
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch {
    console.log(`(left test dir for inspection: ${testDir})`);
  }
}

console.log('');
console.log('=== Results ===');
console.log(`Passed: ${passed}  Failed: ${failed}`);
console.log('');

if (failed > 0) {
  console.log('VERDICT: PERSISTENCE TEST FAILED');
  process.exit(1);
}

console.log('VERDICT: PERSISTENCE TEST PASSED');
console.log('');
console.log('What this proves locally:');
console.log('  - Data written to DB_DATA_DIR survives process restarts (simulated redeploys)');
console.log('  - Startup does not wipe or re-seed existing collections');
console.log('');
console.log('For Railway to behave the same, confirm in dashboard:');
console.log('  1. Volume mounted at /data');
console.log('  2. DB_DATA_DIR=/data set on the service');
console.log('  3. GET /api/health shows persistent:true and dbPath:/data/db.json');
