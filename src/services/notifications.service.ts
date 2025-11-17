import { prisma } from '../prisma/client.js';
import { io } from '../sockets/io.js';

export type NotificationType = 'new_message' | 'new_post_from_followed' | 'like' | 'comment' | 'follow' | 'repost';

export async function createNotification(userId: string, type: NotificationType, payload: object) {
  const notif = await prisma.notification.create({
    data: { userId, type, payload: payload as any },
  });
  io?.to(`user:${userId}`).emit('notification:new', notif);
  return notif;
}

export async function listNotifications(userId: string, limit = 20, cursor?: string | null) {
  const notifs = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
  });
  let nextCursor: string | null = null;
  if (notifs.length > limit) {
    const next = notifs.pop();
    nextCursor = next ? next.id : null;
  }
  return { items: notifs, nextCursor };
}


