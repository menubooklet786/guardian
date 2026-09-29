import { Router, Request, Response } from 'express';
import { db } from '../../models/db.js';
import { appUsageEvents, appUsageDaily, children } from '../../models/schema.js';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.get('/today', authMiddleware, async (req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];
  const result = await db.select().from(appUsageDaily)
    .where(and(
      eq(appUsageDaily.childId, req.params.childId),
      eq(appUsageDaily.date, today),
    ))
    .orderBy(desc(appUsageDaily.totalForegroundMs));

  res.json({ usage: result });
});

router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const to = req.query.to ? new Date(req.query.to as string) : new Date();

  const result = await db.select().from(appUsageDaily)
    .where(and(
      eq(appUsageDaily.childId, req.params.childId),
      gte(appUsageDaily.date, from.toISOString().split('T')[0]),
      lte(appUsageDaily.date, to.toISOString().split('T')[0]),
    ))
    .orderBy(desc(appUsageDaily.date));

  res.json({ usage: result });
});

router.get('/breakdown', authMiddleware, async (req: Request, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const result = await db.select({
    packageName: appUsageDaily.packageName,
    appName: appUsageDaily.appName,
    totalForegroundMs: appUsageDaily.totalForegroundMs,
    launchCount: appUsageDaily.launchCount,
    firstUsed: appUsageDaily.firstUsed,
    lastUsed: appUsageDaily.lastUsed,
  }).from(appUsageDaily)
    .where(and(
      eq(appUsageDaily.childId, req.params.childId),
      eq(appUsageDaily.date, date),
    ))
    .orderBy(desc(appUsageDaily.totalForegroundMs));

  res.json({ date, breakdown: result });
});

export default router;
