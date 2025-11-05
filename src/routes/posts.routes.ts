import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { createPost, getFeed, likePost, unlikePost, getFavorites, searchPosts } from '../services/posts.service.js';

const router = Router();

const createPostSchema = z.object({
  text: z.string().min(1).max(280),
  imageUrl: z.string().url().optional(),
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { text, imageUrl } = createPostSchema.parse(req.body);
    const post = await createPost(req.user!.userId, text, imageUrl);
    
    // Загружаем полный объект поста с author
    const { prisma } = await import('../prisma/client.js');
    const fullPost = await prisma.post.findUnique({
      where: { id: post.id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            createdAt: true,
          }
        },
        _count: {
          select: { likes: true }
        }
      }
    });
    
    return res.status(201).json({
      post: {
        ...fullPost,
        isLiked: false
      }
    });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.issues });
    return res.status(400).json({ error: (e as Error).message });
  }
});

router.get('/feed', authMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const cursor = (req.query.cursor as string) || null;
    const data = await getFeed({ userId: req.user!.userId, limit, cursor });
    return res.json(data);
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    await likePost(req.user!.userId, postId);
    return res.json({ ok: true });
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

router.delete('/:id/like', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    await unlikePost(req.user!.userId, postId);
    return res.json({ ok: true });
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

export default router;

// Favorites
router.get('/favorites', authMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const cursor = (req.query.cursor as string) || null;
    const data = await getFavorites(req.user!.userId, { limit, cursor });
    return res.json(data);
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

// Search posts
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const cursor = (req.query.cursor as string) || null;
    const data = await searchPosts(q, { limit, cursor });
    return res.json(data);
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});


