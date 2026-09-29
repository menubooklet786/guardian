'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export function useParentSocket(childId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!childId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(`${WS_URL}/parent`, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('subscribe:child', childId);
    });

    socket.on('disconnect', () => setConnected(false));

    socketRef.current = socket;

    return () => {
      socket.emit('unsubscribe:child', childId);
      socket.disconnect();
    };
  }, [childId]);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => { socketRef.current?.off(event, handler); };
  }, []);

  const sendCommand = useCallback((command: string, payload?: Record<string, unknown>) => {
    socketRef.current?.emit(`command:${command}`, { childId: '', ...payload });
  }, []);

  return { connected, on, sendCommand };
}
