import type { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const jwtSecret = (process.env.JWT_SECRET || 'dev_secret_change_me') as jwt.Secret;

export let io: Server | null = null;

export function initIo(instance: Server) {
  io = instance;
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.toString().replace('Bearer ', '');
      if (!token) return next(new Error('No token'));
      const payload = jwt.verify(token, jwtSecret) as { userId: string };
      (socket as any).userId = payload.userId;
      socket.join(`user:${payload.userId}`);
      next();
    } catch (e) {
      next(new Error('Unauthorized'));
    }
  });
}


