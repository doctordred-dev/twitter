import { prisma } from '../prisma/client.js';

export async function getPublicProfileByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      headerImageUrl: true,
      createdAt: true,
      _count: {
        select: { followers: true, following: true, posts: true },
      },
    },
  });
  return user;
}

export async function searchUsers(query: string, limit = 10) {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { displayName: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: { id: true, username: true, displayName: true, avatarUrl: true },
    take: limit,
    orderBy: { username: 'asc' },
  });
  return users;
}

type UpdateMeInput = {
  userId: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string | null;
};

export async function updateMe({ userId, displayName, bio, avatarUrl }: UpdateMeInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { displayName, bio, avatarUrl },
    select: { id: true, username: true, displayName: true, bio: true, avatarUrl: true },
  });
  return user;
}


