// Тест через REST API Uploadcare
import dotenv from 'dotenv';
import FormData from 'form-data';

dotenv.config();

const publicKey = process.env.UPLOADCARE_PUBLIC_KEY;

console.log('🔧 Uploadcare REST API Test\n');
console.log('🔑 Public Key:', publicKey?.substring(0, 10) + '...\n');

// Тестове зображення (1x1 PNG)
const testImageBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

async function testRestUpload() {
  try {
    console.log('🔄 Uploading via REST API...\n');

    const formData = new FormData();
    formData.append('UPLOADCARE_PUB_KEY', publicKey);
    formData.append('UPLOADCARE_STORE', '1'); // Зберігати файл
    formData.append('file', testImageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    const response = await fetch('https://upload.uploadcare.com/base/', {
      method: 'POST',
      body: formData
    });

    const responseText = await response.text();
    console.log('📊 Raw Response:', responseText);
    console.log('');

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse JSON response');
      console.error('Response was:', responseText);
      return;
    }

    console.log('📊 Response Status:', response.status, response.statusText);
    console.log('📊 Response Body:', JSON.stringify(result, null, 2));
    console.log('');

    if (result.file) {
      const cdnUrl = `https://ucarecdn.com/${result.file}/`;
      console.log('✅ Upload successful!');
      console.log('🔗 CDN URL:', cdnUrl);
      console.log('');

      // Перевіряємо доступність
      console.log('🔍 Verifying file...');
      const verifyResponse = await fetch(cdnUrl, { method: 'HEAD' });
      console.log('  HTTP Status:', verifyResponse.status, verifyResponse.statusText);
      
      if (verifyResponse.ok) {
        console.log('');
        console.log('🎉 SUCCESS! File is accessible!');
        console.log('📝 View at:', cdnUrl);
      } else {
        console.log('');
        console.log('⚠️ File not accessible yet. Wait a few seconds and try:', cdnUrl);
      }
    } else if (result.error) {
      console.error('❌ Upload failed!');
      console.error('Error:', result.error);
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testRestUpload();
