# Google OAuth - Інструкція для фронтенду

## ✅ Бекенд готовий!

Логи показують, що Google OAuth працює ідеально:
- ✅ Користувач знайдений/створений
- ✅ Токени згенеровані
- ✅ Редірект на фронтенд виконується

## ❌ Проблема: Фронтенд повертає 404

Бекенд редіректить на:
```
https://twitter-front-udyr.onrender.com/auth/callback?accessToken=...&refreshToken=...&user=...
```

Але фронтенд не має цієї сторінки.

---

## 🔧 Що потрібно зробити на фронтенді

### 1. Створити сторінку `/auth/callback`

**Next.js:** `app/auth/callback/page.tsx` або `pages/auth/callback.tsx`

**React Router:** додати роут `<Route path="/auth/callback" element={<AuthCallback />} />`

### 2. Код сторінки `/auth/callback`

```tsx
'use client'; // Якщо Next.js App Router

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Next.js
// або
// import { useNavigate, useSearchParams } from 'react-router-dom'; // React Router

export default function AuthCallback() {
  const router = useRouter(); // Next.js
  // const navigate = useNavigate(); // React Router
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      console.error('❌ Google OAuth error:', error);
      alert(`Google login failed: ${error}`);
      router.push('/login'); // Next.js
      // navigate('/login'); // React Router
      return;
    }

    if (!accessToken || !refreshToken || !userParam) {
      console.error('❌ Missing tokens or user data');
      router.push('/login');
      return;
    }

    try {
      // Парсимо user data
      const user = JSON.parse(decodeURIComponent(userParam));
      
      console.log('✅ Google OAuth success:', { user });

      // Зберігаємо в localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Редірект на головну
      console.log('🔄 Redirecting to home...');
      router.push('/'); // Next.js
      // navigate('/'); // React Router
    } catch (err) {
      console.error('❌ Failed to parse user data:', err);
      router.push('/login');
    }
  }, [searchParams, router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div className="spinner" />
      <p>Completing Google login...</p>
    </div>
  );
}
```

### 3. Кнопка "Увійти через Google" на сторінці логіну

```tsx
<button
  onClick={() => {
    window.location.href = 'https://twitter-bny4.onrender.com/auth/google';
  }}
  className="google-login-button"
>
  <GoogleIcon /> {/* Іконка Google */}
  Continue with Google
</button>
```

**Для локальної розробки:**
```tsx
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

<button
  onClick={() => {
    window.location.href = `${API_URL}/auth/google`;
  }}
>
  Continue with Google
</button>
```

---

## 📋 Перевірка

1. **Створи сторінку** `/auth/callback` з кодом вище
2. **Додай кнопку** "Continue with Google" на сторінці логіну
3. **Спробуй увійти** через Google
4. **Перевір консоль браузера** - мають бути логи:
   ```
   ✅ Google OAuth success: { user: {...} }
   🔄 Redirecting to home...
   ```
5. **Перевір localStorage** - мають бути `accessToken`, `refreshToken`, `user`

---

## 🐛 Якщо не працює

### Перевір URL в Google Cloud Console

**Authorized redirect URIs** має містити:
```
https://twitter-bny4.onrender.com/auth/google/callback
```

**НЕ** фронтенд URL!

### Перевір FRONTEND_URL на Render

В Environment Variables на Render:
```
FRONTEND_URL=https://twitter-front-udyr.onrender.com
```

### Перевір CORS на бекенді

В `.env` на Render:
```
CORS_ORIGIN=https://twitter-front-udyr.onrender.com,http://localhost:3000
```

---

## 🎯 Результат

Після входу через Google:
- ✅ Користувач автоматично створюється/знаходиться в БД
- ✅ `googleId` зберігається
- ✅ Токени генеруються
- ✅ Користувач редіректиться на головну сторінку
- ✅ Автоматичний логін при наступних входах

---

## 📝 Примітки

- **Токени зберігаються в localStorage**, не в cookies
- **Refresh token** використовується для оновлення access token
- **Google OAuth** працює як для нових, так і для існуючих користувачів
- Якщо користувач вже існує з таким email - до нього додається `googleId`
