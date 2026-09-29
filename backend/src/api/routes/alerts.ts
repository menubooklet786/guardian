import { Router, Request, Response } from 'express';
import { db } from '../../models/db.js';
import { alerts, children, deviceCommands } from '../../models/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const severity = req.query.severity as string | undefined;
  const unacknowledged = req.query.unacknowledged === 'true';
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

  const conditions = [eq(alerts.childId, req.params.childId)];
  if (severity) conditions.push(eq(alerts.severity, severity));
  if (unacknowledged) conditions.push(eq(alerts.acknowledged, false));

  const result = await db.select().from(alerts)
    .where(and(...conditions))
    .orderBy(desc(alerts.createdAt))
    .limit(limit);

  res.json({ alerts: result });
});

router.patch('/:alertId/acknowledge', authMiddleware, async (req: Request, res: Response) => {
  const [alert] = await db.update(alerts)
    .set({ acknowledged: true, acknowledgedAt: new Date() })
    .where(eq(alerts.id, req.params.alertId))
    .returning();

  if (!alert) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }
  res.json(alert);
});

router.post('/commands/:commandType', authMiddleware, async (req: Request, res: Response) => {
  const { childId, commandType } = req.params;
  const validCommands = ['lock', 'wipe', 'screenshot', 'location-now', 'block-app', 'unblock-app'];

  if (!validCommands.includes(commandType)) {
    res.status(400).json({ error: 'Invalid command type' });
    return;
  }

  const [command] = await db.insert(deviceCommands).values({
    childId,
    commandType,
    payloadJson: req.body.payload || {},
  }).returning();

  const { io } = req.app.locals;
  if (io) {
    io.to(`device:${childId}`).emit(`command:${commandType}`, command);
  }

  res.status(201).json(command);
});

router.get('/commands/pending', authMiddleware, async (req: Request, res: Response) => {
  const result = await db.select().from(deviceCommands)
    .where(and(
      eq(deviceCommands.childId, req.params.childId),
      eq(deviceCommands.status, 'pending'),
    ))
    .orderBy(deviceCommands.createdAt);

  res.json({ commands: result });
});

export default router;
