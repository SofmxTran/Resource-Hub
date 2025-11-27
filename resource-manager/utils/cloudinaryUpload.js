const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Cloudinary folder path (e.g., 'resources', 'avatars')
 * @param {string} resourceType - 'auto', 'image', 'raw', 'video' (default: 'auto')
 * @returns {Promise<{url: string, publicId: string}>}
 */
async function uploadToCloudinary(buffer, folder, resourceType = 'auto') {
  return new Promise((resolve, reject) => {
    console.log(`[Cloudinary] Starting upload to folder: ${folder}, type: ${resourceType}`);
    console.log(`[Cloudinary] Buffer size: ${buffer ? buffer.length : 0} bytes`);
    
    if (!buffer || buffer.length === 0) {
      const error = new Error('Buffer is empty or invalid');
      console.error('[Cloudinary]', error.message);
      reject(error);
      return;
    }

    if (!Buffer.isBuffer(buffer)) {
      const error = new Error('Buffer is not a valid Buffer object');
      console.error('[Cloudinary]', error.message);
      reject(error);
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload error:', error);
          console.error('[Cloudinary] Error details:', {
            message: error.message,
            http_code: error.http_code,
            name: error.name,
            error: error.error,
          });
          reject(error);
        } else {
          console.log(`[Cloudinary] ✅ Upload successful!`);
          console.log(`[Cloudinary] URL: ${result.secure_url}`);
          console.log(`[Cloudinary] Public ID: ${result.public_id}`);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );

    // Convert buffer to stream
    try {
      const stream = Readable.from(buffer);
      stream.on('error', (err) => {
        console.error('[Cloudinary] Stream error:', err);
        reject(err);
      });
      stream.pipe(uploadStream);
    } catch (streamError) {
      console.error('[Cloudinary] Failed to create stream:', streamError);
      reject(streamError);
    }
  });
}

/**
 * Delete a file from Cloudinary using its public ID or URL
 * @param {string} publicIdOrUrl - Cloudinary public ID or full URL
 * @param {string} resourceType - 'image', 'raw', 'video' (default: 'auto')
 * @returns {Promise<void>}
 */
async function deleteFromCloudinary(publicIdOrUrl, resourceType = 'auto') {
  try {
    // Extract public ID from URL if a full URL is provided
    let publicId = publicIdOrUrl;
    if (publicIdOrUrl.includes('cloudinary.com')) {
      // Extract public ID from Cloudinary URL
      // Format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{public_id}
      const urlParts = publicIdOrUrl.split('/');
      const uploadIndex = urlParts.findIndex((part) => part === 'upload');
      if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
        // Get everything after 'upload' and before the file extension
        const afterUpload = urlParts.slice(uploadIndex + 1).join('/');
        publicId = afterUpload.replace(/\.[^/.]+$/, ''); // Remove file extension
      } else {
        console.warn('Could not extract public ID from URL:', publicIdOrUrl);
        return; // Skip deletion if we can't extract public ID
      }
    }

    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    // Don't throw - file might already be deleted or not exist
  }
}

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
};

