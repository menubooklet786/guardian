import { Router, Request, Response } from 'express';
import { db } from '../../models/db.js';
import { deviceHealth, children, devices } from '../../models/schema.js';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';
import { deviceAuthMiddleware } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.get('/current', authMiddleware, async (req: Request, res: Response) => {
  const [latest] = await db.select().from(deviceHealth)
    .where(eq(deviceHealth.childId, req.params.childId))
    .orderBy(desc(deviceHealth.recordedAt))
    .limit(1);

  if (!latest) {
    res.json({ health: null, message: 'No health data yet' });
    return;
  }

  res.json({ health: latest });
});

router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const to = req.query.to ? new Date(req.query.to as string) : new Date();
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

  const result = await db.select().from(deviceHealth)
    .where(and(
      eq(deviceHealth.childId, req.params.childId),
      gte(deviceHealth.recordedAt, from),
      lte(deviceHealth.recordedAt, to),
    ))
    .orderBy(desc(deviceHealth.recordedAt))
    .limit(limit);

  res.json({ health: result });
});

export default router;
