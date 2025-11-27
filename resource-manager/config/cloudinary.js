const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
// Cloudinary SDK automatically reads CLOUDINARY_URL if it's set
// But we can also configure manually if individual variables are provided
if (process.env.CLOUDINARY_URL) {
  // If CLOUDINARY_URL is provided, Cloudinary will read it automatically
  // We just need to ensure secure is enabled
  cloudinary.config({
    secure: true,
  });
  
  // Verify configuration
  const config = cloudinary.config();
  console.log('✅ Cloudinary configured using CLOUDINARY_URL');
  console.log('   Cloud name:', config.cloud_name);
  console.log('   API key:', config.api_key ? `${config.api_key.substring(0, 4)}...` : 'Not set');
  console.log('   Secure:', config.secure);
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  // Otherwise, use individual environment variables
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log('✅ Cloudinary configured using individual variables');
  console.log('   Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
} else {
  console.warn('⚠️  Cloudinary not configured. Please set CLOUDINARY_URL or individual credentials.');
  console.warn('   CLOUDINARY_URL:', process.env.CLOUDINARY_URL ? 'Set' : 'Not set');
  console.warn('   CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set');
}

module.exports = cloudinary;

