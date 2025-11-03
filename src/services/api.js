// src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/constants';
import { router } from 'expo-router';
import { showGlobalToast } from '../context.js/ToastContext';

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
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        // Ensure the token is properly formatted
        const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        config.headers.Authorization = formattedToken;
        console.log('Adding token to request:', formattedToken.substring(0, 20) + '...');
      } else {
        console.log('No token found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  error => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  },
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
