// backend/routes/restaurants.js
const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const { protect, authorize } = require('../middleware/auth');

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
  restaurantController.addMenuItem,
);
router.put(
  '/:id/menu/:itemId',
  protect,
  authorize('restaurant'),
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

module.exports = router;
