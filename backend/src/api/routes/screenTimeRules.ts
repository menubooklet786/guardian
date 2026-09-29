import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../models/db.js';
import { screenTimeRules, children } from '../../models/schema.js';
import { eq, and } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

const createRuleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  maxDurationMs: z.number().int().positive().nullable().optional(),
  allowedApps: z.any().nullable().optional(),
  action: z.enum(['block', 'limit', 'allow']).optional(),
  active: z.boolean().optional(),
});

async function verifyChildOwnership(childId: string, accountId: string) {
  const [child] = await db.select().from(children)
    .where(and(eq(children.id, childId), eq(children.accountId, accountId)))
    .limit(1);
  return child;
}

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const child = await verifyChildOwnership(req.params.childId, req.user!.accountId);
  if (!child) {
    res.status(404).json({ error: 'Child not found' });
    return;
  }
  const rules = await db.select().from(screenTimeRules)
    .where(eq(screenTimeRules.childId, req.params.childId));
  res.json(rules);
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  const child = await verifyChildOwnership(req.params.childId, req.user!.accountId);
  if (!child) {
    res.status(404).json({ error: 'Child not found' });
    return;
  }
  try {
    const data = createRuleSchema.parse(req.body);
    const [rule] = await db.insert(screenTimeRules).values({
      childId: req.params.childId,
      ...data,
      allowedApps: data.allowedApps ?? null,
    }).returning();
    res.status(201).json(rule);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
    } else {
      res.status(500).json({ error: 'Failed to create rule' });
    }
  }
});

router.patch('/:ruleId', authMiddleware, async (req: Request, res: Response) => {
  const child = await verifyChildOwnership(req.params.childId, req.user!.accountId);
  if (!child) {
    res.status(404).json({ error: 'Child not found' });
    return;
  }
  try {
    const data = createRuleSchema.partial().parse(req.body);
    const [rule] = await db.update(screenTimeRules)
      .set(data)
      .where(eq(screenTimeRules.id, req.params.ruleId))
      .returning();
    if (!rule) {
      res.status(404).json({ error: 'Rule not found' });
      return;
    }
    res.json(rule);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
    } else {
      res.status(500).json({ error: 'Failed to update rule' });
    }
  }
});

router.delete('/:ruleId', authMiddleware, async (req: Request, res: Response) => {
  const child = await verifyChildOwnership(req.params.childId, req.user!.accountId);
  if (!child) {
    res.status(404).json({ error: 'Child not found' });
    return;
  }
  const [deleted] = await db.delete(screenTimeRules)
    .where(eq(screenTimeRules.id, req.params.ruleId))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: 'Rule not found' });
    return;
  }
  res.json({ success: true });
});

export default router;
