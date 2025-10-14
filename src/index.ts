import { createServer } from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

async function main() {
  const app = createApp();
  const httpServer = createServer(app);

  const io = new Server(httpServer, { cors: { origin: true, credentials: true } });
  io.on('connection', (socket) => {
    socket.emit('hello', { message: 'connected' });
  });

  const prisma = new PrismaClient();
  await prisma.$connect();

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redis = createClient({ url: redisUrl });
  redis.on('error', (err: unknown) => console.error('Redis error', err));
  await redis.connect();

  httpServer.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
