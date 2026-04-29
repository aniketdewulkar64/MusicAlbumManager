const express = require('express');
const router = express.Router();
const {
  register, login, refreshToken, logout,
  forgotPassword, resetPassword, verifyEmail, getMe,
} = require('../controller/authController');
const { protect } = require('../middleware/auth');
const { imageUpload } = require('../config/cloudinary');
const rateLimit = require('express-rate-limit');

// Strict limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increased for dev
  message: { status: 'fail', message: 'Too many requests, please try again after 15 minutes' },
});

router.post('/register', authLimiter, imageUpload.single('avatar'), register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.get('/me', protect, getMe);

module.exports = router;
