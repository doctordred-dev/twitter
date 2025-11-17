// Тестовий скрипт для перевірки Uploadcare
import { UploadClient } from '@uploadcare/upload-client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Завантажуємо .env
dotenv.config();

const publicKey = process.env.UPLOADCARE_PUBLIC_KEY;
const secretKey = process.env.UPLOADCARE_SECRET_KEY;

console.log('🔧 Uploadcare Configuration Test\n');
console.log('📋 Environment Variables:');
console.log('  UPLOADCARE_PUBLIC_KEY:', publicKey ? `${publicKey.substring(0, 10)}...` : '❌ NOT SET');
console.log('  UPLOADCARE_SECRET_KEY:', secretKey ? `${secretKey.substring(0, 10)}...` : '❌ NOT SET');
console.log('');

if (!publicKey) {
  console.error('❌ UPLOADCARE_PUBLIC_KEY is not set in .env');
  process.exit(1);
}

// Створюємо клієнт
const client = new UploadClient({ publicKey });

// Створюємо тестове зображення (1x1 pixel PNG)
const testImageBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

console.log('📦 Test Image:');
console.log('  Size:', testImageBuffer.length, 'bytes');
console.log('  Type: 1x1 PNG');
console.log('');

async function testUpload() {
  try {
    console.log('🔄 Uploading test image to Uploadcare...\n');

    const result = await client.uploadFile(testImageBuffer, {
      fileName: 'test-image.png',
      contentType: 'image/png',
      store: true, // ВАЖЛИВО: зберігати файл постійно
    });

    console.log('✅ Upload successful!\n');
    console.log('📊 Upload Result:');
    console.log('  UUID:', result.uuid);
    console.log('  CDN URL:', result.cdnUrl);
    console.log('  Original URL:', result.originalUrl);
    console.log('  File ID:', result.fileId);
    console.log('');

    // Перевіряємо доступність файлу
    const cdnUrl = result.cdnUrl || `https://ucarecdn.com/${result.uuid}/`;
    console.log('🔍 Verifying file accessibility...');
    console.log('  Testing URL:', cdnUrl);

    const response = await fetch(cdnUrl, { method: 'HEAD' });
    console.log('  HTTP Status:', response.status, response.statusText);
    console.log('  Content-Type:', response.headers.get('content-type'));
    console.log('  Content-Length:', response.headers.get('content-length'));
    console.log('');

    if (response.ok) {
      console.log('✅ File is accessible!');
      console.log('');
      console.log('🎉 SUCCESS! Uploadcare is working correctly.');
      console.log('');
      console.log('📝 You can view the test image at:');
      console.log('  ', cdnUrl);
    } else {
      console.log('❌ File is not accessible (HTTP', response.status, ')');
      console.log('');
      console.log('⚠️ This might be a temporary issue. Try again in a few seconds.');
    }

  } catch (error) {
    console.error('❌ Upload failed!\n');
    console.error('Error:', error.message);
    console.error('');
    console.error('Full error:', error);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('  1. Check if UPLOADCARE_PUBLIC_KEY is correct');
    console.error('  2. Check your internet connection');
    console.error('  3. Check Uploadcare Dashboard: https://app.uploadcare.com/');
    console.error('  4. Verify your Uploadcare account is active');
    process.exit(1);
  }
}

testUpload();
