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
    console.log('🔄 Starting file upload to Uploadcare...');
    console.log('📁 Filename:', filename);
    console.log('🔑 Public Key:', publicKey?.substring(0, 10) + '...');
    console.log('📦 File size:', Buffer.isBuffer(file) ? `${file.length} bytes` : 'unknown');

    const result = await client.uploadFile(file, {
      fileName: filename,
      contentType: 'auto',
      store: true, // ВАЖЛИВО: зберігати файл в Uploadcare (не тимчасово)
    });

    console.log('✅ File uploaded successfully!');
    console.log('🆔 UUID:', result.uuid);
    console.log('🔗 CDN URL:', result.cdnUrl);

    // Verify file is accessible
    const cdnUrl = result.cdnUrl || `https://ucarecdn.com/${result.uuid}/`;
    console.log('🔍 Verifying file accessibility...');
    
    try {
      const testResponse = await fetch(cdnUrl, { method: 'HEAD' });
      console.log('✅ File verification status:', testResponse.status);
      
      if (!testResponse.ok) {
        console.warn('⚠️ File not immediately accessible, but this is normal. CDN propagation may take a few seconds.');
      }
    } catch (verifyError) {
      console.warn('⚠️ Could not verify file immediately:', verifyError);
    }

    return cdnUrl;
  } catch (error) {
    console.error('❌ Uploadcare upload failed:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw new Error(`Failed to upload file to Uploadcare: ${(error as Error).message}`);
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
