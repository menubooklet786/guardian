import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../models/db.js';
import { geofences, geofenceEvents, children } from '../../models/schema.js';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

const createGeofenceSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['safe_zone', 'alert_zone', 'school', 'custom']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().min(10).max(10000),
  alertOnEnter: z.boolean().default(true),
  alertOnExit: z.boolean().default(true),
});

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const result = await db.select().from(geofences)
    .where(eq(geofences.childId, req.params.childId));
  res.json(result);
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = createGeofenceSchema.parse(req.body);
    const [geofence] = await db.insert(geofences).values({
      childId: req.params.childId,
      ...data,
    }).returning();
    res.status(201).json(geofence);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
    } else {
      res.status(500).json({ error: 'Failed to create geofence' });
    }
  }
});

router.patch('/:geofenceId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = createGeofenceSchema.partial().parse(req.body);
    const [geofence] = await db.update(geofences)
      .set(data)
      .where(eq(geofences.id, req.params.geofenceId))
      .returning();
    if (!geofence) {
      res.status(404).json({ error: 'Geofence not found' });
      return;
    }
    res.json(geofence);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
    } else {
      res.status(500).json({ error: 'Failed to update geofence' });
    }
  }
});

router.delete('/:geofenceId', authMiddleware, async (req: Request, res: Response) => {
  const [deleted] = await db.delete(geofences)
    .where(eq(geofences.id, req.params.geofenceId))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: 'Geofence not found' });
    return;
  }
  res.json({ success: true });
});

router.get('/events', authMiddleware, async (req: Request, res: Response) => {
  const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const to = req.query.to ? new Date(req.query.to as string) : new Date();

  const result = await db.select().from(geofenceEvents)
    .where(and(
      eq(geofenceEvents.childId, req.params.childId),
      gte(geofenceEvents.recordedAt, from),
      lte(geofenceEvents.recordedAt, to),
    ))
    .orderBy(desc(geofenceEvents.recordedAt))
    .limit(500);

  res.json({ events: result });
});

export default router;
