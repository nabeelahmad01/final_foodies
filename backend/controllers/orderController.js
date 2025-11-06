// backend/controllers/orderController.js
import Order from '../models/Order.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import pushNotifications from '../utils/pushNotifications.js';
const { sendPushNotification } = pushNotifications;

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    console.log('📦 Create order request received:', {
      body: req.body,
      userId: req.user.id,
      timestamp: new Date().toISOString()
    });

    const {
      restaurantId,
      items,
      totalAmount,
      deliveryAddress,
      deliveryCoordinates,
      paymentMethod,
    } = req.body;

    // Validate required fields
    if (!restaurantId) {
      return res.status(400).json({
        status: 'error',
        message: 'Restaurant ID is required',
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Order items are required',
      });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid total amount is required',
      });
    }

    if (!deliveryAddress) {
      return res.status(400).json({
        status: 'error',
        message: 'Delivery address is required',
      });
    }

    // Validate payment method
    if (paymentMethod === 'wallet') {
      const user = await User.findById(req.user.id);
      console.log('💰 User wallet balance:', user.wallet.balance, 'Required:', totalAmount);
      
      if (user.wallet.balance < totalAmount) {
        console.log('❌ Insufficient wallet balance');
        return res.status(400).json({
          status: 'error',
          message: 'Insufficient wallet balance',
        });
      }

      console.log('💳 Deducting from wallet...');
      // Deduct from wallet
      await user.updateWallet(totalAmount, 'debit', `Order payment`);
      console.log('✅ Wallet updated successfully');
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
    io.to(`restaurant_${restaurantId}`).emit('newOrder', { 
      restaurantId, 
      orderId: order._id,
      totalAmount: order.totalAmount,
      customerName: req.user.name,
      deliveryAddress: order.deliveryAddress,
      itemsCount: order.items.length,
      playSound: true,
      orderDetails: {
        totalAmount: order.totalAmount,
        items: order.items,
        customerName: req.user.name,
        deliveryAddress: order.deliveryAddress
      }
    });

    // Send notification to restaurant
    const restaurant = await Restaurant.findById(restaurantId).populate('ownerId');
    if (restaurant && restaurant.ownerId) {
      await sendPushNotification(
        restaurant.ownerId._id,
        'New Order! 🎉',
        `Order #${order._id.toString().slice(-6)} received`,
        { type: 'restaurant_order', orderId: order._id },
      );
      console.log('📱 Push notification sent to restaurant:', {
        restaurantId: restaurant._id,
        ownerId: restaurant.ownerId._id,
        message: `Order #${order._id.toString().slice(-6)} received`
      });
    } else {
      console.warn('⚠️ Restaurant or restaurant owner not found for notification');
    }

    // AUTO-NOTIFY RIDERS: Automatically find and notify nearby riders
    try {
      console.log('🚴‍♂️ Auto-notifying nearby riders...');
      
      // Get restaurant location
      const restaurantLocation = restaurant.location?.coordinates;
      if (restaurantLocation) {
        const [restaurantLng, restaurantLat] = restaurantLocation;

        // Find riders within 5km radius who are online
        const nearbyRiders = await User.find({
          role: 'rider',
          isActive: true,
          kycStatus: 'approved',
          'location.coordinates': {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: restaurantLocation
              },
              $maxDistance: 5000 // 5km in meters
            }
          }
        }).limit(15);

        console.log(`🔍 Found ${nearbyRiders.length} nearby riders for order ${order._id}`);

        // Send notifications to nearby riders
        for (const rider of nearbyRiders) {
          // Emit real-time notification
          io.to(`rider_${rider._id}`).emit('newOrderAvailable', {
            orderId: order._id,
            restaurantName: restaurant.name,
            deliveryAddress: order.deliveryAddress,
            totalAmount: order.totalAmount,
            distance: calculateDistance(
              restaurantLat, restaurantLng,
              rider.location?.coordinates?.[1] || 0,
              rider.location?.coordinates?.[0] || 0
            ),
            playSound: true,
            estimatedEarning: Math.round(order.totalAmount * 0.15), // 15% commission
          });

          // Send push notification
          await sendPushNotification(
            rider._id,
            'New Delivery Available! 🚴‍♂️',
            `${restaurant.name} - Rs.${order.totalAmount}`,
            { 
              type: 'rider_order_available', 
              orderId: order._id,
              sound: 'notification_sound.mp3'
            },
          );
        }

        // Update order status to looking for rider
        order.status = 'looking_for_rider';
        await order.save();

        console.log(`✅ Notified ${nearbyRiders.length} nearby riders automatically`);
      } else {
        console.warn('⚠️ Restaurant location not found, cannot notify riders');
      }
    } catch (riderNotificationError) {
      console.error('❌ Failed to auto-notify riders:', riderNotificationError);
      // Don't fail the order creation if rider notification fails
    }

    console.log('✅ Order created successfully:', {
      orderId: order._id,
      userId: order.userId,
      restaurantId: order.restaurantId,
      totalAmount: order.totalAmount,
      itemsCount: order.items.length
    });

    console.log('🔔 Socket event emitted:', {
      event: 'newOrder',
      data: { restaurantId, orderId: order._id }
    });

    res.status(201).json({
      status: 'success',
      order,
    });
  } catch (error) {
    console.error('❌ Create order error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create order',
    });
  }
};

