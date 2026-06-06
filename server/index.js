import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyPin, requirePin } from './middleware/pinAuth.js';
import { runStartup } from './seed.js';
import configRoutes from './routes/config.js';
import bannerRoutes from './routes/banner.js';
import budgetRoutes from './routes/budget.js';
import checklistRoutes from './routes/checklist.js';
import guestsRoutes from './routes/guests.js';
import vendorsRoutes from './routes/vendors.js';
import documentsRoutes from './routes/documents.js';
import timelineRoutes from './routes/timeline.js';
import syncRoutes from './routes/sync.js';
import { getDbInfo } from './db.js';
import { getSeedDiagnostics } from './seedDetect.js';
import { ensureBannerStorage, getBannerDiagnostics } from './bannerStorage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  const dbInfo = getDbInfo();
  const seed = getSeedDiagnostics();
  const banner = getBannerDiagnostics();
  res.json({
    ok: true,
    db: {
      dataDir: dbInfo.dataDir,
      dbPath: dbInfo.path,
      fileExists: dbInfo.fileExists,
      records: dbInfo.records,
      persistent: dbInfo.persistent,
      corrupt: dbInfo.corrupt,
      storageWarning: dbInfo.persistent
        ? null
        : 'DB_DATA_DIR is not set — data resets on every Railway redeploy. Mount a volume at /data and set DB_DATA_DIR=/data.',
      guestCount: seed.guestCount,
      checklistCount: seed.checklistCount,
      likelyFreshSeed: seed.likelyFreshSeed,
      initializedAt: seed.meta?.initializedAt ?? null,
      lastClientRestore: seed.meta?.lastClientRestore ?? null,
      bannerDir: banner.bannerDir,
      bannerFilesOnDisk: banner.filesOnDisk,
      bannerUrlsInDb: banner.urlsInDb,
    },
  });
});

app.post('/api/auth/verify', verifyPin);

app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path === '/auth/verify') return next();
  return requirePin(req, res, next);
});

app.use('/api/config', configRoutes);
app.use('/api', bannerRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/guests', guestsRoutes);
app.use('/api/vendors', vendorsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/sync', syncRoutes);

const bannerDir = ensureBannerStorage();
app.use('/banner-photos', express.static(bannerDir, {
  maxAge: '365d',
}));

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  const dbInfo = getDbInfo();
  console.log(`Server running on port ${PORT}`);
  console.log(`[db] Storage: ${dbInfo.path} (${dbInfo.persistent ? 'persistent volume' : 'local — will reset on redeploy without volume'})`);
  runStartup();
});
