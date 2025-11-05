# Промт для создания фронтенда Twitter Clone

Создай современный фронтенд для Twitter Clone на Next.js 14+ (App Router) с TypeScript, Tailwind CSS и shadcn/ui компонентами.

## 🎯 Основные требования

- **Framework**: Next.js 14+ (App Router)
- **Язык**: TypeScript
- **Стили**: Tailwind CSS
- **UI компоненты**: shadcn/ui
- **Состояние**: Zustand или React Context
- **HTTP клиент**: Fetch API с обработкой токенов
- **WebSocket**: Socket.IO Client для real-time обновлений
- **Формы**: React Hook Form + Zod валидация

## 📡 API Endpoints и форматы данных

### Base URL
```
Production: https://twitter-bny4.onrender.com
Development: http://localhost:3000
```

### Аутентификация

#### 1. POST `/auth/register`
**Запрос:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "displayName": "User Name"
}
```
**Ответ (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "displayName": "User Name"
  }
}
```
**Примечание**: После регистрации отправляется письмо для подтверждения email.

#### 2. POST `/auth/login`
**Запрос:**
```json
{
  "emailOrUsername": "username или email",
  "password": "password123",
  "rememberMe": false
}
```
**Ответ (200):**
```json
{
  "accessToken": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "displayName": "User Name"
  }
}
```
**Важно**: `refreshToken` приходит в httpOnly cookie, не доступен в JS.

#### 3. POST `/auth/refresh`
**Запрос:** Пустое тело (refreshToken в cookie)
**Ответ (200):**
```json
{
  "accessToken": "новый-jwt-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "displayName": "User Name"
  }
}
```

#### 4. POST `/auth/logout`
**Запрос:** Пустое тело
**Ответ (200):**
```json
{
  "ok": true
}
```

