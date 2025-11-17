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
        console.log('🔵 [Passport] Google OAuth callback started');
        console.log('🔵 [Passport] Profile ID:', profile.id);
        console.log('🔵 [Passport] Profile emails:', profile.emails);
        console.log('🔵 [Passport] Profile displayName:', profile.displayName);

        if (!profile.emails || profile.emails.length === 0) {
          console.error('❌ [Passport] No email in Google profile');
          return done(new Error('Google profile has no email'), false);
        }

        const email = profile.emails[0].value;
        const googleId = profile.id;
        console.log('✅ [Passport] Email:', email);
        console.log('✅ [Passport] Google ID:', googleId);

        // 1. Спочатку шукаємо по googleId
        console.log('🔍 [Passport] Searching user by googleId...');
        let user = await prisma.user.findUnique({ where: { googleId } });
        console.log('🔍 [Passport] User by googleId:', user ? `Found (${user.username})` : 'Not found');

        // 2. Якщо не знайшли по googleId - шукаємо по email
        if (!user) {
          console.log('🔍 [Passport] Searching user by email...');
          user = await prisma.user.findUnique({ where: { email } });
          console.log('🔍 [Passport] User by email:', user ? `Found (${user.username})` : 'Not found');

          // Якщо знайшли по email - оновлюємо googleId
          if (user) {
            console.log('🔄 [Passport] Updating existing user with googleId...');
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId },
            });
            console.log('✅ [Passport] User updated with googleId');
          }
        }

        // 3. Якщо користувача немає взагалі - створюємо
        if (!user) {
          console.log('➕ [Passport] Creating new user...');
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
          console.log('✅ [Passport] Generated username:', username);

          const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
          const passwordHash = await hashPassword(randomPassword);
          console.log('✅ [Passport] Password hash generated');

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
          console.log('✅ [Passport] User created:', user.id, user.username);
        }

        // Повертаємо userId та username для authMiddleware
        console.log('✅ [Passport] Returning user to callback:', { userId: user.id, username: user.username });
        return done(null, {
          userId: user.id,
          username: user.username,
        } as any);
      } catch (error) {
        console.error('❌ [Passport] Strategy error:', error);
        console.error('❌ [Passport] Error stack:', (error as Error).stack);
        return done(error as Error, false);
      }
    }
  )
);

export default passport;
