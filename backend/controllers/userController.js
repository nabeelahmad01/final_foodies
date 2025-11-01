// backend/controllers/userController.js
import User from '../models/User.js';
import Order from '../models/Order.js';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      status: 'success',
      user,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, profileImage } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, profileImage },
      { new: true, runValidators: true },
    ).select('-password');

    res.json({
      status: 'success',
      user,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile',
    });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect',
      });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      status: 'success',
      message: 'Password updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password',
    });
  }
};

// @desc    Get user addresses
// @route   GET /api/users/addresses
// @access  Private
export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses');
    res.json({
      status: 'success',
      addresses: user.addresses,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch addresses',
    });
  }
};

// @desc    Add new address
// @route   POST /api/users/addresses
// @access  Private
export const addAddress = async (req, res) => {
  try {
    const { name, phone, address, city, state, postalCode, isDefault } = req.body;

    const newAddress = {
      name,
      phone,
      address,
      city,
      state,
      postalCode,
      isDefault,
    };

    const user = await User.findById(req.user.id);
    
    // If this is set as default, unset all other defaults
    if (isDefault) {
      user.addresses = user.addresses.map(addr => ({
        ...addr,
        isDefault: false,
      }));
    }

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({
      status: 'success',
      address: newAddress,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to add address',
    });
  }
};

// @desc    Update address
// @route   PUT /api/users/addresses/:id
// @access  Private
export const updateAddress = async (req, res) => {
  try {
    const { name, phone, address, city, state, postalCode, isDefault } = req.body;
    const addressId = req.params.id;

    const user = await User.findById(req.user.id);
    
    // Find the address index
    const addressIndex = user.addresses.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Address not found',
      });
    }

    // If this is set as default, unset all other defaults
    if (isDefault) {
      user.addresses = user.addresses.map(addr => ({
        ...addr.toObject(),
        isDefault: false,
      }));
    }

    // Update the address
    user.addresses[addressIndex] = {
      ...user.addresses[addressIndex].toObject(),
      name,
      phone,
      address,
      city,
      state,
      postalCode,
      isDefault: isDefault !== undefined ? isDefault : user.addresses[addressIndex].isDefault,
    };

    await user.save();

    res.json({
      status: 'success',
      address: user.addresses[addressIndex],
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update address',
    });
  }
};

// @desc    Delete address
// @route   DELETE /api/users/addresses/:id
// @access  Private
export const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const user = await User.findById(req.user.id);

    user.addresses = user.addresses.filter(
      addr => addr._id.toString() !== addressId
    );

    await user.save();

    res.json({
      status: 'success',
      message: 'Address deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete address',
    });
  }
};

// @desc    Get user's favorite restaurants
// @route   GET /api/users/favorites
// @access  Private
export const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('favorites')
      .populate('favorites', 'name image rating cuisineType deliveryTime');

    res.json({
      status: 'success',
      favorites: user.favorites,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch favorites',
    });
  }
};

// @desc    Add restaurant to favorites
// @route   POST /api/users/favorites/:restaurantId
// @access  Private
export const addToFavorites = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const user = await User.findById(req.user.id);

    // Check if already in favorites
    if (user.favorites.includes(restaurantId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Restaurant already in favorites',
      });
    }

    user.favorites.push(restaurantId);
    await user.save();

    res.status(201).json({
      status: 'success',
      message: 'Added to favorites',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to add to favorites',
    });
  }
};

// @desc    Remove restaurant from favorites
// @route   DELETE /api/users/favorites/:restaurantId
// @access  Private
export const removeFromFavorites = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const user = await User.findById(req.user.id);

    user.favorites = user.favorites.filter(
      favId => favId.toString() !== restaurantId
    );

    await user.save();

    res.json({
      status: 'success',
      message: 'Removed from favorites',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove from favorites',
    });
  }
};

// @desc    Get user's orders
// @route   GET /api/users/orders
// @access  Private
export const getUserOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('restaurantId', 'name image')
      .populate('items.menuItem', 'name price');

    const total = await Order.countDocuments({ userId: req.user.id });

    res.json({
      status: 'success',
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders',
    });
  }
};

// @desc    Get order details
// @route   GET /api/users/orders/:orderId
// @access  Private
export const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user.id,
    })
      .populate('restaurantId', 'name image address phone')
      .populate('items.menuItem', 'name price image')
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
      message: 'Failed to fetch order details',
    });
  }
};

// @desc    Get user's payment methods
// @route   GET /api/users/payment-methods
// @access  Private
export const getPaymentMethods = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('paymentMethods');
    res.json({
      status: 'success',
      paymentMethods: user.paymentMethods,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch payment methods',
    });
  }
};

// @desc    Add payment method
// @route   POST /api/users/payment-methods
// @access  Private
export const addPaymentMethod = async (req, res) => {
  try {
    const { cardNumber, cardHolder, expiryMonth, expiryYear, cvv, isDefault } = req.body;

    // In a real app, you would use a payment processor like Stripe to tokenize the card
    // This is a simplified example
    const paymentMethod = {
      cardNumber: `•••• •••• •••• ${cardNumber.slice(-4)}`,
      cardBrand: 'VISA', // You would determine this from the card number
      isDefault,
      last4: cardNumber.slice(-4),
      expiryMonth,
      expiryYear,
    };

    const user = await User.findById(req.user.id);
    
    // If this is set as default, unset all other defaults
    if (isDefault) {
      user.paymentMethods = user.paymentMethods.map(pm => ({
        ...pm.toObject(),
        isDefault: false,
      }));
    }

    user.paymentMethods.push(paymentMethod);
    await user.save();

    res.status(201).json({
      status: 'success',
      paymentMethod,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to add payment method',
    });
  }
};

// @desc    Remove payment method
// @route   DELETE /api/users/payment-methods/:paymentMethodId
// @access  Private
export const removePaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const user = await User.findById(req.user.id);

    user.paymentMethods = user.paymentMethods.filter(
      pm => pm._id.toString() !== paymentMethodId
    );

    await user.save();

    res.json({
      status: 'success',
      message: 'Payment method removed',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove payment method',
    });
  }
};
