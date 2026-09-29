import { Router, Request, Response } from 'express';
import { db } from '../../models/db.js';
import { locations, children } from '../../models/schema.js';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.get('/current', authMiddleware, async (req: Request, res: Response) => {
  const [child] = await db.select().from(children)
    .where(and(eq(children.id, req.params.childId), eq(children.accountId, req.user!.accountId)))
    .limit(1);
  if (!child) {
    res.status(404).json({ error: 'Child not found' });
    return;
  }

  const [latest] = await db.select().from(locations)
    .where(eq(locations.childId, req.params.childId))
    .orderBy(desc(locations.recordedAt))
    .limit(1);

  if (!latest) {
    res.json({ location: null, message: 'No location data yet' });
    return;
  }

  res.json({
    location: {
      latitude: latest.latitude,
      longitude: latest.longitude,
      altitude: latest.altitude,
      accuracy: latest.accuracy,
      speed: latest.speed,
      bearing: latest.bearing,
      provider: latest.provider,
      recordedAt: latest.recordedAt,
    },
  });
});

router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const to = req.query.to ? new Date(req.query.to as string) : new Date();
  const limit = Math.min(parseInt(req.query.limit as string) || 1000, 10000);

  const result = await db.select({
    latitude: locations.latitude,
    longitude: locations.longitude,
    altitude: locations.altitude,
    accuracy: locations.accuracy,
    speed: locations.speed,
    bearing: locations.bearing,
    recordedAt: locations.recordedAt,
  }).from(locations)
    .where(and(
      eq(locations.childId, req.params.childId),
      gte(locations.recordedAt, from),
      lte(locations.recordedAt, to),
    ))
    .orderBy(desc(locations.recordedAt))
    .limit(limit);

  res.json({ locations: result.reverse() });
});

router.post('/request', authMiddleware, async (req: Request, res: Response) => {
  const { io } = req.app.locals;
  if (io) {
    io.to(`device:${req.params.childId}`).emit('command:location-now');
  }
  res.json({ success: true, message: 'Location request sent' });
});

export default router;
