import crypto from 'crypto';
import { prisma } from '../prisma/client.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signAccessToken } from '../utils/jwt.js';

type RegisterInput = {
  email: string;
  username: string;
  password: string;
  displayName: string;
};

type LoginInput = {
  emailOrUsername: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: string;
};

function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function register(input: RegisterInput) {
  const { email, username, password, displayName } = input;
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    throw new Error('User with given email or username already exists');
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, username, passwordHash, displayName },
  });
  return { id: user.id, email: user.email, username: user.username, displayName: user.displayName };
}

export async function login(input: LoginInput) {
  const { emailOrUsername, password, rememberMe = false, deviceInfo } = input;
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
    },
  });
  if (!user) throw new Error('Invalid credentials');
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new Error('Invalid credentials');

  const accessToken = signAccessToken({ userId: user.id, username: user.username });
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);

  const days = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7');
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  // Удаляем старые истёкшие sessions (чистка)
  await prisma.session.deleteMany({ 
    where: { 
      userId: user.id,
      expiresAt: { lt: new Date() }
    } 
  });

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      rememberMe,
      deviceInfo,
      expiresAt,
    },
  });

  return { 
    accessToken, 
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    }
  };
}

export async function refresh(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const session = await prisma.session.findFirst({ where: { tokenHash } });
  if (!session) throw new Error('Invalid refresh token');
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    throw new Error('Refresh token expired');
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) throw new Error('User not found');

  const accessToken = signAccessToken({ userId: user.id, username: user.username });

  // Ротация refresh токена
  const newRefresh = generateRefreshToken();
  const newHash = hashToken(newRefresh);
  const days = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7');
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await prisma.session.update({
    where: { id: session.id },
    data: { tokenHash: newHash, expiresAt },
  });

  return { 
    accessToken, 
    refreshToken: newRefresh,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    }
  };
}

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const session = await prisma.session.findFirst({ where: { tokenHash } });
  if (!session) return;
  await prisma.session.delete({ where: { id: session.id } });
}


