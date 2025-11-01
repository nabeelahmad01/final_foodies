// backend/routes/auth.js
import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

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
      .isIn(['user', 'customer', 'restaurant', 'rider'])
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
  (req, res, next) => {
    upload.single('document')(req, res, function (err) {
      if (err) {
        return res.status(400).json({
          status: 'error',
          message: err.message || 'Error uploading file',
        });
      }
      next();
    });
  },
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

export default router;
