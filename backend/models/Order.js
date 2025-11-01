// backend/models/Order.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    items: [
      {
        menuItemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MenuItem',
        },
        name: String,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    deliveryCoordinates: {
      latitude: Number,
      longitude: Number,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'accepted',
        'preparing',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'wallet', 'cash'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    stripePaymentId: String,
    deliveryFee: {
      type: Number,
      default: 100,
    },
    tax: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    specialInstructions: String,
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    cancellationReason: String,
    rating: {
      food: { type: Number, min: 1, max: 5 },
      delivery: { type: Number, min: 1, max: 5 },
      comment: String,
      createdAt: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ riderId: 1, status: 1 });

// Update order status and notify
orderSchema.methods.updateStatus = async function (newStatus, io) {
  this.status = newStatus;

  if (newStatus === 'delivered') {
    this.actualDeliveryTime = new Date();
    this.paymentStatus = 'completed';
  }

  await this.save();

  // Emit socket event for real-time update
  if (io) {
    io.to(`order_${this._id}`).emit('orderUpdate', {
      orderId: this._id,
      status: newStatus,
      timestamp: new Date(),
    });
  }

  return this;
};

const Order = mongoose.model('Order', orderSchema);

export default Order;
