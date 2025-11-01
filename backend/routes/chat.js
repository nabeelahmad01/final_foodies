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
      order.user.toString() !== req.user.id &&
      (!order.restaurant || order.restaurant.owner.toString() !== req.user.id)
    ) {
      return next(
        new AppError('Not authorized to view these messages', 403)
      );
    }

    const messages = await Message.find({ order: order._id })
      .sort('createdAt')
      .populate('sender', 'name profileImage');

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
      order.user.toString() !== req.user.id &&
      (!order.restaurant || order.restaurant.owner.toString() !== req.user.id)
    ) {
      return next(
        new AppError('Not authorized to send messages for this order', 403)
      );
    }

    const message = await Message.create({
      content,
      sender: req.user.id,
      order: order._id,
    });

    // Populate sender info
    await message.populate('sender', 'name profileImage');

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

// @desc    Get all conversations for the current user
// @route   GET /api/chat/conversations
// @access  Private
router.get('/conversations', protect, async (req, res, next) => {
  try {
    // For customers: Get all orders where they are the customer
    // For restaurant owners: Get all orders for their restaurant
    let orders;
    if (req.user.role === 'customer') {
      orders = await Order.find({ user: req.user.id }).select('_id status');
    } else if (req.user.role === 'restaurant') {
      orders = await Order.find({ 'restaurant.owner': req.user.id }).select(
        '_id status'
      );
    } else {
      return next(new AppError('Not authorized', 403));
    }

    // Get the latest message for each order
    const conversations = await Promise.all(
      orders.map(async (order) => {
        const lastMessage = await Message.findOne({ order: order._id })
          .sort('-createdAt')
          .populate('sender', 'name profileImage');

        return {
          orderId: order._id,
          status: order.status,
          lastMessage: lastMessage || null,
          unreadCount: await Message.countDocuments({
            order: order._id,
            read: false,
            sender: { $ne: req.user.id },
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
    next(error);
  }
});

export default router;
