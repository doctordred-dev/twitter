import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { listNotifications } from '../services/notifications.service.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const cursor = (req.query.cursor as string) || null;
    const data = await listNotifications(req.user!.userId, limit, cursor);
    return res.json(data);
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

export default router;


