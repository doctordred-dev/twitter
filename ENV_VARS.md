# Environment Variables

## Required Variables

### Database
- `DATABASE_URL` - PostgreSQL connection string
  - Local: `postgresql://user:password@localhost:5432/twitter`
  - Render: Automatically set by Render PostgreSQL service

### Redis
- `REDIS_URL` - Redis connection string
  - Local: `redis://localhost:6379`
  - Render: Get from Render Redis service

### JWT
- `JWT_SECRET` - Secret key for JWT tokens (use strong random string)
- `ACCESS_TOKEN_EXPIRES` - Access token expiration (e.g., `15m`)
- `REFRESH_TOKEN_EXPIRES_DAYS` - Refresh token expiration in days (e.g., `7`)

### Email (for verification and password reset)
- `EMAIL_HOST` - SMTP host (e.g., `smtp.gmail.com`)
- `EMAIL_PORT` - SMTP port (e.g., `587`)
- `EMAIL_USER` - SMTP username
- `EMAIL_PASS` - SMTP password
- `EMAIL_FROM` - From email address

### CORS
- `CORS_ORIGIN` - Allowed origins for CORS, comma-separated
  - Local: `http://localhost:3000,http://localhost:3001`
  - Production: `https://your-frontend.onrender.com`

### **🆕 Backend URL (for static files)**
- `BACKEND_URL` - Full URL of the backend server
  - **Local**: `http://localhost:3000`
  - **Production**: `https://your-backend.onrender.com` (e.g., `https://twitter-bny4.onrender.com`)
  - **Purpose**: Used to generate full URLs for uploaded images (avatars, post images)
  - **Why needed**: Frontend and backend are on different domains, so relative paths `/uploads/...` don't work

## Optional Variables

- `NODE_ENV` - Environment mode (`development` or `production`)
- `PORT` - Server port (default: `3000`)
- `RENDER_EXTERNAL_URL` - Automatically set by Render (fallback for `BACKEND_URL`)

## Example for Render.com

When deploying to Render, set these environment variables:

```
DATABASE_URL=<from Render PostgreSQL service>
REDIS_URL=<from Render Redis service>
JWT_SECRET=your-super-secret-jwt-key-here
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES_DAYS=7
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
CORS_ORIGIN=https://your-frontend.onrender.com
BACKEND_URL=https://your-backend.onrender.com
NODE_ENV=production
```

## Important Notes

1. **BACKEND_URL** must be set on Render for images to work correctly
2. If not set, it will fallback to `RENDER_EXTERNAL_URL` (auto-set by Render)
3. For local development, images will use `http://localhost:3000`

