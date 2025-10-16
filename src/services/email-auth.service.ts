import crypto from 'crypto';
import { prisma } from '../prisma/client.js';
import { sendVerificationEmail, sendResetEmail } from './email.service.js';
import { hashPassword } from '../utils/password.js';

export async function createEmailToken(userId: string, type: 'verify' | 'reset'): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  
  if (type === 'verify') {
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 часа
  } else {
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 час
  }

  await prisma.emailToken.create({
    data: {
      userId,
      token,
      type,
      expiresAt,
    },
  });

  return token;
}

export async function verifyEmailToken(token: string) {
  const emailToken = await prisma.emailToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!emailToken) {
    throw new Error('Invalid token');
  }

  if (emailToken.expiresAt < new Date()) {
    await prisma.emailToken.delete({ where: { id: emailToken.id } });
    throw new Error('Token expired');
  }

  if (emailToken.type === 'verify') {
    await prisma.user.update({
      where: { id: emailToken.userId },
      data: { emailVerified: true },
    });
  }

  // Удаляем использованный токен
  await prisma.emailToken.delete({ where: { id: emailToken.id } });

  return emailToken.user;
}

export async function sendVerificationToken(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('User not found');
  }

  if (user.emailVerified) {
    throw new Error('Email already verified');
  }

  // Удаляем старые токены верификации
  await prisma.emailToken.deleteMany({
    where: { userId: user.id, type: 'verify' },
  });

  const token = await createEmailToken(user.id, 'verify');
  await sendVerificationEmail(user.email, token, user.username);

  return { message: 'Verification email sent' };
}

export async function sendResetToken(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('User not found');
  }

  // Удаляем старые токены сброса
  await prisma.emailToken.deleteMany({
    where: { userId: user.id, type: 'reset' },
  });

  const token = await createEmailToken(user.id, 'reset');
  await sendResetEmail(user.email, token, user.username);

  return { message: 'Reset email sent' };
}

export async function resetPassword(token: string, newPassword: string) {
  const emailToken = await prisma.emailToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!emailToken) {
    throw new Error('Invalid token');
  }

  if (emailToken.expiresAt < new Date()) {
    await prisma.emailToken.delete({ where: { id: emailToken.id } });
    throw new Error('Token expired');
  }

  if (emailToken.type !== 'reset') {
    throw new Error('Invalid token type');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: emailToken.userId },
    data: { passwordHash },
  });

  // Удаляем использованный токен
  await prisma.emailToken.delete({ where: { id: emailToken.id } });

  return { message: 'Password reset successful' };
}
