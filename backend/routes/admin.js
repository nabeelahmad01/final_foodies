// backend/routes/admin.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import * as adminController from '../controllers/adminController.js';
import User from '../models/User.js';

const router = express.Router();

// Temporary route for development - remove in production
router.put('/temp-approve-kyc', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { email: 'admin786@gmail.com' },
      { 
        kycStatus: 'approved',
        role: 'restaurant'
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'KYC approved successfully',
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        kycStatus: user.kycStatus
      }
    });
  } catch (error) {
    console.error('Error approving KYC:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// All routes require admin access
router.use(protect, authorize('admin'));

// KYC Management
router.get('/kyc-pending', adminController.getPendingKYC);
router.put('/kyc-approve/:userId', adminController.approveKYC);
router.put('/kyc-reject/:userId', adminController.rejectKYC);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/status', adminController.updateUserStatus);

// Restaurant Management
router.get('/restaurants', adminController.getAllRestaurants);
router.put('/restaurants/:id/status', adminController.updateRestaurantStatus);

// Order Management
router.get('/orders', adminController.getAllOrders);
router.get('/orders/stats', adminController.getOrderStats);

// Analytics
router.get('/dashboard', adminController.getDashboardStats);
router.get('/revenue', adminController.getRevenueStats);

export default router;