// @desc    Get user's orders
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res) => {
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
export const getOrderById = async (req, res) => {
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
// @desc    Find nearby riders and send order notifications
// @route   POST /api/orders/:id/find-riders
// @access  Private (Restaurant owner)
export const findNearbyRiders = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('restaurantId');
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }

    // Get restaurant location
    const restaurantLocation = order.restaurantId.location.coordinates;
    const [restaurantLng, restaurantLat] = restaurantLocation;

    // Find riders within 4km radius
    const nearbyRiders = await User.find({
      role: 'rider',
      isActive: true,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: restaurantLocation
          },
          $maxDistance: 4000 // 4km in meters
        }
      }
    }).limit(10);

    console.log(`Found ${nearbyRiders.length} nearby riders for order ${order._id}`);

    // Send notifications to nearby riders with sound
    const io = req.app.get('io');
    
    for (const rider of nearbyRiders) {
      // Emit real-time notification with sound
      io.to(`rider_${rider._id}`).emit('newOrderAvailable', {
        orderId: order._id,
        restaurantName: order.restaurantId.name,
        deliveryAddress: order.deliveryAddress,
        totalAmount: order.totalAmount,
        distance: calculateDistance(
          restaurantLat, restaurantLng,
          rider.location?.coordinates?.[1] || 0,
          rider.location?.coordinates?.[0] || 0
        ),
        playSound: true,
        estimatedEarning: Math.round(order.totalAmount * 0.15), // 15% commission
      });

      // Send push notification
      await sendPushNotification(
        rider._id,
        'New Delivery Available! 🚴‍♂️',
        `${order.restaurantId.name} - Rs.${order.totalAmount}`,
        { 
          type: 'rider_order_available', 
          orderId: order._id,
          sound: 'notification_sound.mp3'
        },
      );
    }

    // Update order status to looking for rider
    order.status = 'looking_for_rider';
    await order.save();

    res.json({
      status: 'success',
      message: `Notified ${nearbyRiders.length} nearby riders`,
      ridersNotified: nearbyRiders.length,
    });
  } catch (error) {
    console.error('Find riders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to find nearby riders',
    });
  }
};

// @desc    Assign rider to order
// @route   POST /api/orders/:id/assign-rider
// @access  Private (Rider)
export const assignRider = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('restaurantId userId');
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }

    // Check if order already has a rider
    if (order.riderId) {
      return res.status(400).json({
        status: 'error',
        message: 'Order already assigned to another rider',
      });
    }

    // Assign rider to order
    order.riderId = req.user.id;
    order.status = 'out_for_delivery';
    await order.save();

    const io = req.app.get('io');
    
    // Notify customer about rider assignment
    io.to(`order_${order._id}`).emit('riderAssigned', {
      orderId: order._id,
      riderId: req.user.id,
      riderName: req.user.name,
      riderPhone: req.user.phone,
    });

    // Cancel notifications for other riders
    io.emit('orderTaken', { orderId: order._id });

    // Send notification to customer
    await sendPushNotification(
      order.userId._id,
      'Rider Assigned! 🚴‍♂️',
      `${req.user.name} will deliver your order`,
      { type: 'rider_assigned', orderId: order._id },
    );

    res.json({
      status: 'success',
      message: 'Order assigned successfully',
      order,
    });
  } catch (error) {
    console.error('Assign rider error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to assign rider',
    });
  }
};

