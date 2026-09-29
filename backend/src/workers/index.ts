import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { db } from '../models/db.js';
import { locations, geofences, geofenceEvents, alerts } from '../models/schema.js';
import { eq, and, desc } from 'drizzle-orm';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const geofenceQueue = new Queue('geofence-eval', { connection });
export const reportQueue = new Queue('report-gen', { connection });
export const cleanupQueue = new Queue('retention-cleanup', { connection });
export const mediaQueue = new Queue('media-process', { connection });
export const aiQueue = new Queue('ai-analyze', { connection });

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function startWorkers() {
  new Worker('geofence-eval', async (job: Job) => {
    const { childId, latitude, longitude, recordedAt } = job.data;

    const activeGeofences = await db.select().from(geofences)
      .where(and(eq(geofences.childId, childId), eq(geofences.active, true)));

    for (const geofence of activeGeofences) {
      const distance = haversineDistance(latitude, longitude, geofence.latitude, geofence.longitude);
      const isInside = distance <= geofence.radiusMeters;

      const [lastEvent] = await db.select().from(geofenceEvents)
        .where(and(
          eq(geofenceEvents.childId, childId),
          eq(geofenceEvents.geofenceId, geofence.id),
        ))
        .orderBy(desc(geofenceEvents.recordedAt))
        .limit(1);

      const wasInside = lastEvent?.eventType === 'enter';

      if (isInside && !wasInside && geofence.alertOnEnter) {
        await db.insert(geofenceEvents).values({
          childId,
          geofenceId: geofence.id,
          eventType: 'enter',
          recordedAt: new Date(recordedAt),
        });

        await db.insert(alerts).values({
          childId,
          type: 'geofence_enter',
          severity: 'info',
          title: `Entered ${geofence.name}`,
          body: `Your child has arrived at ${geofence.name}`,
          metadataJson: { geofenceId: geofence.id, latitude, longitude },
        });
      } else if (!isInside && wasInside && geofence.alertOnExit) {
        await db.insert(geofenceEvents).values({
          childId,
          geofenceId: geofence.id,
          eventType: 'exit',
          recordedAt: new Date(recordedAt),
        });

        await db.insert(alerts).values({
          childId,
          type: 'geofence_exit',
          severity: 'warning',
          title: `Left ${geofence.name}`,
          body: `Your child has left ${geofence.name}`,
          metadataJson: { geofenceId: geofence.id, latitude, longitude },
        });
      }
    }
  }, { connection });

  new Worker('report-gen', async (job: Job) => {
    console.log('Generating report:', job.data);
  }, { connection });

  new Worker('retention-cleanup', async (job: Job) => {
    console.log('Running retention cleanup:', job.data);
  }, { connection });

  new Worker('media-process', async (job: Job) => {
    console.log('Processing media:', job.data);
  }, { connection });

  new Worker('ai-analyze', async (job: Job) => {
    console.log('Running AI analysis:', job.data);
  }, { connection });

  console.log('BullMQ workers started');
}

export async function enqueueGeofenceEval(childId: string, latitude: number, longitude: number, recordedAt: string) {
  await geofenceQueue.add('eval', { childId, latitude, longitude, recordedAt });
}
