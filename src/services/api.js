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
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
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
