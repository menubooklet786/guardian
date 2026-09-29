import { Router, Request, Response } from 'express';
import { db } from '../../models/db.js';
import { locations, appUsageEvents, appUsageDaily, notificationLogs, callLogs, webHistory, deviceHealth, devices } from '../../models/schema.js';
import { eq, and } from 'drizzle-orm';
import { deviceAuthMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/batch', deviceAuthMiddleware, async (req: Request, res: Response) => {
  const childId = req.user!.childId;

  if (!childId) {
    res.status(400).json({ error: 'Missing child ID' });
    return;
  }

  const [device] = await db.select().from(devices)
    .where(eq(devices.childId, childId))
    .limit(1);

  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  const deviceId = device.id;
  const batch = req.body;
  const inserted: Record<string, number> = {};

  try {
    if (batch.locations?.length) {
      await db.insert(locations).values(
        batch.locations.map((loc: any) => ({
          childId,
          deviceId,
          ...loc,
          recordedAt: new Date(loc.recordedAt || Date.now()),
        }))
      );
      inserted.locations = batch.locations.length;
    }

    if (batch.appEvents?.length) {
      await db.insert(appUsageEvents).values(
        batch.appEvents.map((evt: any) => ({
          childId,
          deviceId,
          packageName: evt.packageName,
          appName: evt.appName,
          eventType: evt.eventType,
          recordedAt: new Date(evt.timestamp || evt.recordedAt || Date.now()),
        }))
      );
      inserted.appEvents = batch.appEvents.length;
    }

    if (batch.notifications?.length) {
      await db.insert(notificationLogs).values(
        batch.notifications.map((notif: any) => ({
          childId,
          deviceId,
          sourcePackage: notif.packageName,
          appName: notif.appName,
          title: notif.title,
          textContent: notif.text,
          category: notif.category,
          recordedAt: new Date(notif.receivedAt || notif.recordedAt || Date.now()),
        }))
      );
      inserted.notifications = batch.notifications.length;
    }

    if (batch.calls?.length) {
      await db.insert(callLogs).values(
        batch.calls.map((call: any) => ({
          childId,
          deviceId,
          phoneNumber: call.phoneNumber,
          contactName: call.contactName,
          callType: call.callType,
          durationSecs: call.duration,
          recordedAt: new Date(call.timestamp || call.recordedAt || Date.now()),
        }))
      );
      inserted.calls = batch.calls.length;
    }

    if (batch.webHistory?.length) {
      await db.insert(webHistory).values(
        batch.webHistory.map((web: any) => {
          const url = new URL(web.url);
          return {
            childId,
            deviceId,
            url: web.url,
            domain: url.hostname,
            title: web.title,
            recordedAt: new Date(web.visitTime || web.recordedAt || Date.now()),
          };
        })
      );
      inserted.webHistory = batch.webHistory.length;
    }

    if (batch.health) {
      await db.insert(deviceHealth).values({
        childId,
        deviceId,
        ...batch.health,
        recordedAt: new Date(batch.health.recordedAt || Date.now()),
      });
      inserted.health = 1;
    }

    await db.update(devices)
      .set({ lastHeartbeat: new Date(), updatedAt: new Date() })
      .where(eq(devices.id, deviceId));

    res.json({ success: true, inserted });
  } catch (err) {
    console.error('Sync batch error:', err);
    res.status(500).json({ error: 'Sync failed', details: String(err) });
  }
});

router.post('/heartbeat', deviceAuthMiddleware, async (req: Request, res: Response) => {
  const childId = req.user!.childId;
  if (!childId) {
    res.status(400).json({ error: 'Missing child ID' });
    return;
  }

  const [device] = await db.select().from(devices)
    .where(eq(devices.childId, childId))
    .limit(1);

  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  await db.update(devices)
    .set({ lastHeartbeat: new Date(), updatedAt: new Date() })
    .where(eq(devices.id, device.id));

  res.json({ success: true });
});

export default router;
