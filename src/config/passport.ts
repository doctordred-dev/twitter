import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../prisma/client.js';
import { hashPassword } from '../utils/password.js';

// Passport використовує той же тип, що й authMiddleware
// (визначений в authMiddleware.ts)

// Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        if (!profile.emails || profile.emails.length === 0) {
          return done(new Error('Google profile has no email'), false);
        }

        const email = profile.emails[0].value;
        const googleId = profile.id;

        // 1. Спочатку шукаємо по googleId
        let user = await prisma.user.findUnique({ where: { googleId } });

        // 2. Якщо не знайшли по googleId - шукаємо по email
        if (!user) {
          user = await prisma.user.findUnique({ where: { email } });

          // Якщо знайшли по email - оновлюємо googleId
          if (user) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId },
            });
          }
        }

        // 3. Якщо користувача немає взагалі - створюємо
        if (!user) {
          const baseUsername = email.split('@')[0].slice(0, 30) || 'user';
          let username = baseUsername;
          let suffix = 1;

          // Гарантуємо унікальний username
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const existing = await prisma.user.findUnique({ where: { username } });
            if (!existing) break;
            username = `${baseUsername}${suffix}`.slice(0, 32);
            suffix += 1;
          }

          const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
          const passwordHash = await hashPassword(randomPassword);

          user = await prisma.user.create({
            data: {
              googleId,
              email,
              username,
              displayName: profile.displayName || username,
              avatarUrl: profile.photos?.[0]?.value,
              passwordHash,
              emailVerified: true,
            },
          });
        }

        // Повертаємо userId та username для authMiddleware
        return done(null, {
          userId: user.id,
          username: user.username,
        } as any);
      } catch (error) {
        return done(error as Error, false);
      }
    }
  )
);

export default passport;
