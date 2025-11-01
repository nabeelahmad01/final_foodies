// backend/routes/admin.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

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
