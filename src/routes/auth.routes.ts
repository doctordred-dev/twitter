import crypto from 'crypto';
import { Router } from 'express';
import { z } from 'zod';
import passport from 'passport';
import { prisma } from '../prisma/client.js';
import { login, logout, refresh, register, loginWithProvider } from '../services/auth.service.js';
import { sendVerificationToken, sendResetToken, resetPassword, verifyEmailToken } from '../services/email-auth.service.js';
import { hashPassword } from '../utils/password.js';

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
    // ✅ Повертаємо обидва токени в JSON, без cookies
    return res.json({ 
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.user,
    });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.issues });
    return res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });
    const tokens = await refresh(refreshToken);
    // ✅ Повертаємо нові токени, без cookies
    return res.json({ 
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.user,
    });
  } catch (e: unknown) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/logout', async (req, res) => {
  try {
    // ✅ Інвалідовуємо refreshToken з body (якщо переданий)
    const { refreshToken } = req.body as { refreshToken?: string };
    if (refreshToken) {
      await logout(refreshToken);
    }
    return res.json({ message: 'Logged out successfully' });
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

// ===== Google OAuth (Passport) =====

// Ініціація Google OAuth
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// Callback від Google
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    try {
      const user = req.user as any;
      if (!user || !user.id) {
        return res.redirect(
          `${frontendUrl}/login?error=${encodeURIComponent('Google auth failed')}`
        );
      }

      // Видаємо наші токени (access + refresh) через існуючу логіку сесій
      const tokens = await loginWithProvider(user.id, 'google-oauth', true);

      const userPayload = {
        id: tokens.user.id,
        username: tokens.user.username,
        email: tokens.user.email,
        displayName: tokens.user.displayName,
        avatarUrl: tokens.user.avatarUrl,
      };

      const userEncoded = encodeURIComponent(JSON.stringify(userPayload));

      const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&user=${userEncoded}`;

      return res.redirect(redirectUrl);
    } catch (e: unknown) {
      const message = (e as Error).message || 'Google OAuth failed';
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(message)}`
      );
    }
  }
);

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


