// backend/controllers/orderController.js
const Order = require('../models/Order');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
// In orderController.js - When order is placed
const { sendPushNotification } = require('../utils/pushNotifications');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const {
      restaurantId,
      items,
      totalAmount,
      deliveryAddress,
      deliveryCoordinates,
      paymentMethod,
    } = req.body;

    // Validate payment method
    if (paymentMethod === 'wallet') {
      const user = await User.findById(req.user.id);
      if (user.wallet.balance < totalAmount) {
        return res.status(400).json({
          status: 'error',
          message: 'Insufficient wallet balance',
        });
      }

      // Deduct from wallet
      await user.updateWallet(totalAmount, 'debit', `Order payment`);
    }

    // Calculate estimated delivery time
    const estimatedDeliveryTime = new Date();
    estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 40);

    // Create order
    const order = await Order.create({
      userId: req.user.id,
      restaurantId,
      items,
      totalAmount,
      deliveryAddress,
      deliveryCoordinates,
      paymentMethod,
      paymentStatus: paymentMethod === 'wallet' ? 'completed' : 'pending',
      estimatedDeliveryTime,
    });

    // Populate order details
    await order.populate('restaurantId', 'name');

    // Emit socket event to restaurant
    const io = req.app.get('io');
    io.emit('newOrder', { restaurantId, orderId: order._id });

    res.status(201).json({
      status: 'success',
      order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create order',
    });
  }
  // Send notification to restaurant
  const restaurant = await Restaurant.findById(restaurantId).populate(
    'ownerId',
  );
  await sendPushNotification(
    restaurant.ownerId._id,
    'New Order! 🎉',
    `Order #${order._id.slice(-6)} received`,
    { type: 'restaurant_order', orderId: order._id },
  );
};
// When order status changes
await sendPushNotification(
  order.userId,
  'Order Update',
  `Your order is now ${order.status}`,
  { type: 'order', orderId: order._id }
);
// @desc    Get user's orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('restaurantId', 'name images')
      .populate('riderId', 'name phone')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      orders,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders',
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurantId', 'name address phone images')
      .populate('riderId', 'name phone')
      .populate('userId', 'name phone');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }

    // Check authorization
    if (
      order.userId._id.toString() !== req.user.id &&
      order.restaurantId?.ownerId?.toString() !== req.user.id &&
      order.riderId?._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this order',
      });
    }

    res.json({
      status: 'success',
      order,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order',
    });
  }
};

// @desc    Track order
// @route   GET /api/orders/:id/track
// @access  Private
exports.trackOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurantId', 'name location')
      .populate('riderId', 'name phone');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }

    res.json({
      status: 'success',
      order,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to track order',
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }

    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized',
      });
    }

    if (!['pending', 'accepted'].includes(order.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Order cannot be cancelled at this stage',
      });
    }

    order.status = 'cancelled';
    order.cancellationReason = req.body.reason || 'Cancelled by customer';
    await order.save();

    // Refund if paid via wallet
    if (
      order.paymentMethod === 'wallet' &&
      order.paymentStatus === 'completed'
    ) {
      const user = await User.findById(order.userId);
      await user.updateWallet(
        order.totalAmount,
        'credit',
        'Order cancellation refund',
      );
    }

    const io = req.app.get('io');
    io.to(`order_${order._id}`).emit('orderUpdate', {
      orderId: order._id,
      status: 'cancelled',
    });

    res.json({
      status: 'success',
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel order',
    });
  }
};

// @desc    Accept order (restaurant)
// @route   PUT /api/orders/:id/accept
// @access  Private (Restaurant)
exports.acceptOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }

    order.status = 'accepted';
    await order.save();

    const io = req.app.get('io');
    await order.updateStatus('accepted', io);

    res.json({
      status: 'success',
      message: 'Order accepted',
      order,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to accept order',
    });
  }
};

// @desc    Reject order (restaurant)
// @route   PUT /api/orders/:id/reject
// @access  Private (Restaurant)
exports.rejectOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }

    order.status = 'cancelled';
    order.cancellationReason = req.body.reason || 'Rejected by restaurant';
    await order.save();

    const io = req.app.get('io');
    io.to(`order_${order._id}`).emit('orderUpdate', {
      orderId: order._id,
      status: 'cancelled',
    });

    res.json({
      status: 'success',
      message: 'Order rejected',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject order',
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Restaurant/Rider)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }

    const io = req.app.get('io');
    await order.updateStatus(status, io);

    res.json({
      status: 'success',
      message: 'Order status updated',
      order,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update order status',
    });
  }
};

// @desc    Get available orders for riders
// @route   GET /api/orders/rider/available
// @access  Private (Rider)
exports.getAvailableOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: 'preparing',
      riderId: null,
    })
      .populate('restaurantId', 'name address location')
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      orders,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch available orders',
    });
  }
};

// @desc    Accept delivery
// @route   PUT /api/orders/:id/accept-delivery
// @access  Private (Rider)
exports.acceptDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }

    order.riderId = req.user.id;
    order.status = 'out_for_delivery';
    await order.save();

    const io = req.app.get('io');
    io.to(`order_${order._id}`).emit('orderUpdate', {
      orderId: order._id,
      status: 'out_for_delivery',
      rider: req.user,
    });

    res.json({
      status: 'success',
      message: 'Delivery accepted',
      order,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to accept delivery',
    });
  }
};

// @desc    Complete delivery
// @route   PUT /api/orders/:id/complete-delivery
// @access  Private (Rider)
exports.completeDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }

    const io = req.app.get('io');
    await order.updateStatus('delivered', io);

    res.json({
      status: 'success',
      message: 'Delivery completed',
      order,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to complete delivery',
    });
  }
};

// @desc    Rate order
// @route   POST /api/orders/:id/rate
// @access  Private
exports.rateOrder = async (req, res) => {
  try {
    const { foodRating, deliveryRating, comment } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }

    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized',
      });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({
        status: 'error',
        message: 'Can only rate delivered orders',
      });
    }

    order.rating = {
      food: foodRating,
      delivery: deliveryRating,
      comment,
      createdAt: new Date(),
    };
    await order.save();

    // Update restaurant rating
    const restaurant = await Restaurant.findById(order.restaurantId);
    await restaurant.calculateRating();

    res.json({
      status: 'success',
      message: 'Rating submitted successfully',
      order,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit rating',
    });
  }
};
