const express = require('express');
const multer = require('multer');
const resourceController = require('../controllers/resourceController');
const {
  ensureAuthenticated,
} = require('../middleware/authMiddleware');

// Use memory storage - files will be uploaded to Cloudinary directly from memory
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for resource files
  },
});
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

