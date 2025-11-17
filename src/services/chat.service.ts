import { prisma } from '../prisma/client.js';
import { io } from '../sockets/io.js';
import { createNotification } from './notifications.service.js';

export async function listConversations(userId: string) {
  const items = await prisma.conversation.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: 'desc' },
    include: {
      members: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
      messages: { take: 1, orderBy: { createdAt: 'desc' } },
    },
  });
  return items;
}

export async function getMessages(conversationId: string, limit = 20, cursor?: string | null) {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });
  let nextCursor: string | null = null;
  if (messages.length > limit) {
    const next = messages.pop();
    nextCursor = next ? next.id : null;
  }
  return { items: messages.reverse(), nextCursor };
}

export async function createOrGetConversation(userA: string, userB: string) {
  if (userA === userB) throw new Error('Cannot create conversation with yourself');
  // Находим общий диалог из двух участников
  let convo = await prisma.conversation.findFirst({
    where: {
      AND: [
        { members: { some: { userId: userA } } },
        { members: { some: { userId: userB } } },
      ],
    },
  });
  if (!convo) {
    convo = await prisma.conversation.create({ data: {} });
    await prisma.conversationMember.createMany({
      data: [
        { conversationId: convo.id, userId: userA },
        { conversationId: convo.id, userId: userB },
      ],
    });
    io?.to(`user:${userA}`).to(`user:${userB}`).emit('conversation:new', { conversationId: convo.id, members: [userA, userB] });
    // уведомим участника B о новом диалоге
    if (userB !== userA) await createNotification(userB, 'new_message', { conversationId: convo.id });
  }
  return convo;
}

export async function sendMessage(conversationId: string, senderId: string, text: string) {
  if (!text || text.trim().length === 0) throw new Error('Text required');
  const message = await prisma.message.create({
    data: { conversationId, senderId, text },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });
  // нотифицируем участников беседы
  const members = await prisma.conversationMember.findMany({ where: { conversationId }, select: { userId: true } });
  const rooms = members.map((m) => `user:${m.userId}`);
  io?.to(rooms).emit('message:new', { conversationId, message });
  // уведомления всем участникам (кроме отправителя)
  await Promise.all(
    members
      .filter((m) => m.userId !== senderId)
      .map((m) => createNotification(m.userId, 'new_message', { conversationId, messageId: message.id }))
  );
  return message;
}


