import { createServer } from 'http';
import { Server } from 'socket.io';
import { initIo } from './sockets/io.js';
import { createApp } from './app.js';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

async function main() {
  // Проверка переменных окружения
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
  }

  const app = createApp();
  const httpServer = createServer(app);

  const io = new Server(httpServer, { cors: { origin: true, credentials: true } });
  initIo(io);
  io.on('connection', (socket) => {
    socket.emit('hello', { message: 'connected' });
  });

  const prisma = new PrismaClient();
  await prisma.$connect();

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redis = createClient({ url: redisUrl });
  redis.on('error', (err: unknown) => console.error('Redis error', err));
  await redis.connect();

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
