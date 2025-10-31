// ============================================
// CHAT FEATURE - Complete Implementation
// ============================================

// 1. Backend - Message Model
// backend/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'location'],
      default: 'text',
    },
    imageUrl: String,
    location: {
      latitude: Number,
      longitude: Number,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
messageSchema.index({ orderId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);

