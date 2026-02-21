const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const validationErrorHandler = require('../middleware/validation');
const authController = require('../controllers/authController');

const router = express.Router();
const passport = require('passport');
const { generateToken } = require('../utils/jwt');

// Google OAuth Routes
router.get('/google', (req, res, next) => {
  // include prompt to allow account selection and force consent when needed
  passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (err) {
      console.error('Google OAuth error:', err);
      const redirectUrl = `${frontendBase}/login?error=${encodeURIComponent(err.message || 'oauth_error')}`;
      return res.redirect(redirectUrl);
    }

    if (!user) {
      const infoMsg = (info && info.message) || 'No user returned from Google';
      console.warn('Google OAuth no-user:', infoMsg);
      const redirectUrl = `${frontendBase}/login?error=${encodeURIComponent(infoMsg)}`;
      return res.redirect(redirectUrl);
    }

    try {
      const token = generateToken(user._id, user.email, user.role);
      const redirectUrl = `${frontendBase}/auth/google/callback?token=${token}`;
      return res.redirect(redirectUrl);
    } catch (genErr) {
      console.error('Token generation error:', genErr);
      const redirectUrl = `${frontendBase}/login?error=${encodeURIComponent('token_generation_failed')}`;
      return res.redirect(redirectUrl);
    }
  })(req, res, next);
});

/**
 * Register Route
 * POST /api/auth/register
 * Creates a new user account
 */
router.post(
  '/register',
  [
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters long'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  validationErrorHandler,
  authController.register
);

/**
 * Login Route
 * POST /api/auth/login
 * Authenticates user and returns JWT token
 */
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  validationErrorHandler,
  authController.login
);

/**
 * Get Profile Route (Protected)
 * GET /api/auth/profile
 * Returns authenticated user's profile information
 */
router.get('/profile', authMiddleware, authController.getProfile);

/**
 * Update Profile Route (Protected)
 * PUT /api/auth/profile
 * Allows user to update their name
 */
router.put(
  '/profile',
  authMiddleware,
  [
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters long'),
  ],
  validationErrorHandler,
  authController.updateProfile
);

/**
 * Change Password Route (Protected)
 * POST /api/auth/change-password
 * Allows user to change their password
 */
router.post(
  '/change-password',
  authMiddleware,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
  ],
  validationErrorHandler,
  authController.changePassword
);

module.exports = router;