// @desc    Update rider location
// @route   PUT /api/orders/:id/rider-location
// @access  Private (Rider)
export const updateRiderLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order || order.riderId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this order',
      });
    }

    // Update rider's current location
    await User.findByIdAndUpdate(req.user.id, {
      'location.coordinates': [longitude, latitude],
      lastLocationUpdate: new Date(),
    });

    // Calculate ETA based on distance and average speed (25 km/h)
    const deliveryDistance = calculateDistance(
      latitude, longitude,
      order.deliveryCoordinates.latitude,
      order.deliveryCoordinates.longitude
    );
    const estimatedTime = Math.round((deliveryDistance / 25) * 60); // minutes

    const io = req.app.get('io');
    
    // Send live location update to customer
    io.to(`order_${order._id}`).emit('riderLocationUpdate', {
      orderId: order._id,
      location: { latitude, longitude },
      estimatedTime,
      distance: deliveryDistance,
    });

    res.json({
      status: 'success',
      message: 'Location updated successfully',
      estimatedTime,
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update location',
    });
  }
};

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// @desc    Track order
// @route   GET /api/orders/:id/track
// @access  Private
export const trackOrder = async (req, res) => {
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
export const cancelOrder = async (req, res) => {
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
export const acceptOrder = async (req, res) => {
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
export const rejectOrder = async (req, res) => {
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
export const updateOrderStatus = async (req, res) => {
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
export const getAvailableOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['preparing', 'looking_for_rider', 'accepted'] },
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
export const acceptDelivery = async (req, res) => {
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
    
    // Notify customer about order update
    io.to(`order_${order._id}`).emit('orderUpdate', {
      orderId: order._id,
      status: 'out_for_delivery',
      rider: req.user,
    });

    // Notify all riders that this order is no longer available
    io.emit('orderTaken', {
      orderId: order._id,
      riderId: req.user.id,
    });

    // Send success notification to the rider who accepted
    io.to(`rider_${req.user.id}`).emit('deliveryAccepted', {
      orderId: order._id,
      message: 'Delivery accepted successfully! 🎉',
      order: {
        _id: order._id,
        restaurantName: order.restaurantId?.name,
        deliveryAddress: order.deliveryAddress,
        totalAmount: order.totalAmount,
      },
    });

    console.log('✅ Delivery accepted by rider:', req.user.id, 'for order:', order._id);

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
export const completeDelivery = async (req, res) => {
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
export const rateOrder = async (req, res) => {
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

// @desc    Get rider's orders/deliveries
// @route   GET /api/orders/rider/:riderId
// @access  Private (Rider)
export const getRiderOrders = async (req, res) => {
  try {
    const { riderId } = req.params;
    const { status, limit = 50, page = 1 } = req.query;
    
    // Verify rider can access this data
    if (req.user.id !== riderId && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this data',
      });
    }

    let query = { riderId };
    
    // Filter by status if provided
    if (status && status !== 'all') {
      if (status === 'completed') {
        query.status = 'delivered';
      } else if (status === 'cancelled') {
        query.status = 'cancelled';
      } else {
        query.status = status;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('userId', 'name phone profileImage')
      .populate('restaurantId', 'name address image')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalOrders = await Order.countDocuments(query);

    res.json({
      status: 'success',
      results: orders.length,
      totalOrders,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalOrders / parseInt(limit)),
      orders,
    });
  } catch (error) {
    console.error('Get rider orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch rider orders',
    });
  }
};
