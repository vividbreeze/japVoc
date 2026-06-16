import { Request, Response, NextFunction } from 'express';
import { sessions, isAuthEnabled } from '../routes/auth';

export function authGuard(req: Request, res: Response, next: NextFunction) {
  if (!isAuthEnabled()) return next();

  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (token && sessions.has(token)) return next();

  res.status(401).json({ error: 'Nicht angemeldet' });
}
