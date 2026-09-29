import { Router, Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { authService, JwtPayload } from '../../services/auth.js';
import { authMiddleware } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = registerSchema.parse(req.body);
    const { account, tokens } = await authService.register(email, password);
    res.status(201).json({
      user: { id: account.id, email: account.email },
      ...tokens,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const tokens = await authService.login(email, password);
    if (!tokens) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    res.json(tokens);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
    } else {
      res.status(500).json({ error: 'Login failed' });
    }
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as JwtPayload & { iat?: number; exp?: number; nbf?: number };
    const { iat, exp, nbf, ...payload } = decoded;
    const tokens = authService.generateTokens(payload);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/device/pair-code', authMiddleware, async (req: Request, res: Response) => {
  const code = authService.generatePairingCode(req.user!.accountId, req.body.childId);
  res.json({ code, expiresInSeconds: 300 });
});

router.post('/device/pair', async (req: Request, res: Response) => {
  try {
    const { code, deviceInfo } = req.body;
    if (!code) {
      res.status(400).json({ error: 'Pairing code required' });
      return;
    }
    const result = await authService.pairDevice(code, deviceInfo || {});
    if (!result) {
      res.status(400).json({ error: 'Invalid or expired pairing code' });
      return;
    }
    const tokens = authService.generateTokens({
      accountId: '',
      type: 'device',
      childId: result.childId,
    });
    res.json({ ...result, ...tokens });
  } catch {
    res.status(500).json({ error: 'Pairing failed' });
  }
});

export default router;
