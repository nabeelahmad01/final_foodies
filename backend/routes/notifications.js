// backend/routes/notifications.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import * as notificationController from '../controllers/notificationController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all notifications for the logged-in user
router.get('/', notificationController.getUserNotifications);

// Mark a notification as read
router.patch('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

// Delete a notification
router.delete('/:id', notificationController.deleteNotification);

// Delete all notifications
router.delete('/', notificationController.deleteAllNotifications);

// Admin routes
router.use(notificationController.restrictTo('admin'));

// Get all notifications (admin only)
router.get('/admin/all', notificationController.getAllNotifications);

// Send a notification to all users (admin only)
router.post('/admin/broadcast', notificationController.broadcastNotification);

export default router;
