import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';

const router = Router();

// In-memory session store — fine for a single-user personal app.
// Sessions survive until the process restarts; clients re-login on restart.
export const sessions = new Set<string>();

export function isAuthEnabled() {
  return !!process.env.APP_PASSWORD;
}

// POST /api/auth/login  { password }
router.post('/login', (req: Request, res: Response) => {
  if (!isAuthEnabled()) {
    return res.json({ ok: true, token: null });
  }

  const { password } = req.body as { password?: string };
  if (!password || password !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'Falsches Passwort' });
  }

  const token = randomBytes(32).toString('hex');
  sessions.add(token);
  res.json({ ok: true, token });
});

// GET /api/auth/check — lets the frontend verify its stored token on startup
router.get('/check', (req: Request, res: Response) => {
  if (!isAuthEnabled()) {
    return res.json({ ok: true, authRequired: false });
  }

  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (token && sessions.has(token)) {
    return res.json({ ok: true, authRequired: true });
  }

  res.status(401).json({ ok: false, authRequired: true });
});

export default router;
