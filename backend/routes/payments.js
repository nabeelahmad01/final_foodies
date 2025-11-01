// backend/routes/payments.js
import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * @desc    Create a payment intent
 * @route   POST /api/payments/create-intent
 * @access  Private
 */
router.post('/create-intent', protect, paymentController.createPaymentIntent);

/**
 * @desc    Top up wallet
 * @route   POST /api/payments/wallet-topup
 * @access  Private
 */
router.post('/wallet-topup', protect, paymentController.walletTopup);

/**
 * @desc    Get wallet balance
 * @route   GET /api/payments/wallet-balance
 * @access  Private
 */
router.get('/wallet-balance', protect, paymentController.getWalletBalance);

/**
 * @desc    Stripe webhook for payment confirmations
 * @route   POST /api/payments/webhook
 * @access  Public (Stripe will call this endpoint)
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.stripeWebhook
);

// Request payout (for restaurants/riders)
router.post('/payout-request', protect, paymentController.requestPayout);

// Get payment history
router.get('/history', protect, paymentController.getPaymentHistory);

export default router;
