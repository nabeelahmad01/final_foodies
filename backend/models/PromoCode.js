// backend/models/PromoCode.js
import mongoose from 'mongoose';

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
  }
);

/**
 * Check if promo code is valid
 * @param {String} userId - User ID to check against
 * @param {Number} orderAmount - Order amount to validate against min order
 * @returns {Object} Validity status and message
 */
promoCodeSchema.methods.isValid = function (userId, orderAmount) {
  const now = new Date();

  if (!this.isActive) {
    return { valid: false, message: 'Promo code is inactive' };
  }

  if (now < this.validFrom) {
    return { valid: false, message: 'Promo code is not yet active' };
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
      message: `Minimum order amount of $${this.minOrderAmount} required`,
    };
  }

  // Check user-specific restrictions
  if (this.applicableFor === 'new_users') {
    const user = this.usedBy.find((u) => u.userId.toString() === userId);
    if (user && user.count > 0) {
      return { valid: false, message: 'This promo code is for new users only' };
    }
  } else if (this.applicableFor === 'specific_users') {
    if (!this.specificUsers.some((id) => id.toString() === userId)) {
      return { valid: false, message: 'This promo code is not applicable to your account' };
    }
  }

  // Check per-user usage limit
  const userUsage = this.usedBy.find((u) => u.userId.toString() === userId);
  if (userUsage && userUsage.count >= this.userUsageLimit) {
    return {
      valid: false,
      message: `You have already used this promo code ${this.userUsageLimit} time(s)`,
    };
  }

  return { valid: true, message: 'Promo code is valid' };
};

/**
 * Calculate discount amount
 * @param {Number} orderAmount - Order amount to calculate discount for
 * @returns {Object} Discount details
 */
promoCodeSchema.methods.calculateDiscount = function (orderAmount) {
  let discountAmount = 0;

  if (this.discountType === 'percentage') {
    discountAmount = (orderAmount * this.discountValue) / 100;
    if (this.maxDiscount) {
      discountAmount = Math.min(discountAmount, this.maxDiscount);
    }
  } else {
    // Fixed amount
    discountAmount = Math.min(this.discountValue, orderAmount);
  }

  return {
    discountAmount,
    finalAmount: orderAmount - discountAmount,
  };
};

/**
 * Mark promo code as used
 * @param {String} userId - User ID who used the promo code
 * @returns {Promise<Boolean>} Success status
 */
promoCodeSchema.methods.markAsUsed = async function (userId) {
  try {
    const userIndex = this.usedBy.findIndex((u) => u.userId.toString() === userId);

    if (userIndex === -1) {
      this.usedBy.push({
        userId,
        count: 1,
        lastUsed: new Date(),
      });
    } else {
      this.usedBy[userIndex].count += 1;
      this.usedBy[userIndex].lastUsed = new Date();
    }

    this.usageCount += 1;
    await this.save();
    return true;
  } catch (error) {
    console.error('Error marking promo code as used:', error);
    return false;
  }
};

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);
export default PromoCode;
