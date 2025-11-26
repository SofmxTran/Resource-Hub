const express = require('express');
const adminController = require('../controllers/adminController');
const { ensureAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(ensureAdmin);

router.get('/', adminController.renderDashboard);
router.get('/resources', adminController.listResources);
router.post('/resources/:id/approve', adminController.approveResource);
router.post('/resources/:id/reject', adminController.rejectResource);
router.post('/resources/:id/delete', adminController.deleteResource);

module.exports = router;

