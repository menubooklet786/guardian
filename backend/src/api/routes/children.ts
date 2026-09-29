import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../models/db.js';
import { children, devices } from '../../models/schema.js';
import { eq, and } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const createChildSchema = z.object({
  name: z.string().min(1).max(100),
  birthDate: z.string().optional(),
});

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const result = await db.select().from(children).where(eq(children.accountId, req.user!.accountId));
  res.json(result);
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = createChildSchema.parse(req.body);
    const [child] = await db.insert(children).values({
      accountId: req.user!.accountId,
      name: data.name,
      birthDate: data.birthDate || null,
    }).returning();
    res.status(201).json(child);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
    } else {
      res.status(500).json({ error: 'Failed to create child' });
    }
  }
});

router.patch('/:childId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = createChildSchema.partial().parse(req.body);
    const [child] = await db.update(children)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(children.id, req.params.childId), eq(children.accountId, req.user!.accountId)))
      .returning();
    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }
    res.json(child);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
    } else {
      res.status(500).json({ error: 'Failed to update child' });
    }
  }
});

router.delete('/:childId', authMiddleware, async (req: Request, res: Response) => {
  const [deleted] = await db.delete(children)
    .where(and(eq(children.id, req.params.childId), eq(children.accountId, req.user!.accountId)))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: 'Child not found' });
    return;
  }
  res.json({ success: true });
});

router.get('/:childId/device', authMiddleware, async (req: Request, res: Response) => {
  const [child] = await db.select().from(children)
    .where(and(eq(children.id, req.params.childId), eq(children.accountId, req.user!.accountId)))
    .limit(1);
  if (!child) {
    res.status(404).json({ error: 'Child not found' });
    return;
  }
  const deviceList = await db.select().from(devices).where(eq(devices.childId, req.params.childId));
  res.json(deviceList);
});

export default router;
