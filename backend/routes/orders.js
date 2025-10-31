// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// Customer routes
router.post('/', protect, orderController.createOrder);
router.get('/my-orders', protect, orderController.getMyOrders);
router.get('/:id', protect, orderController.getOrderById);
router.get('/:id/track', protect, orderController.trackOrder);
router.put('/:id/cancel', protect, orderController.cancelOrder);
router.post('/:id/rate', protect, orderController.rateOrder);

// Restaurant routes
router.put(
  '/:id/accept',
  protect,
  authorize('restaurant'),
  orderController.acceptOrder,
);
router.put(
  '/:id/reject',
  protect,
  authorize('restaurant'),
  orderController.rejectOrder,
);
router.put(
  '/:id/status',
  protect,
  authorize('restaurant', 'rider'),
  orderController.updateOrderStatus,
);

// Rider routes
router.get(
  '/rider/available',
  protect,
  authorize('rider'),
  orderController.getAvailableOrders,
);
router.put(
  '/:id/accept-delivery',
  protect,
  authorize('rider'),
  orderController.acceptDelivery,
);
router.put(
  '/:id/complete-delivery',
  protect,
  authorize('rider'),
  orderController.completeDelivery,
);

module.exports = router;
