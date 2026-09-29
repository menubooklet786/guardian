import { Request, Response, NextFunction } from 'express';
import { authService, JwtPayload } from '../../services/auth.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  const token = authHeader.slice(7);
  const payload = authService.verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = payload;
  next();
}

export function deviceAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing device token' });
    return;
  }

  const token = authHeader.slice(7);
  const payload = authService.verifyDeviceToken(token);
  if (!payload || payload.type !== 'device') {
    res.status(401).json({ error: 'Invalid device token' });
    return;
  }

  req.user = payload;
  next();
}
