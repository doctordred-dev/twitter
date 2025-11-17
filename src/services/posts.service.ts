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
  // ✅ ГЛОБАЛЬНА СТРІЧКА - показуємо ВСІ пости від всіх користувачів
  // (як Twitter/X - для you feed показуються всі пости)
  
  const posts = await prisma.post.findMany({
    where: { 
      isDeleted: false 
      // БЕЗ фільтра по authorId - показуємо ВСІ пости!
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    include: {
      author: { 
        select: { 
          id: true, 
          username: true, 
          displayName: true, 
          bio: true,
          avatarUrl: true,
          createdAt: true 
        } 
      },
      _count: {
        select: { 
          likes: true,
          comments: {
            where: { isDeleted: false }
          },
          reposts: true
        }
      },
      likes: { 
        where: { userId },
        select: { id: true } 
      },
      reposts: {
        where: { userId },
        select: { id: true }
      },
    },
  });

  let nextCursor: string | null = null;
  if (posts.length > limit) {
    const next = posts.pop();
    nextCursor = next ? next.id : null;
  }
  
  // Добавляем isLiked и isReposted поля
  const postsWithFlags = posts.map((post) => ({
    ...post,
    isLiked: post.likes.length > 0,
    isReposted: post.reposts.length > 0,
    likes: undefined, // Удаляем временное поле
    reposts: undefined, // Удаляем временное поле
  }));
  
  return { posts: postsWithFlags, nextCursor };
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


