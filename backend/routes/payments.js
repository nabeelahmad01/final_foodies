// backend/routes/payments.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Create payment intent
router.post('/create-intent', protect, paymentController.createPaymentIntent);

// Wallet top-up
router.post('/wallet-topup', protect, paymentController.walletTopup);

// Get wallet balance
router.get('/wallet-balance', protect, paymentController.getWalletBalance);

// Stripe webhook (for payment confirmations)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.stripeWebhook,
);

// Request payout (for restaurants/riders)
router.post('/payout-request', protect, paymentController.requestPayout);

// Get payment history
router.get('/history', protect, paymentController.getPaymentHistory);

module.exports = router;
