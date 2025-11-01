// backend/routes/promoCodes.js
import express from 'express';
import * as promoCodeController from '../controllers/promoCodeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @desc    Get all promo codes (admin only)
 * @route   GET /api/promocodes
 * @access  Private/Admin
 */
router.get('/', protect, authorize('admin'), promoCodeController.getPromoCodes);

/**
 * @desc    Get single promo code
 * @route   GET /api/promocodes/:code
 * @access  Private
 */
router.get('/:code', protect, promoCodeController.getPromoCode);

/**
 * @desc    Create new promo code (admin only)
 * @route   POST /api/promocodes
 * @access  Private/Admin
 */
router.post('/', protect, authorize('admin'), promoCodeController.createPromoCode);

/**
 * @desc    Update promo code (admin only)
 * @route   PUT /api/promocodes/:id
 * @access  Private/Admin
 */
router.put('/:id', protect, authorize('admin'), promoCodeController.updatePromoCode);

/**
 * @desc    Delete promo code (admin only)
 * @route   DELETE /api/promocodes/:id
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), promoCodeController.deletePromoCode);

/**
 * @desc    Verify promo code
 * @route   POST /api/promocodes/verify
 * @access  Private
 */
router.post('/verify', protect, promoCodeController.verifyPromoCode);

export default router;