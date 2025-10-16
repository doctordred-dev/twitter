import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

export const createApp = () => {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  // routes
  import('express').then(async () => {
    const { default: authRoutes } = await import('./routes/auth.routes.js');
    app.use('/auth', authRoutes);
  });

  return app;
};
