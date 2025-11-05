// backend/controllers/riderController.js
import User from '../models/User.js';
import Order from '../models/Order.js';

// @desc    Get rider dashboard stats
// @route   GET /api/riders/dashboard
// @access  Private (Rider)
export const getDashboard = async (req, res) => {
  try {
    const riderId = req.user.id;
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get rider stats
    const [todayOrders, totalOrders, activeOrders] = await Promise.all([
      // Today's completed deliveries
      Order.countDocuments({
        riderId,
        status: 'delivered',
        createdAt: { $gte: today, $lt: tomorrow }
      }),
      
      // Total completed deliveries
      Order.countDocuments({
        riderId,
        status: 'delivered'
      }),
      
      // Active orders (assigned but not delivered)
      Order.countDocuments({
        riderId,
        status: { $in: ['assigned', 'picked_up', 'on_the_way'] }
      })
    ]);
    
    // Calculate earnings (assuming delivery fee is stored in orders)
    const todayEarnings = await Order.aggregate([
      {
        $match: {
          riderId: req.user._id,
          status: 'delivered',
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$deliveryFee' }
        }
      }
    ]);
    
    const totalEarnings = await Order.aggregate([
      {
        $match: {
          riderId: req.user._id,
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$deliveryFee' }
        }
      }
    ]);
    
    res.json({
      status: 'success',
      stats: {
        todayDeliveries: todayOrders,
        totalDeliveries: totalOrders,
        activeOrders,
        todayEarnings: todayEarnings[0]?.total || 0,
        totalEarnings: totalEarnings[0]?.total || 0,
        isOnline: req.user.isOnline || false
      }
    });
    
  } catch (error) {
    console.error('Get rider dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard stats',
    });
  }
};

// @desc    Update rider online status
// @route   PUT /api/riders/status
// @access  Private (Rider)
export const updateOnlineStatus = async (req, res) => {
  try {
    const { isOnline, location } = req.body;
    const riderId = req.user.id;
    
    // Check if rider KYC is approved
    if (isOnline && req.user.kycStatus !== 'approved') {
      return res.status(400).json({
        status: 'error',
        message: 'KYC must be approved before going online'
      });
    }
    
    const updateData = { isOnline };
    
    // Update location if provided
    if (location && location.latitude && location.longitude) {
      updateData.location = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      };
    }
    
    const rider = await User.findByIdAndUpdate(
      riderId,
      updateData,
      { new: true }
    ).select('-password');
    
    res.json({
      status: 'success',
      message: `Rider status updated to ${isOnline ? 'online' : 'offline'}`,
      rider: {
        id: rider._id,
        name: rider.name,
        isOnline: rider.isOnline,
        location: rider.location
      }
    });
    
  } catch (error) {
    console.error('Update rider status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update rider status',
    });
  }
};

// @desc    Auto-set rider online after KYC approval
// @route   PUT /api/riders/auto-online
// @access  Private (Rider)
export const setAutoOnline = async (req, res) => {
  try {
    const riderId = req.user.id;
    
    // Check if rider KYC is approved
    if (req.user.kycStatus !== 'approved') {
      return res.status(400).json({
        status: 'error',
        message: 'KYC must be approved first'
      });
    }
    
    // Set rider online automatically
    const rider = await User.findByIdAndUpdate(
      riderId,
      { isOnline: true },
      { new: true }
    ).select('-password');
    
    res.json({
      status: 'success',
      message: 'Rider automatically set to online after KYC approval',
      rider: {
        id: rider._id,
        name: rider.name,
        isOnline: rider.isOnline
      }
    });
    
  } catch (error) {
    console.error('Auto-online rider error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to set rider online',
    });
  }
};
