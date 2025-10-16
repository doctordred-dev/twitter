import { Router } from 'express';
import { z } from 'zod';
import { login, logout, refresh, register } from '../services/auth.service.js';
import { setRefreshCookie, clearRefreshCookie } from '../utils/cookies.js';
import { sendVerificationToken, sendResetToken, resetPassword, verifyEmailToken } from '../services/email-auth.service.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(64),
});

router.post('/register', async (req, res) => {
  try {
    const { email, username, password, displayName } = registerSchema.parse(req.body);
    const user = await register({ email, username, password, displayName });
    return res.json({ user });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.issues });
    return res.status(400).json({ error: (e as Error).message });
  }
});

const loginSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(8).max(128),
  rememberMe: z.boolean().optional(),
  deviceInfo: z.string().optional(),
});

router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password, rememberMe, deviceInfo } = loginSchema.parse(req.body);
    const tokens = await login({ emailOrUsername, password, rememberMe, deviceInfo });
    setRefreshCookie(res, tokens.refreshToken);
    return res.json({ accessToken: tokens.accessToken });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.issues });
    return res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh cookie' });
    const tokens = await refresh(refreshToken);
    setRefreshCookie(res, tokens.refreshToken);
    return res.json({ accessToken: tokens.accessToken });
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    if (refreshToken) await logout(refreshToken);
    clearRefreshCookie(res);
    return res.json({ ok: true });
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

// Email verification
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token required' });
    }
    const user = await verifyEmailToken(token);
    return res.json({ message: 'Email verified successfully', user: { id: user.id, email: user.email } });
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

// Send verification email
router.post('/send-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const result = await sendVerificationToken(email);
    return res.json(result);
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

// Forgot password
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const result = await sendResetToken(email);
    return res.json(result);
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

// Reset password
router.post('/reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and newPassword required' });
    }
    const result = await resetPassword(token, newPassword);
    return res.json(result);
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

export default router;


