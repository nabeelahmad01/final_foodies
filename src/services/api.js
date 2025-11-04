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

// Request interceptor - Add token to headers
api.interceptors.request.use(
  async config => {
    try {
      // Always use real API - no mock data

      // For real API requests, add the token
      let token = await AsyncStorage.getItem('userToken');
      
      // Remove any existing Bearer prefix to avoid duplication
      if (token && token.startsWith('Bearer ')) {
        token = token.replace('Bearer ', '').trim();
      }
      
      if (token) {
        // Ensure the token is properly formatted with Bearer prefix
        const formattedToken = `Bearer ${token}`;
        config.headers.Authorization = formattedToken;
        
        // Log token info for debugging (don't log the full token in production)
        if (isDevelopment) {
          console.log('Token being sent:', {
            tokenStart: token.substring(0, 10) + '...',
            tokenEnd: '...' + token.substring(token.length - 10),
            length: token.length
          });
        }
      } else {
        console.warn('No token found in AsyncStorage');
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
