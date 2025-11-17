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
      store: true, // true = негайне збереження
    });

    console.log('✅ Upload successful!\n');
    console.log('📊 Upload Result:');
    console.log('  UUID:', result.uuid);
    console.log('');

    // Дочекаємося поки файл буде stored
    console.log('⏳ Waiting for file to be stored...');
    let fileInfo;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`https://api.uploadcare.com/files/${result.uuid}/`, {
          headers: {
            'Authorization': `Uploadcare.Simple ${publicKey}:${secretKey}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          fileInfo = await response.json();
          console.log(`  Attempt ${attempts + 1}: File status - ${fileInfo.status || 'unknown'}`);
          
          if (fileInfo.status === 'stored' || fileInfo.is_stored) {
            console.log('✅ File is stored!');
            break;
          }
        }
      } catch (error) {
        console.warn(`  Attempt ${attempts + 1}: Failed to get file info -`, error.message);
      }

      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Використовуємо cdnUrl з відповіді
    const cdnUrl = result.cdnUrl || `https://ucarecdn.com/${result.uuid}/`;
    console.log('');
    console.log('🔗 CDN URL:', cdnUrl);
    console.log('');

    // Фінальна перевірка доступності
    console.log('🔍 Verifying file accessibility...');
    const testResponse = await fetch(cdnUrl, { method: 'HEAD' });
    console.log('  HTTP Status:', testResponse.status, testResponse.statusText);

    if (testResponse.ok) {
      console.log('');
      console.log('✅ File is accessible!');
      console.log('');
      console.log('🎉 SUCCESS! Uploadcare is working correctly.');
      console.log('');
      console.log('📝 You can view the test image at:');
      console.log('  ', cdnUrl);
    } else {
      console.log('');
      console.log('⚠️ File uploaded but HTTP', testResponse.status);
      console.log('');
      console.log('Check Uploadcare Dashboard: https://app.uploadcare.com/');
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
