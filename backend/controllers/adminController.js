// backend/controllers/adminController.js
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');

// @desc    Get pending KYC verifications
// @route   GET /api/admin/kyc-pending
// @access  Private/Admin
exports.getPendingKYC = async (req, res) => {
  try {
    const users = await User.find({ kycStatus: 'pending' }).select(
      'name email role kycDocuments createdAt',
    );

    res.json({
      status: 'success',
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch pending KYC',
    });
  }
};

// @desc    Approve KYC
// @route   PUT /api/admin/kyc-approve/:userId
// @access  Private/Admin
exports.approveKYC = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { kycStatus: 'approved', kycRejectionReason: null },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // TODO: Send email notification

    res.json({
      status: 'success',
      message: 'KYC approved successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to approve KYC',
    });
  }
};

// @desc    Reject KYC
// @route   PUT /api/admin/kyc-reject/:userId
// @access  Private/Admin
exports.rejectKYC = async (req, res) => {
  try {
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { kycStatus: 'rejected', kycRejectionReason: reason },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // TODO: Send email notification

    res.json({
      status: 'success',
      message: 'KYC rejected',
      user,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject KYC',
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    res.json({
      status: 'success',
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users',
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    res.json({
      status: 'success',
      user,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user',
    });
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true },
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    res.json({
      status: 'success',
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user status',
    });
  }
};

// @desc    Get all restaurants
// @route   GET /api/admin/restaurants
// @access  Private/Admin
exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find()
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      count: restaurants.length,
      restaurants,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch restaurants',
    });
  }
};

// @desc    Update restaurant status
// @route   PUT /api/admin/restaurants/:id/status
// @access  Private/Admin
exports.updateRestaurantStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true },
    );

    if (!restaurant) {
      return res.status(404).json({
        status: 'error',
        message: 'Restaurant not found',
      });
    }

    res.json({
      status: 'success',
      message: `Restaurant ${isActive ? 'activated' : 'deactivated'}`,
      restaurant,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update restaurant status',
    });
  }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const orders = await Order.find()
      .populate('userId', 'name email')
      .populate('restaurantId', 'name')
      .populate('riderId', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments();

    res.json({
      status: 'success',
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders',
    });
  }
};

// @desc    Get order statistics
// @route   GET /api/admin/orders/stats
// @access  Private/Admin
exports.getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
    ]);

    res.json({
      status: 'success',
      stats,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order stats',
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRestaurants = await Restaurant.countDocuments();
    const totalOrders = await Order.countDocuments();
    const pendingKYC = await User.countDocuments({ kycStatus: 'pending' });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: todayStart },
    });

    const todayRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart },
          paymentStatus: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);

    res.json({
      status: 'success',
      stats: {
        totalUsers,
        totalRestaurants,
        totalOrders,
        pendingKYC,
        todayOrders,
        todayRevenue: todayRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard stats',
    });
  }
};

// @desc    Get revenue statistics
// @route   GET /api/admin/revenue
// @access  Private/Admin
exports.getRevenueStats = async (req, res) => {
  try {
    const { period = 'week' } = req.query; // week, month, year

    let groupBy;
    let dateRange;

    const now = new Date();

    switch (period) {
      case 'week':
        dateRange = new Date(now.setDate(now.getDate() - 7));
        groupBy = { $dayOfMonth: '$createdAt' };
        break;
      case 'month':
        dateRange = new Date(now.setMonth(now.getMonth() - 1));
        groupBy = { $dayOfMonth: '$createdAt' };
        break;
      case 'year':
        dateRange = new Date(now.setFullYear(now.getFullYear() - 1));
        groupBy = { $month: '$createdAt' };
        break;
      default:
        dateRange = new Date(now.setDate(now.getDate() - 7));
        groupBy = { $dayOfMonth: '$createdAt' };
    }

    const revenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange },
          paymentStatus: 'completed',
        },
      },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json({
      status: 'success',
      period,
      revenue,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch revenue stats',
    });
  }
};
