# 🐦 Twitter Clone - Backend API

Повнофункціональний Twitter Clone backend на Node.js + TypeScript з підтримкою real-time оновлень, чатів, сповіщень та хмарного зберігання зображень.

## 🚀 Технологічний стек

- **Backend**: Express.js 5.1.0 + TypeScript
- **База даних**: PostgreSQL + Prisma ORM 6.17.1
- **Кеш**: Redis 5.8.3
- **WebSocket**: Socket.IO 4.8.1
- **Аутентифікація**: JWT + Refresh Tokens (httpOnly cookies)
- **Валідація**: Zod 4.1.12
- **Email**: Nodemailer 7.0.9
- **Файли**: Uploadcare CDN (з fallback на локальне сховище)
- **Rate Limiting**: Express Rate Limit 8.1.0

## ✨ Основні можливості

✅ Реєстрація з підтвердженням email  
✅ Логін/Logout з Remember Me (7-30 днів)  
✅ Відновлення пароля  
✅ CRUD операції з постами (текст до 280 символів + зображення)  
✅ Лайки та коментарі  
✅ Підписки (Follow/Unfollow)  
✅ Глобальна стрічка постів  
✅ Пошук користувачів та постів  
✅ Особисті повідомлення (чат)  
✅ Сповіщення (5 типів)  
✅ Real-time оновлення через WebSocket  
✅ Хмарне зберігання зображень (Uploadcare CDN)  

## 📦 Встановлення

### 1. Клонування репозиторію
```bash
git clone <repository-url>
cd twitter
```

### 2. Встановлення залежностей
```bash
npm install
```

### 3. Налаштування змінних оточення

Створи файл `.env` на основі `.env.example`:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/twitter?schema=public"

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_DAYS=7

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM="Twitter Clone <noreply@example.com>"

# Uploadcare (опціонально, для хмарного зберігання)
UPLOADCARE_PUBLIC_KEY=your_public_key
UPLOADCARE_SECRET_KEY=your_secret_key

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

### 4. Запуск бази даних (Docker)

```bash
# PostgreSQL
docker run -d \
  --name twitter-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=twitter \
  -p 5432:5432 \
  postgres:15

# Redis
docker run -d \
  --name twitter-redis \
  -p 6379:6379 \
  redis:7
```

### 5. Міграції бази даних

```bash
npx prisma migrate dev
npx prisma generate
```

### 6. Запуск сервера

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

Сервер запуститься на `http://localhost:3000`

## 📸 Налаштування Uploadcare (опціонально)

Для використання хмарного зберігання зображень:

1. Створи акаунт на [uploadcare.com](https://uploadcare.com)
2. Створи проект
3. Скопіюй Public Key та Secret Key
4. Додай їх в `.env`
5. Перезапусти сервер

**Детальна інструкція:** [UPLOADCARE_SETUP.md](./UPLOADCARE_SETUP.md)

**Без Uploadcare:** Зображення зберігаються локально в `/uploads`

## 📡 API Documentation

### Base URL
```
Production: https://twitter-bny4.onrender.com
Development: http://localhost:3000
```

### Основні endpoints:

#### Аутентифікація (`/auth`)
- `POST /auth/register` - Реєстрація
- `POST /auth/login` - Вхід
- `POST /auth/refresh` - Оновлення токена
- `POST /auth/logout` - Вихід
- `GET /auth/verify-email?token=...` - Підтвердження email
- `POST /auth/forgot` - Відновлення пароля
- `POST /auth/reset` - Скидання пароля

#### Пости (`/posts`)
- `POST /posts` - Створити пост
- `GET /posts/feed` - Глобальна стрічка
- `GET /posts/:id` - Отримати пост
- `PATCH /posts/:id` - Редагувати пост
- `DELETE /posts/:id` - Видалити пост
- `POST /posts/:id/like` - Лайкнути
- `DELETE /posts/:id/like` - Видалити лайк
- `GET /posts/favorites` - Обране
- `GET /posts/search` - Пошук постів
- `POST /posts/:id/comments` - Створити коментар
- `GET /posts/:id/comments` - Отримати коментарі

#### Користувачі (`/users`)
- `GET /users/:username` - Профіль користувача
- `GET /users/:username/posts` - Пости користувача
- `GET /users/:username/following` - Підписки
- `GET /users/:username/followers` - Підписники
- `PATCH /users/me` - Оновити профіль
- `POST /users/:id/follow` - Підписатись
- `DELETE /users/:id/follow` - Відписатись
- `GET /users/search` - Пошук користувачів

#### Чат (`/conversations`)
- `GET /conversations` - Список діалогів
- `POST /conversations` - Створити діалог
- `GET /conversations/:id/messages` - Повідомлення
- `POST /conversations/:id/messages` - Відправити повідомлення

#### Сповіщення (`/notifications`)
- `GET /notifications` - Список сповіщень

**Повна документація API:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) (в процесі)

