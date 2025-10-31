// ============================================
// 2. Backend - Chat Routes
// backend/routes/chat.js
// ============================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Message = require('../models/Message');
const Order = require('../models/Order');

// @desc    Get chat messages for an order
// @route   GET /api/chat/:orderId
// @access  Private
router.get('/:orderId', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }

    // Check if user is part of this order
    const isParticipant =
      order.userId.toString() === req.user.id ||
      order.riderId?.toString() === req.user.id;

    if (!isParticipant) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this chat',
      });
    }

    const messages = await Message.find({ orderId: req.params.orderId })
      .populate('senderId', 'name')
      .populate('receiverId', 'name')
      .sort({ createdAt: 1 });

    res.json({
      status: 'success',
      messages,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch messages',
    });
  }
});

// @desc    Send a message
// @route   POST /api/chat/:orderId
// @access  Private
router.post('/:orderId', protect, async (req, res) => {
  try {
    const { message, type = 'text', imageUrl, location } = req.body;

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }

    // Determine receiver
    let receiverId;
    if (req.user.id === order.userId.toString()) {
      receiverId = order.riderId;
    } else if (req.user.id === order.riderId?.toString()) {
      receiverId = order.userId;
    } else {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized',
      });
    }

    const newMessage = await Message.create({
      orderId: req.params.orderId,
      senderId: req.user.id,
      receiverId,
      message,
      type,
      imageUrl,
      location,
    });

    await newMessage.populate('senderId', 'name');
    await newMessage.populate('receiverId', 'name');

    // Emit socket event
    const io = req.app.get('io');
    io.to(`order_${req.params.orderId}`).emit('newMessage', newMessage);

    res.status(201).json({
      status: 'success',
      message: newMessage,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send message',
    });
  }
});

// @desc    Mark messages as read
// @route   PUT /api/chat/:orderId/read
// @access  Private
router.put('/:orderId/read', protect, async (req, res) => {
  try {
    await Message.updateMany(
      {
        orderId: req.params.orderId,
        receiverId: req.user.id,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    res.json({
      status: 'success',
      message: 'Messages marked as read',
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark messages as read',
    });
  }
});

// @desc    Get unread message count
// @route   GET /api/chat/:orderId/unread
// @access  Private
router.get('/:orderId/unread', protect, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      orderId: req.params.orderId,
      receiverId: req.user.id,
      isRead: false,
    });

    res.json({
      status: 'success',
      unreadCount: count,
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get unread count',
    });
  }
});

module.exports = router;
