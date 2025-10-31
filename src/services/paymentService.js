// src/services/paymentService.js
import api from './api';

class PaymentService {
  // Create payment intent
  async createPaymentIntent(amount) {
    try {
      const response = await api.post('/payments/create-intent', {
        amount,
      });

      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Payment intent creation failed';
    }
  }

  // Wallet top-up
  async walletTopup(amount, paymentMethodId) {
    try {
      const response = await api.post('/payments/wallet-topup', {
        amount,
        paymentMethodId,
      });

      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Wallet top-up failed';
    }
  }

  // Get wallet balance
  async getWalletBalance() {
    try {
      const response = await api.get('/payments/wallet-balance');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch wallet balance';
    }
  }

  // Request payout (for restaurant/rider)
  async requestPayout(amount) {
    try {
      const response = await api.post('/payments/payout-request', {
        amount,
      });

      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Payout request failed';
    }
  }

  // Get payment history
  async getPaymentHistory() {
    try {
      const response = await api.get('/payments/history');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch payment history';
    }
  }

  // Validate promo code
  async validatePromoCode(code, orderAmount) {
    try {
      const response = await api.post('/promo-codes/validate', {
        code,
        orderAmount,
      });

      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Invalid promo code';
    }
  }

  // Apply promo code
  async applyPromoCode(promoCodeId) {
    try {
      const response = await api.post('/promo-codes/apply', {
        promoCodeId,
      });

      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to apply promo code';
    }
  }
}

export default new PaymentService();
