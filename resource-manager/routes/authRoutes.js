const express = require('express');
const authController = require('../controllers/authController');
const { redirectIfAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/register', redirectIfAuthenticated, authController.renderRegister);
router.post('/register', authController.register);

router.get('/login', redirectIfAuthenticated, authController.renderLogin);
router.post('/login', authController.login);

router.post('/logout', authController.logout);

module.exports = router;

