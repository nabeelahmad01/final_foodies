// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Register
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .isIn(['customer', 'restaurant', 'rider'])
      .withMessage('Invalid role'),
  ],
  authController.register,
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  authController.login,
);

// Get current user
router.get('/me', protect, authController.getMe);

// Update profile
router.put('/update-profile', protect, authController.updateProfile);

// Upload KYC documents
router.post(
  '/upload-kyc',
  protect,
  upload.array('documents', 5),
  authController.uploadKYC,
);

// Change password
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  authController.changePassword,
);

// Forgot password (send reset email)
router.post(
  '/forgot-password',
  [body('email').isEmail()],
  authController.forgotPassword,
);

// Reset password
router.put(
  '/reset-password/:resetToken',
  [body('password').isLength({ min: 6 })],
  authController.resetPassword,
);

module.exports = router;
