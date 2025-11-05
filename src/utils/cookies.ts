import { Request, Response } from 'express';

const isProd = process.env.NODE_ENV === 'production';

// Функция для определения нужно ли использовать Secure флаг
function shouldUseSecure(req: Request): boolean {
  // Если разработка (не prod), всегда false
  if (!isProd) return false;
  
  // Если продакшн, проверяем origin запроса
  const origin = req.headers.origin || req.headers.referer || '';
  
  // Если запрос с localhost, отключаем Secure (для локальной разработки фронта)
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return false;
  }
  
  // Для всех остальных продакшн запросов - включаем Secure
  return true;
}

export function setRefreshCookie(req: Request, res: Response, refreshToken: string) {
  const maxAgeDays = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7');
  const useSecure = shouldUseSecure(req);
  
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: useSecure,
    sameSite: useSecure ? 'lax' : 'lax',
    maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearRefreshCookie(req: Request, res: Response) {
  const useSecure = shouldUseSecure(req);
  
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: useSecure,
    sameSite: useSecure ? 'lax' : 'lax',
    path: '/',
  });
}


