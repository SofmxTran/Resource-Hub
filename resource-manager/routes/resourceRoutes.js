const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const resourceController = require('../controllers/resourceController');
const {
  ensureAuthenticated,
} = require('../middleware/authMiddleware');

const uploadDir = process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads');
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
const uploadFields = upload.fields([
  { name: 'fileUpload', maxCount: 1 },
  { name: 'imageUpload', maxCount: 1 },
]);

const router = express.Router();

router.get('/', ensureAuthenticated, resourceController.listResources);
router.get('/new', ensureAuthenticated, resourceController.renderNewResource);
router.post(
  '/',
  ensureAuthenticated,
  uploadFields,
  resourceController.createResource
);
router.get(
  '/:id/edit',
  ensureAuthenticated,
  resourceController.renderEditResource
);
router.post(
  '/:id/edit',
  ensureAuthenticated,
  uploadFields,
  resourceController.updateResourceHandler
);
router.post(
  '/:id/delete',
  ensureAuthenticated,
  resourceController.deleteResourceHandler
);
router.post(
  '/:id/favorite',
  ensureAuthenticated,
  resourceController.toggleFavoriteHandler
);
router.post(
  '/:id/comments',
  ensureAuthenticated,
  resourceController.addComment
);
router.post(
  '/:id/comments/:commentId/delete',
  ensureAuthenticated,
  resourceController.deleteComment
);
router.post(
  '/:id/vote',
  ensureAuthenticated,
  resourceController.submitTrustVote
);
router.get('/:id', resourceController.showResourceDetail);

module.exports = router;

