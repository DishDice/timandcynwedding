import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db.js';
import { ensureBannerStorage, getBannerFilePath } from '../bannerStorage.js';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ensureBannerStorage());
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `banner-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.post('/upload-banner-photo', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const photos = db.get('config:bannerPhotos') || [];
  if (photos.length >= 5) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Maximum 5 banner photos allowed' });
  }
  const url = `/banner-photos/${req.file.filename}`;
  photos.push(url);
  db.set('config:bannerPhotos', photos);
  console.log(`[banner] Saved ${req.file.filename} → ${req.file.path}`);
  res.json({ url, photos });
});

router.delete('/banner-photo', (req, res) => {
  const { url } = req.body;
  const photos = (db.get('config:bannerPhotos') || []).filter(p => p !== url);
  db.set('config:bannerPhotos', photos);
  const filename = path.basename(url);
  const filepath = getBannerFilePath(filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
  res.json({ photos });
});

export default router;
