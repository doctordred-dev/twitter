import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendVerificationEmail(email: string, token: string, username: string) {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;
  
  const html = readFileSync(join(process.cwd(), 'email_templates', 'verify.html'), 'utf8')
    .replace('{{username}}', username)
    .replace('{{verifyUrl}}', verifyUrl);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Подтвердите ваш email - Twitter Clone',
    html,
  });
}

export async function sendResetEmail(email: string, token: string, username: string) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset?token=${token}`;
  
  const html = readFileSync(join(process.cwd(), 'email_templates', 'reset.html'), 'utf8')
    .replace('{{username}}', username)
    .replace('{{resetUrl}}', resetUrl);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Восстановление пароля - Twitter Clone',
    html,
  });
}
