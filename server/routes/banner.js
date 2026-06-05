import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../../public/banner-photos');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
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
  res.json({ url, photos });
});

router.delete('/banner-photo', (req, res) => {
  const { url } = req.body;
  const photos = (db.get('config:bannerPhotos') || []).filter(p => p !== url);
  db.set('config:bannerPhotos', photos);
  const filename = path.basename(url);
  const filepath = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
  res.json({ photos });
});

export default router;
