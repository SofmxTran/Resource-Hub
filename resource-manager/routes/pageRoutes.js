const express = require('express');
const pageController = require('../controllers/pageController');
const userController = require('../controllers/userController');
const leaderboardController = require('../controllers/leaderboardController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', pageController.showHome);
router.get('/dashboard', ensureAuthenticated, pageController.showDashboard);
router.get('/profile', ensureAuthenticated, userController.showProfile);
router.get('/u/:username', userController.showPublicProfile);
router.get('/leaderboard', leaderboardController.showLeaderboard);

module.exports = router;

