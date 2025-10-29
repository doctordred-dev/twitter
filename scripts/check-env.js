#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join } from 'path';

const requiredEnvVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'EMAIL_HOST',
  'EMAIL_USER',
  'EMAIL_PASS',
  'FRONTEND_URL',
  'CORS_ORIGIN',
];

const missing = requiredEnvVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach((key) => console.error(`   - ${key}`));
  process.exit(1);
}

console.log('✅ All required environment variables are set');
console.log('✅ Ready for deployment');

