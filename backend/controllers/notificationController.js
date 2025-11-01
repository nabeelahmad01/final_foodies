// backend/controllers/notificationController.js
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

// @desc    Get all notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
export const getUserNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { user: req.user.id };
    
    // Filter by read status if provided
    if (req.query.read) {
      query.isRead = req.query.read === 'true';
    }

    const notifications = await Notification.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: notifications.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        notifications,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return next(new AppError('No notification found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        notification,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/mark-all-read
// @access  Private
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!notification) {
      return next(new AppError('No notification found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete all notifications
// @route   DELETE /api/notifications
// @access  Private
export const deleteAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ user: req.user.id });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all notifications (admin only)
// @route   GET /api/notifications/admin/all
// @access  Private/Admin
export const getAllNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    
    // Filter by user if provided
    if (req.query.userId) {
      query.user = req.query.userId;
    }
    
    // Filter by read status if provided
    if (req.query.read) {
      query.isRead = req.query.read === 'true';
    }
    
    // Filter by type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }

    const notifications = await Notification.find(query)
      .populate({
        path: 'user',
        select: 'name email',
      })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: notifications.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        notifications,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a notification to all users (admin only)
// @route   POST /api/notifications/admin/broadcast
// @access  Private/Admin
export const broadcastNotification = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { title, message, type = 'info', link } = req.body;

    // Get all user IDs
    const users = await User.find({}).select('_id');
    const userIds = users.map(user => user._id);

    // Create notifications for all users
    const notifications = userIds.map(userId => ({
      user: userId,
      title,
      message,
      type,
      link,
      isBroadcast: true,
    }));

    await Notification.insertMany(notifications);

    // In a real app, you would also send push notifications here
    // await sendPushNotifications(userIds, { title, message, type, link });

    res.status(201).json({
      status: 'success',
      message: `Notification sent to ${userIds.length} users`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Middleware to restrict routes to specific roles
// @access  Private
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

// Helper function to create a notification
// @desc    Create a notification
// @access  Private
export const createNotification = async ({
  user,
  title,
  message,
  type = 'info',
  link,
  relatedId,
}) => {
  try {
    const notification = await Notification.create({
      user,
      title,
      message,
      type,
      link,
      relatedId,
    });

    // In a real app, you would also send a push notification here
    // await sendPushNotification(user, { title, message, type, link });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
