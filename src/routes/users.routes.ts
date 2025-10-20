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

// Public profile by username
router.get('/:username', async (req, res) => {
  try {
    const user = await getPublicProfileByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: 'Not found' });
    return res.json(user);
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    const users = await searchUsers(q, 10);
    return res.json(users);
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
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


