// backend/models/PromoCode.js
const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: null,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    maxUsageCount: {
      type: Number,
      default: null,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    userUsageLimit: {
      type: Number,
      default: 1,
    },
    usedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        count: {
          type: Number,
          default: 0,
        },
        lastUsed: Date,
      },
    ],
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    applicableFor: {
      type: String,
      enum: ['all', 'new_users', 'specific_users'],
      default: 'all',
    },
    specificUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    restaurants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Check if promo code is valid
promoCodeSchema.methods.isValid = function (userId, orderAmount) {
  const now = new Date();

  if (!this.isActive) {
    return { valid: false, message: 'Promo code is inactive' };
  }

  if (now < this.validFrom) {
    return { valid: false, message: 'Promo code not yet valid' };
  }

  if (now > this.validUntil) {
    return { valid: false, message: 'Promo code has expired' };
  }

  if (this.maxUsageCount && this.usageCount >= this.maxUsageCount) {
    return { valid: false, message: 'Promo code usage limit reached' };
  }

  if (orderAmount < this.minOrderAmount) {
    return {
      valid: false,
      message: `Minimum order amount is Rs. ${this.minOrderAmount}`,
    };
  }

  const userUsage = this.usedBy.find(
    u => u.userId.toString() === userId.toString(),
  );
  if (userUsage && userUsage.count >= this.userUsageLimit) {
    return { valid: false, message: 'You have already used this promo code' };
  }

  return { valid: true };
};

// Calculate discount
promoCodeSchema.methods.calculateDiscount = function (orderAmount) {
  let discount = 0;

  if (this.discountType === 'percentage') {
    discount = (orderAmount * this.discountValue) / 100;
    if (this.maxDiscount) {
      discount = Math.min(discount, this.maxDiscount);
    }
  } else {
    discount = this.discountValue;
  }

  return Math.round(discount);
};

// Mark as used
promoCodeSchema.methods.markAsUsed = async function (userId) {
  const userUsage = this.usedBy.find(
    u => u.userId.toString() === userId.toString(),
  );

  if (userUsage) {
    userUsage.count += 1;
    userUsage.lastUsed = new Date();
  } else {
    this.usedBy.push({
      userId,
      count: 1,
      lastUsed: new Date(),
    });
  }

  this.usageCount += 1;
  await this.save();
};

module.exports = mongoose.model('PromoCode', promoCodeSchema);
