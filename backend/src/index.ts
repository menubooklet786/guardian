import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

import { initializeDatabase } from './migrate.js';
import authRoutes from './api/routes/auth.js';
import childrenRoutes from './api/routes/children.js';
import locationRoutes from './api/routes/location.js';
import geofenceRoutes from './api/routes/geofences.js';
import appUsageRoutes from './api/routes/appUsage.js';
import notificationRoutes from './api/routes/notifications.js';
import callLogRoutes from './api/routes/callLogs.js';
import alertRoutes from './api/routes/alerts.js';
import healthRoutes from './api/routes/health.js';
import webHistoryRoutes from './api/routes/webHistory.js';
import webFilterRulesRoutes from './api/routes/webFilterRules.js';
import screenTimeRulesRoutes from './api/routes/screenTimeRules.js';
import syncRoutes from './api/routes/sync.js';
import { setupWebSocket } from './websocket/index.js';
import { startWorkers } from './workers/index.js';

const app = express();
const httpServer = createServer(app);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const io = setupWebSocket(httpServer);
app.locals.io = io;

startWorkers();

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/children', childrenRoutes);
app.use('/api/v1/children/:childId/location', locationRoutes);
app.use('/api/v1/children/:childId/geofences', geofenceRoutes);
app.use('/api/v1/children/:childId/app-usage', appUsageRoutes);
app.use('/api/v1/children/:childId/notifications', notificationRoutes);
app.use('/api/v1/children/:childId/call-logs', callLogRoutes);
app.use('/api/v1/children/:childId/alerts', alertRoutes);
app.use('/api/v1/children/:childId/health', healthRoutes);
app.use('/api/v1/children/:childId/web-history', webHistoryRoutes);
app.use('/api/v1/children/:childId/web-filter-rules', webFilterRulesRoutes);
app.use('/api/v1/children/:childId/screen-time-rules', screenTimeRulesRoutes);
app.use('/api/v1/sync', syncRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/download/child-app', (req, res) => {
  const filePath = path.join(__dirname, '..', 'public', 'apk', 'guardian-child.apk');
  res.download(filePath, 'guardian-child.apk', {
    headers: { 'Content-Type': 'application/vnd.android.package-archive' }
  });
});

app.get('/download/parent-app', (req, res) => {
  const filePath = path.join(__dirname, '..', 'public', 'apk', 'guardian-parent.apk');
  res.download(filePath, 'guardian-parent.apk', {
    headers: { 'Content-Type': 'application/vnd.android.package-archive' }
  });
});

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await initializeDatabase();
    httpServer.listen(PORT, () => {
      console.log(`Guardian API server running on port ${PORT}`);
      console.log(`WebSocket server ready`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
