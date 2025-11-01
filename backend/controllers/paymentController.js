// backend/controllers/paymentController.js
import Stripe from 'stripe';
import User from '../models/User.js';
import Order from '../models/Order.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create payment intent for order
// @route   POST /api/payments/create-intent
// @access  Private
export const createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid amount',
      });
    }

    // Get or create Stripe customer
    let customer;
    const user = await User.findById(req.user.id);

    if (user.stripeCustomerId) {
      customer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
        },
      });

      user.stripeCustomerId = customer.id;
      await user.save();
    }

    // Create ephemeral key
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2023-10-16' },
    );

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'pkr',
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: req.user.id.toString(),
      },
    });

    res.json({
      status: 'success',
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create payment intent',
    });
  }
};

// @desc    Wallet top-up
// @route   POST /api/payments/wallet-topup
// @access  Private
export const walletTopup = async (req, res) => {
  try {
    const { amount, paymentMethodId } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({
        status: 'error',
        message: 'Minimum top-up amount is Rs. 100',
      });
    }

    const user = await User.findById(req.user.id);

    // Create payment intent for wallet top-up
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'pkr',
      payment_method: paymentMethodId,
      customer: user.stripeCustomerId,
      confirm: true,
      metadata: {
        type: 'wallet_topup',
        userId: user._id.toString(),
      },
    });

    if (paymentIntent.status === 'succeeded') {
      // Update wallet balance
      await user.updateWallet(amount, 'credit', 'Wallet top-up via card');

      res.json({
        status: 'success',
        message: 'Wallet topped up successfully',
        balance: user.wallet.balance,
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Payment failed',
      });
    }
  } catch (error) {
    console.error('Wallet topup error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process top-up',
    });
  }
};

// @desc    Get wallet balance
// @route   GET /api/payments/wallet-balance
// @access  Private
export const getWalletBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      status: 'success',
      balance: user.wallet.balance,
      transactions: user.wallet.transactions.slice(-10), // Last 10 transactions
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch wallet balance',
    });
  }
};

// @desc    Stripe webhook handler
// @route   POST /api/payments/webhook
// @access  Public
export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle different event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent was successful:', paymentIntent.id);

      // Update order payment status if needed
      if (paymentIntent.metadata.orderId) {
        await Order.findByIdAndUpdate(paymentIntent.metadata.orderId, {
          paymentStatus: 'completed',
          stripePaymentId: paymentIntent.id,
        });
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('PaymentIntent failed:', failedPayment.id);

      if (failedPayment.metadata.orderId) {
        await Order.findByIdAndUpdate(failedPayment.metadata.orderId, {
          paymentStatus: 'failed',
        });
      }
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

// @desc    Request payout (for restaurant/rider)
// @route   POST /api/payments/payout-request
// @access  Private
export const requestPayout = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user.id);

    if (!['restaurant', 'rider'].includes(user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Only restaurants and riders can request payouts',
      });
    }

    // TODO: Implement Stripe Connect payout logic
    res.json({
      status: 'success',
      message: 'Payout request submitted. Processing within 2-3 business days.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to process payout request',
    });
  }
};

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
export const getPaymentHistory = async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user.id,
      paymentStatus: 'completed',
    })
      .select('totalAmount paymentMethod createdAt restaurantId')
      .populate('restaurantId', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      status: 'success',
      payments: orders,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch payment history',
    });
  }
};
