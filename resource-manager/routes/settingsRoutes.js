const express = require('express');
const multer = require('multer');
const settingsController = require('../controllers/settingsController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

// Use memory storage - files will be uploaded to Cloudinary directly from memory
const avatarStorage = multer.memoryStorage();

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed.'));
    }
  },
});

router.get('/profile', ensureAuthenticated, settingsController.renderProfileSettings);
router.post(
  '/profile',
  ensureAuthenticated,
  avatarUpload.single('avatar'),
  settingsController.updateProfileSettings
);

module.exports = router;

