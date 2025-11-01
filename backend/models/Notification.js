// backend/models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A notification must belong to a user'],
    },
    title: {
      type: String,
      required: [true, 'A notification must have a title'],
      trim: true,
      maxlength: [100, 'A notification title must have less or equal than 100 characters'],
    },
    message: {
      type: String,
      required: [true, 'A notification must have a message'],
      trim: true,
      maxlength: [500, 'A notification message must have less or equal than 500 characters'],
    },
    type: {
      type: String,
      enum: [
        'order',
        'promotion',
        'system',
        'account',
        'delivery',
        'payment',
        'review',
        'support',
        'announcement',
        'other',
      ],
      default: 'other',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isBroadcast: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      trim: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.Mixed,
    },
    image: {
      type: String,
      default: 'default-notification.png',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    expiresAt: {
      type: Date,
      default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ isBroadcast: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Populate user data when querying notifications
notificationSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name email profileImage',
  });
  next();
});

// Static method to get unread notification count for a user
notificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

// Static method to get notifications for a user with pagination
notificationSchema.statics.getUserNotifications = async function (
  userId,
  { page = 1, limit = 10, readStatus = null, type = null } = {}
) {
  const skip = (page - 1) * limit;
  
  const query = { user: userId };
  
  if (readStatus !== null) {
    query.isRead = readStatus === 'read';
  }
  
  if (type) {
    query.type = type;
  }

  const [notifications, total] = await Promise.all([
    this.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
  ]);

  return {
    notifications,
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  };
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = async function (userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true } }
  );
};

// Static method to create a notification
notificationSchema.statics.createNotification = async function (notificationData) {
  const notification = await this.create(notificationData);
  
  // In a real app, you would also send a push notification here
  // await sendPushNotification(notification.user, {
  //   title: notification.title,
  //   message: notification.message,
  //   type: notification.type,
  //   link: notification.link,
  // });
  
  return notification;
};

// Static method to create multiple notifications (for broadcast)
notificationSchema.statics.createNotifications = async function (notificationsData) {
  const notifications = await this.insertMany(notificationsData);
  
  // In a real app, you would also send push notifications here
  // for (const notification of notifications) {
  //   await sendPushNotification(notification.user, {
  //     title: notification.title,
  //     message: notification.message,
  //     type: notification.type,
  //     link: notification.link,
  //   });
  // }
  
  return notifications;
};

// Instance method to mark a notification as read
notificationSchema.methods.markAsRead = async function () {
  if (this.isRead) return this;
  
  this.isRead = true;
  return this.save();
};

// Pre-save hook to set default values
notificationSchema.pre('save', function (next) {
  // Set default image based on notification type
  if (!this.image) {
    switch (this.type) {
      case 'order':
        this.image = 'order-notification.png';
        break;
      case 'promotion':
        this.image = 'promotion-notification.png';
        break;
      case 'system':
        this.image = 'system-notification.png';
        break;
      default:
        this.image = 'default-notification.png';
    }
  }
  
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
