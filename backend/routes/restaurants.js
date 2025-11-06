// backend/routes/restaurants.js
import express from 'express';
import * as restaurantController from '../controllers/restaurantController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', restaurantController.getRestaurants);
router.get('/search', restaurantController.searchRestaurants);
router.get('/:id', restaurantController.getRestaurantById);
router.get('/:id/menu', restaurantController.getRestaurantMenu);

// Protected routes - Restaurant owner only
router.post(
  '/',
  protect,
  authorize('restaurant'),
  restaurantController.createRestaurant,
);
router.put(
  '/:id',
  protect,
  authorize('restaurant'),
  restaurantController.updateRestaurant,
);
router.delete(
  '/:id',
  protect,
  authorize('restaurant'),
  restaurantController.deleteRestaurant,
);

// Menu management
router.post(
  '/:id/menu',
  protect,
  authorize('restaurant'),
  upload.single('image'), // Add multer middleware for file upload
  restaurantController.addMenuItem,
);
router.put(
  '/:id/menu/:itemId',
  protect,
  authorize('restaurant'),
  upload.single('image'), // Add multer middleware for file upload
  restaurantController.updateMenuItem,
);
router.delete(
  '/:id/menu/:itemId',
  protect,
  authorize('restaurant'),
  restaurantController.deleteMenuItem,
);

// Restaurant dashboard
router.get(
  '/:id/dashboard',
  protect,
  authorize('restaurant'),
  restaurantController.getDashboard,
);
router.get(
  '/:id/orders',
  protect,
  authorize('restaurant'),
  restaurantController.getRestaurantOrders,
);

// Reviews
router.post(
  '/:id/reviews',
  protect,
  restaurantController.addRestaurantReview,
);
router.get(
  '/:id/reviews',
  restaurantController.getRestaurantReviews,
);

export default router;
