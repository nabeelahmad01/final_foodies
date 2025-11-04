// src/utils/constants.js
// Use your computer's local IP address here
// Make sure to update this with your actual local IP address
// For Expo Go app - use your computer's WiFi IP
// For Expo Tunnel mode, use public tunnel URL
export const API_URL = 'https://three-files-beg.loca.lt/api'; // Expo Tunnel mode via localtunnel
// Alternative for different setups:
// export const API_URL = 'http://192.168.0.25:5001/api'; // Expo Go (WiFi IP)
// export const API_URL = 'http://10.0.2.2:5001/api'; // Android emulator only

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
