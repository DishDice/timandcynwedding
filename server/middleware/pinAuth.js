const PIN = process.env.WEDDING_PIN || '1234';

export function verifyPin(req, res) {
  const pin = req.body?.pin ?? req.headers['x-pin'];
  if (pin === PIN) {
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Invalid PIN' });
}

export function requirePin(req, res, next) {
  if (req.path === '/api/health' || req.path === '/api/auth/verify') {
    return next();
  }
  const pin = req.headers['x-pin'];
  if (pin === PIN) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}
