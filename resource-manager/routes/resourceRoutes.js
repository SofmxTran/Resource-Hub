const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const resourceController = require('../controllers/resourceController');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  },
});

const upload = multer({ storage });

const router = express.Router();

router.get('/', resourceController.listResources);
router.get('/new', resourceController.renderNewResource);
router.post('/', upload.single('fileUpload'), resourceController.createResource);
router.get('/:id/edit', resourceController.renderEditResource);
router.post(
  '/:id/edit',
  upload.single('fileUpload'),
  resourceController.updateResourceHandler
);
router.post('/:id/delete', resourceController.deleteResourceHandler);
router.post('/:id/favorite', resourceController.toggleFavoriteHandler);

module.exports = router;

