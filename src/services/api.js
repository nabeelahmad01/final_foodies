// src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/constants';
import { router } from 'expo-router';
import { showGlobalToast } from '../context.js/ToastContext';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to headers and handle mock API
api.interceptors.request.use(
  async config => {
    try {
      // In development, use mock data for specific endpoints
      if (isDevelopment && config.url === '/auth/me') {
        console.log('Using mock data for /auth/me in development');
        // Create a mock response
        const mockResponse = {
          data: {
            id: 'mock-user-id',
            _id: 'mock-user-id',
            email: 'admin786@gmail.com',
            name: 'Rizwan',
            phone: '031807371071',
            role: 'restaurant',
            kycStatus: 'pending',
            isEmailVerified: true,
            isPhoneVerified: true,
            createdAt: new Date().toISOString()
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: { ...config, __isRetryRequest: true },
          request: {}
        };
        
        // Return a resolved promise with the mock response
        return Promise.resolve(mockResponse);
      }

      // For non-mock requests, add the token
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        config.headers.Authorization = formattedToken;
        console.log('Adding token to request:', formattedToken.substring(0, 20) + '...');
      } else {
        console.log('No token found in AsyncStorage');
      }
      
      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  },
  error => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('userToken');
      } catch {}
      try {
        showGlobalToast('Session expired. Please log in again', 'error');
      } catch {}
      try {
        router.replace('/');
      } catch {}
    }
    return Promise.reject(error);
  },
);

export default api;
