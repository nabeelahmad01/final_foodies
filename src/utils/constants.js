// src/utils/constants.js
// API Configuration
const __DEV__ = process.env.NODE_ENV === 'development';

// Development API URL - use your local IP
const DEV_API_URL = 'http://192.168.0.46:5000/api';

// Production API URL - replace with your deployed backend URL
// After Railway deployment, replace with your actual URL
const PROD_API_URL = 'https://finalfoodies.up.railway.app/api';

// Use development URL for now, change to PROD_API_URL when you deploy backend
// After deployment, replace 'your-backend-domain.com' with your actual Railway URL
export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

export const ORDER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const KYC_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const USER_ROLES = {
  CUSTOMER: 'customer',
  RESTAURANT: 'restaurant',
  RIDER: 'rider',
  ADMIN: 'admin',
};

export const PAYMENT_METHODS = {
  CARD: 'card',
  WALLET: 'wallet',
};

export const CATEGORIES = [
  { id: 1, name: 'Pizza', icon: '🍕' },
  { id: 2, name: 'Burger', icon: '🍔' },
  { id: 3, name: 'Chinese', icon: '🥡' },
  { id: 4, name: 'Desserts', icon: '🍰' },
  { id: 5, name: 'Drinks', icon: '🥤' },
  { id: 6, name: 'Biryani', icon: '🍚' },
];
