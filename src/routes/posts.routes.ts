import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { createPost, getFeed, likePost, unlikePost, getFavorites, searchPosts } from '../services/posts.service.js';
import { getFullUploadUrl } from '../utils/urls.js';
import { uploadToCloudinary } from '../services/cloudinary.service.js';

const router = Router();

// Multer config for post images
const uploadsDir = path.join(process.cwd(), 'uploads');

// Використовуємо memory storage для Cloudinary, disk storage для локального
const useCloudinary = !!process.env.CLOUDINARY_CLOUD_NAME;
const storage = useCloudinary 
  ? multer.memoryStorage() 
  : multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadsDir),
      filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `post-${unique}${ext}`);
      },
    });

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const createPostSchema = z.object({
  text: z.string().min(1).max(280),
  imageUrl: z.string().url().optional(),
});

// ⚠️ ВАЖНО: Специфичные роуты (feed, favorites, search) должны быть ДО /:id
// иначе Express воспринимает "feed" как параметр id

// GET feed
router.get('/feed', authMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const cursor = (req.query.cursor as string) || null;
    const data = await getFeed({ userId: req.user!.userId, limit, cursor });
    return res.json(data);
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

// GET favorites
router.get('/favorites', authMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
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
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const cursor = (req.query.cursor as string) || null;
    const data = await searchPosts(q, { limit, cursor });
    return res.json({ posts: data.items, nextCursor: data.nextCursor });
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

// POST create post (supports both JSON with imageUrl and FormData with image file)
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { text } = req.body;
    
    // Валідація тексту
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    if (text.length > 280) {
      return res.status(400).json({ error: 'Text must be 280 characters or less' });
    }
    
    // Визначаємо imageUrl: або з файлу (FormData) або з body (JSON)
    let imageUrl: string | undefined;
    
    if (req.file) {
      // Якщо є Cloudinary - використовуємо його, інакше локальне сховище
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        try {
          imageUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);
        } catch (error) {
          console.error('Cloudinary upload failed, falling back to local:', error);
          const relativePath = `/uploads/${req.file.filename}`;
          imageUrl = getFullUploadUrl(relativePath) || relativePath;
        }
      } else {
        // Локальне сховище
        const relativePath = `/uploads/${req.file.filename}`;
        imageUrl = getFullUploadUrl(relativePath) || relativePath;
      }
    } else if (req.body.imageUrl) {
      // JSON з imageUrl
      imageUrl = req.body.imageUrl;
    }
    
    const post = await createPost(req.user!.userId, text.trim(), imageUrl);
    
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
          select: { 
            likes: true,
            comments: {
              where: { isDeleted: false }
            }
          }
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
    console.error('Create post error:', e);
    return res.status(400).json({ error: (e as Error).message });
  }
});

// GET single post by ID (ДОЛЖЕН БЫТЬ ПОСЛЕ всех специфичных роутов)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { prisma } = await import('../prisma/client.js');
    
    const post = await prisma.post.findUnique({
      where: { id },
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
          select: {
            likes: true,
            comments: {
              where: {
                isDeleted: false
              }
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
      }
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (post.isDeleted) {
      return res.status(404).json({ error: 'Post has been deleted' });
    }
    
    return res.json({
      post: {
        ...post,
        isLiked: post.likes.length > 0,
        likes: undefined
      }
    });
  } catch (e: unknown) {
    return res.status(500).json({ error: (e as Error).message });
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

// PATCH update post
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    
    if (!text || text.length === 0 || text.length > 280) {
      return res.status(400).json({ error: 'Text must be between 1 and 280 characters' });
    }
    
    const { prisma } = await import('../prisma/client.js');
    
    // Проверяем что пост принадлежит пользователю
    const existingPost = await prisma.post.findUnique({
      where: { id }
    });
    
    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (existingPost.authorId !== req.user!.userId) {
      return res.status(403).json({ error: 'You can only edit your own posts' });
    }
    
    // Опционально: проверка времени редактирования (15 минут)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (existingPost.createdAt < fifteenMinutesAgo) {
      return res.status(403).json({ error: 'Posts can only be edited within 15 minutes of creation' });
    }
    
    // Обновляем пост
    const updatedPost = await prisma.post.update({
      where: { id },
      data: { 
        text,
        updatedAt: new Date()
      },
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
        },
        likes: {
          where: { userId: req.user!.userId },
          select: { id: true }
        }
      }
    });
    
    return res.json({
      post: {
        ...updatedPost,
        isLiked: updatedPost.likes.length > 0,
        likes: undefined
      }
    });
  } catch (e: unknown) {
    return res.status(500).json({ error: (e as Error).message });
  }
});

