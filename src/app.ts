import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import './config/passport.js';

dotenv.config();

export const createApp = () => {
  const app = express();
  
  // Trust proxy for Render (behind reverse proxy)
  app.set('trust proxy', 1);
  
  // CORS configuration
  const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];
  
  app.use(cors({ 
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true 
  }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // rate limits
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
  app.use('/auth/login', authLimiter);
  app.use('/auth/forgot', authLimiter);

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  // routes
  import('express').then(async () => {
    const { default: authRoutes } = await import('./routes/auth.routes.js');
    const { default: postsRoutes } = await import('./routes/posts.routes.js');
    const { default: usersRoutes } = await import('./routes/users.routes.js');
    const { default: convRoutes } = await import('./routes/conversations.routes.js');
    const { default: notifRoutes } = await import('./routes/notifications.routes.js');
    app.use('/auth', authRoutes);
    app.use('/posts', postsRoutes);
    app.use('/users', usersRoutes);
    app.use('/conversations', convRoutes);
    app.use('/notifications', notifRoutes);
  });

  return app;
};
