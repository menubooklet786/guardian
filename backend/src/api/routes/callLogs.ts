import { Router, Request, Response } from 'express';
import { db } from '../../models/db.js';
import { callLogs, children } from '../../models/schema.js';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const to = req.query.to ? new Date(req.query.to as string) : new Date();
  const type = req.query.type as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

  const conditions = [
    eq(callLogs.childId, req.params.childId),
    gte(callLogs.recordedAt, from),
    lte(callLogs.recordedAt, to),
  ];

  if (type) {
    conditions.push(eq(callLogs.callType, type));
  }

  const result = await db.select().from(callLogs)
    .where(and(...conditions))
    .orderBy(desc(callLogs.recordedAt))
    .limit(limit);

  res.json({ calls: result });
});

export default router;
