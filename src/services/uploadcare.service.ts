import { UploadClient } from '@uploadcare/upload-client';

const publicKey = process.env.UPLOADCARE_PUBLIC_KEY;
const secretKey = process.env.UPLOADCARE_SECRET_KEY;

if (!publicKey || !secretKey) {
  console.warn('⚠️ Uploadcare keys not configured. File uploads will use local storage.');
}

const client = publicKey ? new UploadClient({ publicKey }) : null;

/**
 * Upload file to Uploadcare
 * @param file - File buffer or path
 * @param filename - Original filename
 * @returns Uploadcare CDN URL
 */
export async function uploadToUploadcare(file: Buffer | string, filename: string): Promise<string> {
  if (!client) {
    throw new Error('Uploadcare is not configured');
  }

  try {
    const result = await client.uploadFile(file, {
      fileName: filename,
      contentType: 'auto',
    });

    // Return CDN URL
    return `https://ucarecdn.com/${result.uuid}/`;
  } catch (error) {
    console.error('Uploadcare upload error:', error);
    throw new Error('Failed to upload file to Uploadcare');
  }
}

/**
 * Delete file from Uploadcare
 * @param fileId - Uploadcare file UUID
 */
export async function deleteFromUploadcare(fileId: string): Promise<void> {
  if (!client) {
    throw new Error('Uploadcare is not configured');
  }

  try {
    // Note: File deletion requires REST API, not available in upload-client
    // You'll need to use fetch or axios to call the REST API
    const response = await fetch(`https://api.uploadcare.com/files/${fileId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Uploadcare.Simple ${publicKey}:${secretKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Uploadcare delete error:', error);
    throw new Error('Failed to delete file from Uploadcare');
  }
}

/**
 * Get file info from Uploadcare
 * @param fileId - Uploadcare file UUID
 */
export async function getFileInfo(fileId: string): Promise<any> {
  if (!client) {
    throw new Error('Uploadcare is not configured');
  }

  try {
    const response = await fetch(`https://api.uploadcare.com/files/${fileId}/`, {
      headers: {
        'Authorization': `Uploadcare.Simple ${publicKey}:${secretKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get file info: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Uploadcare get file info error:', error);
    throw new Error('Failed to get file info from Uploadcare');
  }
}
