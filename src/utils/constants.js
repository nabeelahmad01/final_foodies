// src/utils/constants.js
export const API_URL = 'http://192.168.0.77:5000/api';

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