// DELETE post
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { prisma } = await import('../prisma/client.js');
    
    const post = await prisma.post.findUnique({
      where: { id }
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (post.authorId !== req.user!.userId) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }
    
    // Soft delete
    await prisma.post.update({
      where: { id },
      data: { isDeleted: true }
    });
    
    return res.json({ ok: true });
  } catch (e: unknown) {
    return res.status(500).json({ error: (e as Error).message });
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

// ===== COMMENTS =====

// POST create comment
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    const { prisma } = await import('../prisma/client.js');
    
    // Проверяем что пост существует
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });
    
    if (!post || post.isDeleted) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Создаём комментарий
    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: req.user!.userId,
        text: text.trim()
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });
    
    // Создаём уведомление для автора поста (если это не сам автор)
    if (post.authorId !== req.user!.userId) {
      const { createNotification } = await import('../services/notifications.service.js');
      await createNotification(post.authorId, 'comment', {
        postId,
        commentId: comment.id,
        userId: req.user!.userId
      });
    }
    
    // Отправляем WebSocket событие
    const { io } = await import('../sockets/io.js');
    io?.to(`user:${post.authorId}`).emit('post:comment', { comment });
    
    return res.status(201).json({ comment });
  } catch (e: unknown) {
    console.error('Create comment error:', e);
    return res.status(500).json({ error: (e as Error).message });
  }
});

// GET comments for post
router.get('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { id: postId } = req.params;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const cursor = (req.query.cursor as string) || null;
    
    const { prisma } = await import('../prisma/client.js');
    
    const comments = await prisma.comment.findMany({
      where: {
        postId,
        isDeleted: false
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    });
    
    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, limit) : comments;
    
    return res.json({
      comments: items,
      nextCursor: hasMore ? items[items.length - 1].id : null
    });
  } catch (e: unknown) {
    console.error('Get comments error:', e);
    return res.status(500).json({ error: (e as Error).message });
  }
});

// DELETE comment
router.delete('/:postId/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { prisma } = await import('../prisma/client.js');
    
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (comment.authorId !== req.user!.userId) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }
    
    // Soft delete
    await prisma.comment.update({
      where: { id: commentId },
      data: { isDeleted: true }
    });
    
    return res.json({ ok: true });
  } catch (e: unknown) {
    return res.status(500).json({ error: (e as Error).message });
  }
});

// ===== REPOSTS =====

// POST create repost
router.post('/:id/repost', authMiddleware, async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { comment } = req.body;
    
    const { prisma } = await import('../prisma/client.js');
    
    // Перевіряємо що пост існує
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });
    
    if (!post || post.isDeleted) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Перевіряємо чи вже є репост
    const existingRepost = await prisma.repost.findUnique({
      where: {
        userId_postId: {
          userId: req.user!.userId,
          postId
        }
      }
    });
    
    if (existingRepost) {
      return res.status(400).json({ error: 'Already reposted' });
    }
    
    // Створюємо репост
    const repost = await prisma.repost.create({
      data: {
        userId: req.user!.userId,
        postId,
        comment: comment?.trim() || null
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true
              }
            },
            _count: {
              select: {
                likes: true,
                comments: { where: { isDeleted: false } },
                reposts: true
              }
            }
          }
        }
      }
    });
    
    // Створюємо сповіщення для автора поста (якщо це не він сам)
    if (post.authorId !== req.user!.userId) {
      const { createNotification } = await import('../services/notifications.service.js');
      await createNotification(post.authorId, 'repost', {
        postId,
        repostId: repost.id,
        userId: req.user!.userId
      });
    }
    
    // Відправляємо WebSocket подію
    const { io } = await import('../sockets/io.js');
    io?.to(`user:${post.authorId}`).emit('post:repost', { repost });
    
    return res.status(201).json({ repost });
  } catch (e: unknown) {
    console.error('Create repost error:', e);
    return res.status(500).json({ error: (e as Error).message });
  }
});

// DELETE repost
router.delete('/:id/repost', authMiddleware, async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { prisma } = await import('../prisma/client.js');
    
    const repost = await prisma.repost.findUnique({
      where: {
        userId_postId: {
          userId: req.user!.userId,
          postId
        }
      }
    });
    
    if (!repost) {
      return res.status(404).json({ error: 'Repost not found' });
    }
    
    await prisma.repost.delete({
      where: {
        userId_postId: {
          userId: req.user!.userId,
          postId
        }
      }
    });
    
    return res.json({ ok: true });
  } catch (e: unknown) {
    console.error('Delete repost error:', e);
    return res.status(500).json({ error: (e as Error).message });
  }
});

// GET reposts of a post
router.get('/:id/reposts', authMiddleware, async (req, res) => {
  try {
    const { id: postId } = req.params;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const cursor = (req.query.cursor as string) || null;
    
    const { prisma } = await import('../prisma/client.js');
    
    const reposts = await prisma.repost.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    });
    
    const hasMore = reposts.length > limit;
    const items = hasMore ? reposts.slice(0, limit) : reposts;
    
    return res.json({
      reposts: items,
      nextCursor: hasMore ? items[items.length - 1].id : null
    });
  } catch (e: unknown) {
    console.error('Get reposts error:', e);
    return res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
