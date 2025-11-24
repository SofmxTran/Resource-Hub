const express = require('express');
const pageController = require('../controllers/pageController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', pageController.showLanding);
router.get('/dashboard', ensureAuthenticated, pageController.showDashboard);

module.exports = router;

