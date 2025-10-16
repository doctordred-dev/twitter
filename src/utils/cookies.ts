import { Response } from 'express';

const isProd = process.env.NODE_ENV === 'production';

export function setRefreshCookie(res: Response, refreshToken: string) {
  const maxAgeDays = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7');
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'lax' : 'lax',
    maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'lax' : 'lax',
    path: '/',
  });
}


