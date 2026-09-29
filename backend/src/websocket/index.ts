import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { authService, JwtPayload } from '../services/auth.js';

export function setupWebSocket(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const authMiddleware = (socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }

    const payload = authService.verifyToken(token);
    if (!payload) {
      next(new Error('Invalid token'));
      return;
    }

    socket.data.user = payload;
    next();
  };

  io.use(authMiddleware);

  const deviceNamespace = io.of('/device');
  deviceNamespace.use(authMiddleware);

  deviceNamespace.on('connection', (socket: Socket) => {
    const user = socket.data.user as JwtPayload;
    if (!user || !user.childId) {
      socket.disconnect();
      return;
    }
    console.log(`Device connected: ${user.childId}`);

    socket.join(`device:${user.childId}`);

    socket.on('device:location', (data) => {
      socket.to(`parent:${user.childId}`).emit('device:location', data);
    });

    socket.on('device:sos', (data) => {
      io.of('/parent').to(`parent:${user.childId}`).emit('device:sos', data);
    });

    socket.on('device:geofence-event', (data) => {
      io.of('/parent').to(`parent:${user.childId}`).emit('device:geofence-event', data);
    });

    socket.on('device:alert', (data) => {
      io.of('/parent').to(`parent:${user.childId}`).emit('device:alert', data);
    });

    socket.on('device:health', (data) => {
      io.of('/parent').to(`parent:${user.childId}`).emit('device:health', data);
    });

    socket.on('device:call-in-progress', (data) => {
      io.of('/parent').to(`parent:${user.childId}`).emit('device:call-in-progress', data);
    });

    socket.on('disconnect', () => {
      console.log(`Device disconnected: ${user.childId}`);
    });
  });

  const parentNamespace = io.of('/parent');
  parentNamespace.use(authMiddleware);

  parentNamespace.on('connection', (socket: Socket) => {
    const user = socket.data.user as JwtPayload;
    if (!user || !user.accountId) {
      socket.disconnect();
      return;
    }
    console.log(`Parent connected: ${user.accountId}`);

    socket.on('subscribe:child', (childId: string) => {
      socket.join(`parent:${childId}`);
      console.log(`Parent ${user.accountId} subscribed to child ${childId}`);
    });

    socket.on('unsubscribe:child', (childId: string) => {
      socket.leave(`parent:${childId}`);
    });

    socket.on('command:lock', (data) => {
      io.of('/device').to(`device:${data.childId}`).emit('command:lock', data);
    });

    socket.on('command:wipe', (data) => {
      io.of('/device').to(`device:${data.childId}`).emit('command:wipe', data);
    });

    socket.on('command:screenshot', (data) => {
      io.of('/device').to(`device:${data.childId}`).emit('command:screenshot', data);
    });

    socket.on('command:location-now', (data) => {
      io.of('/device').to(`device:${data.childId}`).emit('command:location-now', data);
    });

    socket.on('command:config-update', (data) => {
      io.of('/device').to(`device:${data.childId}`).emit('command:config-update', data);
    });

    socket.on('command:app-block', (data) => {
      io.of('/device').to(`device:${data.childId}`).emit('command:app-block', data);
    });

    socket.on('disconnect', () => {
      console.log(`Parent disconnected: ${user.accountId}`);
    });
  });

  return io;
}
