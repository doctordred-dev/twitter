import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn('⚠️ Cloudinary credentials not configured. File uploads will use local storage.');
} else {
  // Конфігуруємо Cloudinary
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  console.log('✅ Cloudinary configured:', cloudName);
}

/**
 * Upload file to Cloudinary
 * @param file - File buffer
 * @param filename - Original filename
 * @returns Cloudinary URL
 */
export async function uploadToCloudinary(file: Buffer, filename: string): Promise<string> {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured');
  }

  try {
    console.log('🔄 Starting file upload to Cloudinary...');
    console.log('📁 Filename:', filename);
    console.log('☁️ Cloud Name:', cloudName);
    console.log('📦 File size:', file.length, 'bytes');

    // Завантажуємо файл через upload stream
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'twitter', // Папка в Cloudinary
          public_id: `${Date.now()}-${filename.replace(/\.[^/.]+$/, '')}`, // Унікальне ім'я
          resource_type: 'auto', // Автоматичне визначення типу
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Пишемо buffer в stream
      uploadStream.end(file);
    });

    console.log('✅ File uploaded successfully!');
    console.log('🆔 Public ID:', result.public_id);
    console.log('🔗 URL:', result.secure_url);
    console.log('📊 Size:', result.bytes, 'bytes');
    console.log('📐 Dimensions:', result.width, 'x', result.height);

    // Повертаємо secure URL (https)
    return result.secure_url;
  } catch (error) {
    console.error('❌ Cloudinary upload failed:', error);
    throw new Error(`Failed to upload file to Cloudinary: ${(error as Error).message}`);
  }
}

/**
 * Delete file from Cloudinary
 * @param publicId - Cloudinary public ID
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured');
  }

  try {
    console.log('🗑️ Deleting file from Cloudinary:', publicId);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('✅ File deleted:', result);
  } catch (error) {
    console.error('❌ Cloudinary delete failed:', error);
    throw new Error(`Failed to delete file from Cloudinary: ${(error as Error).message}`);
  }
}

/**
 * Generate optimized URL with transformations
 * @param url - Original Cloudinary URL
 * @param options - Transformation options
 */
export function getOptimizedUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
): string {
  // Якщо це не Cloudinary URL - повертаємо як є
  if (!url.includes('cloudinary.com')) {
    return url;
  }

  const { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = options;

  // Будуємо трансформації
  const transformations: string[] = [];

  if (width || height) {
    const size = [width && `w_${width}`, height && `h_${height}`].filter(Boolean).join(',');
    transformations.push(size);
  }

  if (crop) {
    transformations.push(`c_${crop}`);
  }

  if (quality) {
    transformations.push(`q_${quality}`);
  }

  if (format) {
    transformations.push(`f_${format}`);
  }

  // Вставляємо трансформації в URL
  const transformation = transformations.join(',');
  return url.replace('/upload/', `/upload/${transformation}/`);
}
