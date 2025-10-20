import { prisma } from '../prisma/client.js';
import { io } from '../sockets/io.js';
import { createNotification } from './notifications.service.js';

export async function createPost(authorId: string, text: string, imageUrl?: string) {
  if (text.length > 280) {
    throw new Error('Max 280 chars');
  }
  const post = await prisma.post.create({
    data: { authorId, text, imageUrl },
  });
  // уведомим подписчиков
  const followers = await prisma.follow.findMany({ where: { followingId: authorId }, select: { followerId: true } });
  const rooms = followers.map((f) => `user:${f.followerId}`);
  if (rooms.length) io?.to(rooms).emit('new_post', { post });
  await Promise.all(
    followers.map((f) => createNotification(f.followerId, 'new_post_from_followed', { postId: post.id, authorId }))
  );
  return post;
}

export async function likePost(userId: string, postId: string) {
  await prisma.like.create({
    data: { userId, postId },
  });
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (post && post.authorId !== userId) {
    await createNotification(post.authorId, 'like', { postId, userId });
  }
}

export async function unlikePost(userId: string, postId: string) {
  await prisma.like.delete({
    where: { userId_postId: { userId, postId } },
  });
}

export type FeedParams = {
  userId: string;
  limit?: number;
  cursor?: string | null;
};

export async function getFeed({ userId, limit = 10, cursor }: FeedParams) {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const authorIds = following.map((f) => f.followingId);
  if (authorIds.length === 0) return { items: [], nextCursor: null };

  const posts = await prisma.post.findMany({
    where: { authorId: { in: authorIds }, isDeleted: false },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      likes: { select: { userId: true } },
    },
  });

  let nextCursor: string | null = null;
  if (posts.length > limit) {
    const next = posts.pop();
    nextCursor = next ? next.id : null;
  }
  return { items: posts, nextCursor };
}

export type Pagination = { limit?: number; cursor?: string | null };

export async function getFavorites(userId: string, { limit = 10, cursor }: Pagination) {
  const likes = await prisma.like.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    include: {
      post: {
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          likes: { select: { userId: true } },
        },
      },
    },
  });

  let nextCursor: string | null = null;
  if (likes.length > limit) {
    const next = likes.pop();
    nextCursor = next ? next.id : null;
  }
  return { items: likes.map((l) => l.post), nextCursor };
}

export async function searchPosts(query: string, { limit = 10, cursor }: Pagination) {
  const posts = await prisma.post.findMany({
    where: {
      isDeleted: false,
      text: { contains: query, mode: 'insensitive' },
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      likes: { select: { userId: true } },
    },
  });

  let nextCursor: string | null = null;
  if (posts.length > limit) {
    const next = posts.pop();
    nextCursor = next ? next.id : null;
  }
  return { items: posts, nextCursor };
}


