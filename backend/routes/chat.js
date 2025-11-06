// ============================================
// Backend - Chat Routes
// backend/routes/chat.js
// ============================================

import express from 'express';
import { protect } from '../middleware/auth.js';
import Message from '../models/Message.js';
import Order from '../models/Order.js';
import AppError from '../utils/AppError.js';

const router = express.Router();

// @desc    Get all conversations for the current user
// @route   GET /api/chat/conversations
// @access  Private
router.get('/conversations', protect, async (req, res, next) => {
  try {
    console.log('🔍 Conversations request from user:', {
      userId: req.user.id,
      userRole: req.user.role,
      userName: req.user.name
    });

    // For customers: Get all orders where they are the customer
    // For restaurant owners: Get all orders for their restaurant  
    // For riders: Get all orders assigned to them
    let orders;
    if (req.user.role === 'customer' || req.user.role === 'user') {
      orders = await Order.find({ userId: req.user.id }).select('_id status');
    } else if (req.user.role === 'restaurant') {
      orders = await Order.find({ 'restaurantId.owner': req.user.id }).select('_id status');
    } else if (req.user.role === 'rider') {
      orders = await Order.find({ riderId: req.user.id }).select('_id status');
    } else {
      console.error('❌ Unauthorized role for conversations:', req.user.role);
      return res.status(403).json({
        status: 'error',
        message: `Role '${req.user.role}' not authorized for conversations`,
      });
    }

    console.log('📋 Found orders for conversations:', orders.length);

    // Get the latest message for each order
    const conversations = await Promise.all(
      orders.map(async (order) => {
        const lastMessage = await Message.findOne({ orderId: order._id })
          .sort('-createdAt')
          .populate('senderId', 'name profileImage');

        return {
          orderId: order._id,
          status: order.status,
          lastMessage: lastMessage || null,
          unreadCount: await Message.countDocuments({
            orderId: order._id,
            isRead: false,
            senderId: { $ne: req.user.id },
          }),
        };
      })
    );

    res.status(200).json({
      status: 'success',
      results: conversations.length,
      data: {
        conversations,
      },
    });
  } catch (error) {
    console.error('❌ Conversations endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch conversations',
      details: error.message,
    });
  }
});

// @desc    Get chat messages for an order
// @route   GET /api/chat/:orderId
// @access  Private
router.get('/:orderId', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check if the user is part of this order
    if (
      order.userId.toString() !== req.user.id &&
      order.riderId?.toString() !== req.user.id &&
      (!order.restaurantId || order.restaurantId.owner?.toString() !== req.user.id)
    ) {
      return next(
        new AppError('Not authorized to view these messages', 403)
      );
    }

    const messages = await Message.find({ orderId: order._id })
      .sort('createdAt')
      .populate('senderId', 'name profileImage');

    res.status(200).json({
      status: 'success',
      data: {
        messages,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Send a message
// @route   POST /api/chat/:orderId
// @access  Private
router.post('/:orderId', protect, async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return next(new AppError('Message content is required', 400));
    }

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check if the user is part of this order
    if (
      order.userId.toString() !== req.user.id &&
      order.riderId?.toString() !== req.user.id &&
      (!order.restaurantId || order.restaurantId.owner?.toString() !== req.user.id)
    ) {
      return next(
        new AppError('Not authorized to send messages for this order', 403)
      );
    }

    const message = await Message.create({
      message: content,
      senderId: req.user.id,
      orderId: order._id,
      receiverId: order.userId.toString() === req.user.id ? order.riderId : order.userId,
    });

    // Populate sender info
    await message.populate('senderId', 'name profileImage');

    // Emit message to the room
    req.app.get('io').to(`order_${order._id}`).emit('message', message);

    res.status(201).json({
      status: 'success',
      data: {
        message,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Mark messages as read
// @route   PUT /api/chat/:orderId/read
// @access  Private
router.put('/:orderId/read', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check if the user is part of this order
    if (
      order.userId.toString() !== req.user.id &&
      order.riderId?.toString() !== req.user.id &&
      (!order.restaurantId || order.restaurantId.owner?.toString() !== req.user.id)
    ) {
      return next(
        new AppError('Not authorized to mark messages as read', 403)
      );
    }

    // Mark all messages as read for this user
    await Message.updateMany(
      { 
        orderId: order._id, 
        receiverId: req.user.id,
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Messages marked as read',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
