// backend/routes/users.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

// All routes below this middleware require authentication
router.use(protect);

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);

// Address management
router.get('/addresses', userController.getAddresses);
router.post('/addresses', userController.addAddress);
router.put('/addresses/:id', userController.updateAddress);
router.delete('/addresses/:id', userController.deleteAddress);

// Favorites
router.get('/favorites', userController.getFavorites);
router.post('/favorites/:restaurantId', userController.addToFavorites);
router.delete('/favorites/:restaurantId', userController.removeFromFavorites);

// Order history
router.get('/orders', userController.getUserOrders);
router.get('/orders/:orderId', userController.getOrderDetails);

// Payment methods
router.get('/payment-methods', userController.getPaymentMethods);
router.post('/payment-methods', userController.addPaymentMethod);
router.delete('/payment-methods/:paymentMethodId', userController.removePaymentMethod);

export default router;
