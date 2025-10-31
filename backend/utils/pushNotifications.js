// ============================================
// BACKEND - Send Push Notifications
// ============================================

// backend/utils/pushNotifications.js
const { Expo } = require('expo-server-sdk');
const User = require('../models/User');

const expo = new Expo();

// Add pushToken field to User model
// pushToken: { type: String, default: null }

async function sendPushNotification(userId, title, body, data = {}) {
  try {
    const user = await User.findById(userId);

    if (!user || !user.pushToken) {
      console.log('No push token for user:', userId);
      return;
    }

    if (!Expo.isExpoPushToken(user.pushToken)) {
      console.error('Invalid Expo push token:', user.pushToken);
      return;
    }

    const message = {
      to: user.pushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      badge: 1,
    };

    const ticket = await expo.sendPushNotificationsAsync([message]);
    console.log('Push notification sent:', ticket);

    return ticket;
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

// Send to multiple users
async function sendBulkPushNotifications(userIds, title, body, data = {}) {
  try {
    const users = await User.find({
      _id: { $in: userIds },
      pushToken: { $ne: null },
    });

    const messages = users
      .filter(user => Expo.isExpoPushToken(user.pushToken))
      .map(user => ({
        to: user.pushToken,
        sound: 'default',
        title,
        body,
        data,
      }));

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    console.log('Bulk notifications sent:', tickets.length);
    return tickets;
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
  }
}

module.exports = {
  sendPushNotification,
  sendBulkPushNotifications,
};
