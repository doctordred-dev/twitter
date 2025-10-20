import { prisma } from '../prisma/client.js';

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) throw new Error('Cannot follow yourself');
  await prisma.follow.create({ data: { followerId, followingId } });
}

export async function unfollowUser(followerId: string, followingId: string) {
  await prisma.follow.delete({ where: { followerId_followingId: { followerId, followingId } } });
}


