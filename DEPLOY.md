# Деплой Twitter Clone

Этот файл содержит инструкции по деплою проекта на различные платформы.

## Подготовка к деплою

1. **Настройте переменные окружения** (см. `.env.example`)
2. **Выполните миграции БД**: `npx prisma migrate deploy`
3. **Соберите проект**: `npm run build`

## Варианты деплоя

### 1. Render.com (рекомендуется)

**Шаги:**

1. Создайте аккаунт на [Render.com](https://render.com)
2. Подключите ваш GitHub репозиторий
3. Создайте **Web Service**:
   - **Build Command**: `npm install && npm run build && npx prisma migrate deploy`
   - **Start Command**: `npm start`
   - **Environment**: Node
   - **Node Version**: 20

4. Добавьте переменные окружения в Render Dashboard:
   ```
   DATABASE_URL=<your_postgres_url>
   REDIS_URL=<your_redis_url>
   JWT_SECRET=<strong_random_string>
   EMAIL_HOST=smtp.gmail.com
   EMAIL_USER=<your_email>
   EMAIL_PASS=<your_app_password>
   FRONTEND_URL=https://your-frontend-domain.com
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

5. Создайте PostgreSQL базу данных в Render
6. Создайте Redis инстанс в Render (или используйте Upstash)

### 2. Railway.app

**Шаги:**

1. Создайте аккаунт на [Railway.app](https://railway.app)
2. Подключите GitHub репозиторий
3. Railway автоматически определит Node.js проект
4. Добавьте PostgreSQL и Redis плагины
5. Настройте переменные окружения:
   - Railway автоматически создаст `DATABASE_URL` для PostgreSQL
   - Добавьте `REDIS_URL` вручную
   - Добавьте остальные переменные из `.env.example`

6. Railway автоматически запустит `npm start` после деплоя

### 3. DigitalOcean App Platform

**Шаги:**

1. Создайте аккаунт на [DigitalOcean](https://digitalocean.com)
2. Перейдите в App Platform → Create App
3. Подключите GitHub репозиторий
4. Настройте Build & Run:
   - **Build Command**: `npm install && npm run build && npx prisma migrate deploy`
   - **Run Command**: `npm start`
   - **HTTP Port**: 3000

5. Добавьте Managed Database (PostgreSQL) и Database (Redis)
6. Настройте переменные окружения

### 4. AWS (EC2/ECS)

**Для EC2:**

1. Запустите EC2 инстанс (Ubuntu 22.04)
2. Установите Docker: `curl -fsSL https://get.docker.com | sh`
3. Склонируйте репозиторий
4. Создайте `.env` файл
5. Запустите через Docker Compose:
   ```bash
   docker-compose up -d
   ```

**Для ECS:**

1. Создайте ECR репозиторий
2. Соберите и запушьте Docker образ:
   ```bash
   docker build -t twitter-clone .
   docker tag twitter-clone:latest <your-ecr-url>/twitter-clone:latest
   docker push <your-ecr-url>/twitter-clone:latest
   ```
3. Создайте ECS service с этим образом
4. Настройте переменные окружения в ECS Task Definition

### 5. Docker Compose (для VPS)

**docker-compose.prod.yml:**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: twitter
    volumes:
      - db_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  db_data:
  redis_data:
```

**Запуск:**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Важные моменты

1. **Prisma Migrations**: Выполните `npx prisma migrate deploy` перед первым запуском
2. **Переменные окружения**: Всегда используйте секреты платформы, не коммитьте `.env`
3. **HTTPS**: Настройте SSL сертификат (Let's Encrypt через nginx или через платформу)
4. **CORS**: Убедитесь что `CORS_ORIGIN` указывает на ваш frontend домен
5. **Email**: Используйте App Password для Gmail или настройте SendGrid/Mailgun
6. **Rate Limiting**: Настроен для `/auth/login` и `/auth/forgot` (50 запросов за 15 минут)

## Проверка после деплоя

1. Проверьте health endpoint: `GET https://your-domain.com/health`
2. Проверьте регистрацию: `POST /auth/register`
3. Проверьте подключение к БД через Prisma Studio (локально)
4. Проверьте Socket.IO подключение

## Troubleshooting

- **Ошибка подключения к БД**: Проверьте `DATABASE_URL` и firewall правила
- **Миграции не применяются**: Запустите `npx prisma migrate deploy` вручную
- **Socket.IO не работает**: Проверьте что WebSocket разрешен на платформе
- **Ошибки загрузки файлов**: Убедитесь что папка `uploads` существует и доступна для записи

