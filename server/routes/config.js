import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    config: db.get('config:main') || {},
    bannerPhotos: db.get('config:bannerPhotos') || [],
  });
});

router.put('/', (req, res) => {
  const current = db.get('config:main') || {};
  db.set('config:main', { ...current, ...req.body });
  res.json(db.get('config:main'));
});

export default router;
