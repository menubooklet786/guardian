import { Router, Request, Response } from 'express';
import { db } from '../../models/db.js';
import { webHistory, children } from '../../models/schema.js';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const to = req.query.to ? new Date(req.query.to as string) : new Date();
  const blocked = req.query.blocked === 'true';
  const limit = Math.min(parseInt(req.query.limit as string) || 200, 1000);

  const conditions = [
    eq(webHistory.childId, req.params.childId),
    gte(webHistory.recordedAt, from),
    lte(webHistory.recordedAt, to),
  ];
  if (blocked) conditions.push(eq(webHistory.blocked, true));

  const result = await db.select().from(webHistory)
    .where(and(...conditions))
    .orderBy(desc(webHistory.recordedAt))
    .limit(limit);

  res.json({ webHistory: result });
});

export default router;
