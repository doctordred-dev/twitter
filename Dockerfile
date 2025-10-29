# Multi-stage build для оптимизации размера образа
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package files
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci

# Копируем исходники и собираем
COPY . .
RUN npm run build

# Production образ
FROM node:20-alpine

WORKDIR /app

# Копируем package files
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем только production зависимости
RUN npm ci --only=production

# Копируем собранные файлы из builder
COPY --from=builder /app/dist ./dist

# Создаем папку для загрузок
RUN mkdir -p uploads

# Генерируем Prisma Client
RUN npx prisma generate

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "import('http').then(m=>m.default.get('http://localhost:3000/health',r=>{process.exit(r.statusCode===200?0:1)}))"

# Запускаем миграции перед стартом приложения (обходит ограничение Pre-Deploy на бесплатном Render)
CMD ["sh", "-c", "npm run prisma:migrate && npm start"]

