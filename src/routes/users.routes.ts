import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { followUser, unfollowUser } from '../services/follows.service.js';
import { getPublicProfileByUsername, searchUsers, updateMe } from '../services/users.service.js';

const router = Router();

// Multer config for avatars (local disk)
const uploadsDir = path.join(process.cwd(), 'uploads');
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `avatar-${unique}${ext}`);
  },
});
const upload = multer({ storage });

// ⚠️ ВАЖНО: Специфичные роуты (search, me) должны быть ДО /:username и /:id
// иначе Express воспринимает "search" как параметр username

// Search users
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    
    if (!q || q.trim().length === 0) {
      return res.json({ users: [] });
    }
    
    const { prisma } = await import('../prisma/client.js');
    
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { displayName: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: limit,
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        followers: {
          where: { followerId: req.user!.userId },
          select: { id: true }
        }
      }
    });
    
    const usersWithFollowStatus = users.map(user => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isFollowing: user.followers.length > 0
    }));
    
    return res.json({ users: usersWithFollowStatus });
  } catch (e: unknown) {
    console.error('User search error:', e);
    return res.status(500).json({ error: (e as Error).message });
  }
});

// Update profile (displayName, bio, avatar)
router.patch('/me', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const displayName = req.body.displayName as string | undefined;
    const bio = req.body.bio as string | undefined;
    const avatarUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const user = await updateMe({ userId: req.user!.userId, displayName, bio, avatarUrl });
    return res.json(user);
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

// Public profile by username
router.get('/:username', async (req, res) => {
  try {
    const user = await getPublicProfileByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: 'Not found' });
    
    // Проверяем подписку если пользователь аутентифицирован
    let isFollowing = false;
    if (req.user) {
      const { prisma } = await import('../prisma/client.js');
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: req.user.userId,
            followingId: user.id
          }
        }
      });
      isFollowing = !!follow;
    }
    
    return res.json({ user, isFollowing });
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

// Get user posts by username
router.get('/:username/posts', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const cursor = (req.query.cursor as string) || null;
    
    const { prisma } = await import('../prisma/client.js');
    
    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Загружаем посты пользователя
    const posts = await prisma.post.findMany({
      where: {
        authorId: user.id,
        isDeleted: false
      },
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
            }
          }
        },
        likes: {
          where: {
            userId: req.user!.userId
          },
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    });
    
    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    
    // Добавляем isLiked поле
    const postsWithIsLiked = items.map((post) => ({
      ...post,
      isLiked: post.likes.length > 0,
      likes: undefined
    }));
    
    return res.json({
      posts: postsWithIsLiked,
      nextCursor: hasMore ? items[items.length - 1].id : null
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's following (users that :username follows)
router.get('/:username/following', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    const { prisma } = await import('../prisma/client.js');
    
    // Знаходимо користувача за username
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Отримуємо список підписок (користувачів, на яких підписаний user)
    const following = await prisma.follow.findMany({
      where: {
        followerId: user.id // followerId - той хто підписується
      },
      include: {
        following: { // користувач на якого підписались (followingId)
          select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            followers: {
              where: { followerId: req.user!.userId },
              select: { id: true }
            }
          }
        }
      }
    });
    
    const users = following.map(f => ({
      ...f.following,
      isFollowing: f.following.followers.length > 0,
      followers: undefined
    }));
    
    return res.json({ users });
  } catch (error) {
    console.error('Get following error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's followers (users who follow :username)
router.get('/:username/followers', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    const { prisma } = await import('../prisma/client.js');
    
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Отримуємо список підписників (користувачів які підписались на user)
    const followers = await prisma.follow.findMany({
      where: {
        followingId: user.id // followingId - той на кого підписуються
      },
      include: {
        follower: { // користувач який підписався (followerId)
          select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            followers: {
              where: { followerId: req.user!.userId },
              select: { id: true }
            }
          }
        }
      }
    });
    
    const users = followers.map(f => ({
      ...f.follower,
      isFollowing: f.follower.followers.length > 0,
      followers: undefined
    }));
    
    return res.json({ users });
  } catch (error) {
    console.error('Get followers error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Follow/unfollow user
router.post('/:id/follow', authMiddleware, async (req, res) => {
  try {
    await followUser(req.user!.userId, req.params.id);
    return res.json({ ok: true });
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

router.delete('/:id/follow', authMiddleware, async (req, res) => {
  try {
    await unfollowUser(req.user!.userId, req.params.id);
    return res.json({ ok: true });
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

export default router;
