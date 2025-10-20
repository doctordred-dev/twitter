import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { createOrGetConversation, getMessages, listConversations, sendMessage } from '../services/chat.service.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const items = await listConversations(req.user!.userId);
    return res.json(items);
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

router.get('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const cursor = (req.query.cursor as string) || null;
    const data = await getMessages(req.params.id, limit, cursor);
    return res.json(data);
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

const createSchema = z.object({ recipientId: z.string().uuid() });
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { recipientId } = createSchema.parse(req.body);
    const convo = await createOrGetConversation(req.user!.userId, recipientId);
    return res.json(convo);
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.issues });
    return res.status(400).json({ error: (e as Error).message });
  }
});

const sendSchema = z.object({ text: z.string().min(1).max(5000) });
router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { text } = sendSchema.parse(req.body);
    const msg = await sendMessage(req.params.id, req.user!.userId, text);
    return res.json(msg);
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.issues });
    return res.status(400).json({ error: (e as Error).message });
  }
});

export default router;