## 🔌 WebSocket Events

### Підключення
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: accessToken }
});
```

### Події від сервера:
- `hello` - Підключення встановлено
- `new_post` - Новий пост від підписки
- `message:new` - Нове повідомлення
- `conversation:new` - Новий діалог
- `notification:new` - Нове сповіщення
- `post:comment` - Новий коментар

## 🗂️ Структура проекту

```
src/
├── app.ts                      # Express app конфігурація
├── index.ts                    # Точка входу
├── middlewares/
│   └── authMiddleware.ts       # JWT аутентифікація
├── routes/
│   ├── auth.routes.ts          # Роути аутентифікації
│   ├── posts.routes.ts         # Роути постів
│   ├── users.routes.ts         # Роути користувачів
│   ├── conversations.routes.ts # Роути чатів
│   └── notifications.routes.ts # Роути сповіщень
├── services/
│   ├── auth.service.ts         # Логіка аутентифікації
│   ├── email-auth.service.ts   # Email верифікація
│   ├── posts.service.ts        # Логіка постів
│   ├── users.service.ts        # Логіка користувачів
│   ├── follows.service.ts      # Логіка підписок
│   ├── chat.service.ts         # Логіка чатів
│   ├── notifications.service.ts # Логіка сповіщень
│   └── uploadcare.service.ts   # Uploadcare інтеграція
├── sockets/
│   └── io.ts                   # Socket.IO конфігурація
├── utils/
│   ├── jwt.ts                  # JWT утиліти
│   ├── password.ts             # Bcrypt утиліти
│   ├── cookies.ts              # Cookie утиліти
│   └── urls.ts                 # URL утиліти
└── prisma/
    └── client.ts               # Prisma клієнт
```

## 🔐 Безпека

- ✅ Bcrypt для хешування паролів (cost factor 10)
- ✅ JWT з секретом з env
- ✅ Refresh tokens зберігаються як SHA256 хеші
- ✅ httpOnly cookies для refresh tokens
- ✅ CORS з credentials
- ✅ Rate limiting на auth endpoints (50 req/15min)
- ✅ Валідація всіх вхідних даних через Zod
- ✅ Soft delete для постів та коментарів

## 📚 Документація

- **[UPLOADCARE_SETUP.md](./UPLOADCARE_SETUP.md)** - Повна інструкція з налаштування Uploadcare
- **[UPLOADCARE_QUICK_START.md](./UPLOADCARE_QUICK_START.md)** - Швидкий старт Uploadcare
- **[FRONTEND_UPLOADCARE_GUIDE.md](./FRONTEND_UPLOADCARE_GUIDE.md)** - Інструкція для фронтенду
- **[FRONTEND_UPLOADCARE_TLDR.md](./FRONTEND_UPLOADCARE_TLDR.md)** - Коротка версія для фронтенду
- **[FRONTEND_PROMPT.md](./FRONTEND_PROMPT.md)** - Промпт для створення фронтенду
- **[CHANGELOG.md](./CHANGELOG.md)** - Історія змін
- **[DEPLOY.md](./DEPLOY.md)** - Інструкція з деплою
- **[CORS_SETUP.md](./CORS_SETUP.md)** - Налаштування CORS
- **[ENV_VARS.md](./ENV_VARS.md)** - Опис змінних оточення

## 🧪 Тестування

```bash
npm test
```

*Примітка: Тести в процесі розробки*

## 🚀 Деплой

### Render.com (рекомендовано)

1. Створи новий Web Service на Render
2. Підключи GitHub репозиторій
3. Налаштуй змінні оточення
4. Додай PostgreSQL та Redis сервіси
5. Deploy!

**Детальна інструкція:** [DEPLOY.md](./DEPLOY.md)

## 📝 Ліцензія

ISC

## 👨‍💻 Автор

Vladislav

## 🤝 Contributing

Pull requests are welcome!

---

**Production URL:** https://twitter-bny4.onrender.com  
**API Status:** ✅ Online  
**Version:** 1.0.0
