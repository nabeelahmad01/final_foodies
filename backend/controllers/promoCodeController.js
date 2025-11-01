// backend/controllers/promoCodeController.js
import PromoCode from '../models/PromoCode.js';
import AppError from '../utils/AppError.js';

/**
 * @desc    Get all promo codes
 * @route   GET /api/promocodes
 * @access  Private/Admin
 */
export const getPromoCodes = async (req, res, next) => {
  try {
    const promoCodes = await PromoCode.find({});
    res.status(200).json({
      status: 'success',
      results: promoCodes.length,
      data: {
        promoCodes,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single promo code
 * @route   GET /api/promocodes/:code
 * @access  Private
 */
export const getPromoCode = async (req, res, next) => {
  try {
    const promoCode = await PromoCode.findOne({ code: req.params.code });

    if (!promoCode) {
      return next(new AppError('No promo code found with that code', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        promoCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new promo code
 * @route   POST /api/promocodes
 * @access  Private/Admin
 */
export const createPromoCode = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minOrder, maxDiscount, validFrom, validUntil, usageLimit } = req.body;

    // Check if promo code already exists
    const promoCodeExists = await PromoCode.findOne({ code });
    if (promoCodeExists) {
      return next(new AppError('Promo code already exists', 400));
    }

    const promoCode = await PromoCode.create({
      code,
      discountType,
      discountValue,
      minOrder,
      maxDiscount,
      validFrom: validFrom || Date.now(),
      validUntil: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
      usageLimit: usageLimit || 100,
    });

    res.status(201).json({
      status: 'success',
      data: {
        promoCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update promo code
 * @route   PUT /api/promocodes/:id
 * @access  Private/Admin
 */
export const updatePromoCode = async (req, res, next) => {
  try {
    const promoCode = await PromoCode.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!promoCode) {
      return next(new AppError('No promo code found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        promoCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete promo code
 * @route   DELETE /api/promocodes/:id
 * @access  Private/Admin
 */
export const deletePromoCode = async (req, res, next) => {
  try {
    const promoCode = await PromoCode.findByIdAndDelete(req.params.id);

    if (!promoCode) {
      return next(new AppError('No promo code found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify promo code
 * @route   POST /api/promocodes/verify
 * @access  Private
 */
export const verifyPromoCode = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return next(new AppError('Please provide a promo code', 400));
    }

    const promoCode = await PromoCode.findOne({ code });

    if (!promoCode) {
      return next(new AppError('Invalid promo code', 400));
    }

    // Check if promo code is active
    if (!promoCode.isActive) {
      return next(new AppError('This promo code is not active', 400));
    }

    // Check if promo code has expired
    if (promoCode.validUntil && new Date() > new Date(promoCode.validUntil)) {
      return next(new AppError('This promo code has expired', 400));
    }

    // Check if promo code has reached its usage limit
    if (promoCode.usageCount >= promoCode.usageLimit) {
      return next(new AppError('This promo code has reached its usage limit', 400));
    }

    // Check minimum order amount
    if (orderAmount && promoCode.minOrder && orderAmount < promoCode.minOrder) {
      return next(
        new AppError(`Minimum order amount for this promo code is $${promoCode.minOrder}`, 400)
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (promoCode.discountType === 'percentage') {
      discountAmount = (orderAmount * promoCode.discountValue) / 100;
      if (promoCode.maxDiscount && discountAmount > promoCode.maxDiscount) {
        discountAmount = promoCode.maxDiscount;
      }
    } else {
      // Fixed amount
      discountAmount = promoCode.discountValue;
    }

    res.status(200).json({
      status: 'success',
      data: {
        isValid: true,
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        discountAmount,
        minOrder: promoCode.minOrder,
        maxDiscount: promoCode.maxDiscount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getPromoCodes,
  getPromoCode,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  verifyPromoCode,
};