#### 5. GET `/auth/verify-email?token=...`
**Запрос:** Query параметр `token`
**Ответ (200):**
```json
{
  "message": "Email verified successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

#### 6. POST `/auth/send-verification`
**Запрос:**
```json
{
  "email": "user@example.com"
}
```
**Ответ (200):**
```json
{
  "message": "Verification email sent"
}
```

#### 7. POST `/auth/forgot`
**Запрос:**
```json
{
  "email": "user@example.com"
}
```
**Ответ (200):**
```json
{
  "message": "Reset email sent"
}
```

#### 8. POST `/auth/reset`
**Запрос:**
```json
{
  "token": "reset-token",
  "newPassword": "newPassword123"
}
```
**Ответ (200):**
```json
{
  "message": "Password reset successfully"
}
```

### Посты

#### 9. POST `/posts`
**Headers:** `Authorization: Bearer <accessToken>`
**Запрос (JSON):**
```json
{
  "text": "Текст поста (до 280 символов)",
  "imageUrl": "https://example.com/image.jpg (опционально)"
}
```
**Ответ (201):**
```json
{
  "post": {
    "id": "uuid",
    "text": "Текст поста",
    "imageUrl": "/uploads/image.jpg",
    "authorId": "uuid",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "isDeleted": false,
    "author": {
      "id": "uuid",
      "username": "username",
      "displayName": "User Name",
      "bio": "Bio",
      "avatarUrl": "/uploads/avatar.jpg",
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    "_count": {
      "likes": 0
    },
    "isLiked": false
  }
}
```

#### 10. GET `/posts/feed?limit=20&cursor=uuid`
**Headers:** `Authorization: Bearer <accessToken>`
**Query параметры:**
- `limit` (опционально, по умолчанию 20)
- `cursor` (опционально, ID последнего поста для пагинации)

**Ответ (200):**
```json
{
  "posts": [
    {
      "id": "uuid",
      "text": "Текст поста",
      "imageUrl": "/uploads/image.jpg",
      "authorId": "uuid",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "isDeleted": false,
      "author": {
        "id": "uuid",
        "username": "username",
        "displayName": "User Name",
        "bio": "Bio",
        "avatarUrl": "/uploads/avatar.jpg",
        "createdAt": "2025-01-01T00:00:00.000Z"
      },
      "_count": {
        "likes": 5
      },
      "isLiked": true
    }
  ],
  "nextCursor": "uuid или null"
}
```
**Примечание:** Лента включает собственные посты пользователя + посты от подписок.

#### 11. POST `/posts/:id/like`
**Headers:** `Authorization: Bearer <accessToken>`
**Ответ (200):**
```json
{
  "ok": true
}
```

#### 12. DELETE `/posts/:id/like`
**Headers:** `Authorization: Bearer <accessToken>`
**Ответ (200):**
```json
{
  "ok": true
}
```

#### 13. GET `/posts/search?q=запрос&limit=20&cursor=uuid`
**Headers:** `Authorization: Bearer <accessToken>`
**Query параметры:**
- `q` (обязательно, текст для поиска)
- `limit` (опционально)
- `cursor` (опционально)

**Ответ (200):** Такой же формат как `/posts/feed`

#### 14. GET `/favorites?limit=20&cursor=uuid`
**Headers:** `Authorization: Bearer <accessToken>`
**Ответ (200):** Такой же формат как `/posts/feed` (посты, которые лайкнул текущий юзер)

### Пользователи

#### 15. GET `/users/:username`
**Headers:** `Authorization: Bearer <accessToken>` (опционально)
**Ответ (200):**
```json
{
  "user": {
    "id": "uuid",
    "username": "username",
    "displayName": "User Name",
    "bio": "Био пользователя",
    "avatarUrl": "/uploads/avatar.jpg",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "_count": {
      "posts": 42,
      "followers": 100,
      "following": 50
    }
  },
  "isFollowing": false
}
```

#### 15b. GET `/users/:username/posts?limit=20&cursor=uuid`
**Headers:** `Authorization: Bearer <accessToken>`
**Query параметры:**
- `limit` (опционально, по умолчанию 20)
- `cursor` (опционально)

**Ответ (200):**
```json
{
  "posts": [
    {
      "id": "uuid",
      "text": "Текст поста",
      "imageUrl": "/uploads/image.jpg",
      "authorId": "uuid",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "isDeleted": false,
      "author": {
        "id": "uuid",
        "username": "username",
        "displayName": "User Name",
        "bio": "Bio",
        "avatarUrl": "/uploads/avatar.jpg",
        "createdAt": "2025-01-01T00:00:00.000Z"
      },
      "_count": {
        "likes": 5
      },
      "isLiked": true
    }
  ],
  "nextCursor": "uuid или null"
}
```
**Примечание:** Возвращает посты конкретного пользователя для страницы профиля.

#### 16. PATCH `/users/me`
**Headers:** 
- `Authorization: Bearer <accessToken>`
- `Content-Type: multipart/form-data` (если загружается аватар)

**Запрос:**
```json
{
  "displayName": "Новое имя",
  "bio": "Новое био",
  "avatar": "файл (опционально)"
}
```
**Ответ (200):**
```json
{
  "user": {
    "id": "uuid",
    "username": "username",
    "displayName": "Новое имя",
    "bio": "Новое био",
    "avatarUrl": "/uploads/avatar.jpg"
  }
}
```

#### 17. POST `/users/:id/follow`
**Headers:** `Authorization: Bearer <accessToken>`
**Ответ (200):**
```json
{
  "ok": true
}
```

#### 18. DELETE `/users/:id/follow`
**Headers:** `Authorization: Bearer <accessToken>`
**Ответ (200):**
```json
{
  "ok": true
}
```

#### 19. GET `/users/search?q=запрос&limit=20`
**Headers:** `Authorization: Bearer <accessToken>`
**Query параметры:**
- `q` (обязательно)
- `limit` (опционально)

**Ответ (200):**
```json
{
  "users": [
    {
      "id": "uuid",
      "username": "username",
      "displayName": "User Name",
      "bio": "Био",
      "avatarUrl": "/uploads/avatar.jpg",
      "isFollowing": false
    }
  ]
}
```

### Чат (Личные сообщения)

#### 20. GET `/conversations`
**Headers:** `Authorization: Bearer <accessToken>`
**Ответ (200):**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "members": [
        {
          "user": {
            "id": "uuid",
            "username": "username",
            "displayName": "User Name",
            "avatarUrl": "/uploads/avatar.jpg"
          }
        }
      ],
      "messages": [
        {
          "id": "uuid",
          "text": "Последнее сообщение",
          "createdAt": "2025-01-01T00:00:00.000Z",
          "senderId": "uuid"
        }
      ]
    }
  ]
}
```

#### 21. POST `/conversations`
**Headers:** `Authorization: Bearer <accessToken>`
**Запрос:**
```json
{
  "participantId": "uuid другого пользователя"
}
```
**Ответ (201):**
```json
{
  "conversation": {
    "id": "uuid",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### 22. GET `/conversations/:id/messages?limit=50&cursor=uuid`
**Headers:** `Authorization: Bearer <accessToken>`
**Query параметры:**
- `limit` (опционально)
- `cursor` (опционально)

**Ответ (200):**
```json
{
  "messages": [
    {
      "id": "uuid",
      "conversationId": "uuid",
      "senderId": "uuid",
      "text": "Текст сообщения",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "readAt": null,
      "sender": {
        "id": "uuid",
        "username": "username",
        "displayName": "User Name",
        "avatarUrl": "/uploads/avatar.jpg"
      }
    }
  ],
  "nextCursor": "uuid или null"
}
```

#### 23. POST `/conversations/:id/messages`
**Headers:** `Authorization: Bearer <accessToken>`
**Запрос:**
```json
{
  "text": "Текст сообщения"
}
```
**Ответ (201):**
```json
{
  "message": {
    "id": "uuid",
    "conversationId": "uuid",
    "senderId": "uuid",
    "text": "Текст сообщения",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Уведомления

#### 24. GET `/notifications?limit=50&cursor=uuid`
**Headers:** `Authorization: Bearer <accessToken>`
**Query параметры:**
- `limit` (опционально)
- `cursor` (опционально)

**Ответ (200):**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "new_message | new_post_from_followed | like | follow",
      "payload": {
        "postId": "uuid",
        "conversationId": "uuid",
        "userId": "uuid",
        "username": "username",
        "displayName": "User Name"
      },
      "isRead": false,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "nextCursor": "uuid или null"
}
```

## 🔌 WebSocket Events (Socket.IO)

### Подключение
```typescript
import { io } from 'socket.io-client';

const socket = io('https://twitter-bny4.onrender.com', {
  auth: {
    token: accessToken // JWT токен
  }
});
```

### События от сервера:

#### 1. `hello`
Приходит сразу после подключения
```json
{
  "message": "connected"
}
```

#### 2. `message:new`
Новое сообщение в чате
```json
{
  "message": {
    "id": "uuid",
    "conversationId": "uuid",
    "senderId": "uuid",
    "text": "Текст",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "sender": {
      "id": "uuid",
      "username": "username",
      "displayName": "User Name",
      "avatarUrl": "/uploads/avatar.jpg"
    }
  }
}
```

#### 3. `conversation:new`
Новый диалог создан
```json
{
  "conversation": {
    "id": "uuid",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### 4. `notification:new`
Новое уведомление
```json
{
  "notification": {
    "id": "uuid",
    "type": "new_message | new_post_from_followed | like | follow",
    "payload": { ... },
    "isRead": false,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### 5. `post:new`
Новый пост от подписок (для real-time ленты)
```json
{
  "post": {
    "id": "uuid",
    "text": "Текст",
    "imageUrl": "/uploads/image.jpg",
    "authorId": "uuid",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "author": { ... },
    "_count": { "likes": 0 },
    "isLiked": false
  }
}
```

## 🔐 Обработка авторизации на фронте

### Схема работы с токенами:

1. **Access Token**: 
   - Хранить в памяти (useState/Zustand)
   - НЕ хранить в localStorage (небезопасно)
   - Время жизни: 1 час (по умолчанию)
   - Отправлять в header: `Authorization: Bearer <token>`

2. **Refresh Token**:
   - Хранится в httpOnly cookie (автоматически)
   - Не доступен для JavaScript
   - Время жизни: 7 дней (без remember_me) или 30 дней (с remember_me)

3. **Автоматическое обновление токена**:
   - При 401 ошибке вызывать `/auth/refresh`
   - Если refresh успешен → повторить оригинальный запрос
   - Если refresh провален → разлогинить пользователя

### Пример fetch wrapper:
```typescript
async function authFetch(url: string, options: RequestInit = {}) {
  const token = getAccessToken(); // из состояния
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // для отправки cookies
    headers: {
      ...options.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });

  if (response.status === 401) {
    // Попробовать обновить токен
    const refreshResponse = await fetch('/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });

    if (refreshResponse.ok) {
      const { accessToken } = await refreshResponse.json();
      setAccessToken(accessToken);
      
      // Повторить оригинальный запрос
      return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${accessToken}`
        }
      });
    } else {
      // Разлогинить
      logout();
      throw new Error('Session expired');
    }
  }

  return response;
}
```

## 📱 UI/UX Требования

### Страницы:

1. **`/login`** - Форма входа
2. **`/register`** - Форма регистрации
3. **`/forgot-password`** - Восстановление пароля
4. **`/reset-password?token=...`** - Ввод нового пароля
5. **`/verify-email?token=...`** - Подтверждение email
6. **`/feed`** - Главная лента (защищена)
7. **`/profile/[username]`** - Профиль пользователя
8. **`/profile/edit`** - Редактирование своего профиля
9. **`/messages`** - Список диалогов
10. **`/messages/[id]`** - Конкретный диалог
11. **`/notifications`** - Уведомления
12. **`/search`** - Поиск пользователей и постов
13. **`/favorites`** - Избранные посты (лайкнутые)

### Компоненты:

- **Layout**: Сайдбар с навигацией (Feed, Messages, Notifications, Profile, Logout)
- **PostCard**: Карточка поста с аватаром, текстом, изображением, лайком
- **PostComposer**: Форма создания поста с превью изображения
- **UserCard**: Карточка пользователя (для поиска, подписок)
- **MessageBubble**: Сообщение в чате
- **NotificationItem**: Элемент уведомления
- **InfiniteScroll**: Компонент для бесконечной прокрутки с cursor-based пагинацией

### Стиль:

- Тёмная и светлая темы (переключатель)
- Адаптивный дизайн (mobile-first)
- Современный, минималистичный дизайн в стиле Twitter/X
- Анимации при лайках, отправке сообщений
- Skeleton loaders для загрузки
- Toast уведомления для success/error

## 🎨 Дополнительные фичи

- **Оптимистичные обновления**: При лайке сразу обновлять UI, не дожидаясь ответа сервера
- **Debounce**: Для поиска пользователей/постов
- **Image preview**: Перед загрузкой аватара/изображения поста
- **Emoji picker**: Для постов и сообщений
- **Markdown поддержка**: В постах (опционально)
- **Link preview**: Для ссылок в постах (опционально)
- **Typing indicator**: "Пользователь печатает..." в чатах (через Socket.IO)
- **Online status**: Показывать кто онлайн (через Socket.IO rooms)

## ⚠️ Важные замечания

1. **CORS**: Бэкенд настроен на `credentials: true`, всегда используй `credentials: 'include'` в fetch
2. **Изображения**: Путь к изображениям начинается с `/uploads/`, полный URL: `https://twitter-bny4.onrender.com/uploads/filename.jpg`
3. **Валидация**: Используй Zod схемы на фронте (такие же как на бэке)
4. **Error handling**: Все ошибки приходят в формате `{ "error": "сообщение" }`
5. **Rate limiting**: Есть лимиты на запросы (100/15мин для обычных, 5/15мин для auth)
6. **WebSocket reconnection**: Обрабатывай переподключение при потере соединения
7. **Токен в WebSocket**: Передавай accessToken в `socket.handshake.auth.token`

## 🚀 Начальная настройка

```bash
npx create-next-app@latest twitter-clone-frontend --typescript --tailwind --app
cd twitter-clone-frontend
npx shadcn-ui@latest init
npm install socket.io-client zustand react-hook-form zod @hookform/resolvers
```

## 📦 Примерная структура проекта

```
app/
  (auth)/
    login/
    register/
    forgot-password/
    reset-password/
  (protected)/
    feed/
    profile/
    messages/
    notifications/
    search/
    favorites/
  layout.tsx
  page.tsx
components/
  ui/ (shadcn)
  PostCard.tsx
  PostComposer.tsx
  UserCard.tsx
  MessageBubble.tsx
  ...
lib/
  api.ts (fetch wrapper)
  socket.ts (Socket.IO client)
  auth.ts (auth logic)
  utils.ts
store/
  authStore.ts (Zustand)
  postsStore.ts
  ...
types/
  api.ts (TypeScript types для API)
```

Создай полноценный, современный и красивый Twitter Clone фронтенд с учётом всех этих требований! 🎉
Сайт должен быть на украинском языке!!!
