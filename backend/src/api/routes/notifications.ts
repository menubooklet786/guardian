import { Router, Request, Response } from 'express';
import { db } from '../../models/db.js';
import { notificationLogs, chatMessages, children } from '../../models/schema.js';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const to = req.query.to ? new Date(req.query.to as string) : new Date();
  const source = req.query.source as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
  const offset = parseInt(req.query.offset as string) || 0;

  let query = db.select().from(notificationLogs)
    .where(and(
      eq(notificationLogs.childId, req.params.childId),
      gte(notificationLogs.recordedAt, from),
      lte(notificationLogs.recordedAt, to),
    ))
    .orderBy(desc(notificationLogs.recordedAt))
    .limit(limit)
    .offset(offset);

  if (source) {
    query = db.select().from(notificationLogs)
      .where(and(
        eq(notificationLogs.childId, req.params.childId),
        eq(notificationLogs.sourcePackage, source),
        gte(notificationLogs.recordedAt, from),
        lte(notificationLogs.recordedAt, to),
      ))
      .orderBy(desc(notificationLogs.recordedAt))
      .limit(limit)
      .offset(offset);
  }

  const result = await query;
  res.json({ notifications: result });
});

router.get('/chat-messages', authMiddleware, async (req: Request, res: Response) => {
  const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const to = req.query.to ? new Date(req.query.to as string) : new Date();
  const platform = req.query.platform as string | undefined;
  const riskMin = req.query.risk_min ? parseFloat(req.query.risk_min as string) : undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

  const conditions = [
    eq(chatMessages.childId, req.params.childId),
    gte(chatMessages.recordedAt, from),
    lte(chatMessages.recordedAt, to),
  ];

  if (platform) {
    conditions.push(eq(chatMessages.platform, platform));
  }
  if (riskMin !== undefined) {
    conditions.push(gte(chatMessages.riskScore, riskMin));
  }

  const result = await db.select().from(chatMessages)
    .where(and(...conditions))
    .orderBy(desc(chatMessages.recordedAt))
    .limit(limit);

  res.json({ messages: result });
});

export default router;
