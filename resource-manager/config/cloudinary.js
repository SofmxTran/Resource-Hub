const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
  // If CLOUDINARY_URL is provided, use it (includes all config)
  cloudinary.config({
    secure: true,
  });
} else {
  // Otherwise, use individual environment variables
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

module.exports = cloudinary;

