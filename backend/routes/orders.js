// backend/routes/orders.js
import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

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

// Rider assignment routes
router.post(
  '/:id/find-riders',
  protect,
  authorize('restaurant'),
  orderController.findNearbyRiders,
);
router.post(
  '/:id/assign-rider',
  protect,
  authorize('rider'),
  orderController.assignRider,
);
router.put(
  '/:id/rider-location',
  protect,
  authorize('rider'),
  orderController.updateRiderLocation,
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

// Get rider's orders/deliveries
router.get(
  '/rider/:riderId',
  protect,
  authorize('rider'),
  orderController.getRiderOrders,
);

export default router;
