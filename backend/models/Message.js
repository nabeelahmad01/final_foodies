// ============================================
// CHAT FEATURE - Complete Implementation
// ============================================

// 1. Backend - Message Model
// backend/models/Message.js
import mongoose from 'mongoose';

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
      required: function() {
        return !this.imageUrl; // Message is required if no image
      },
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'location'],
      default: 'text',
    },
    imageUrl: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      address: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
messageSchema.index({ orderId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, isRead: 1 });

// Virtual for message URL
messageSchema.virtual('url').get(function() {
  return `/api/messages/${this._id}`;
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
