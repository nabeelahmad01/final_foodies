// src/services/authService.js
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  // Login
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  }

  // Register
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);

      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    }
  }

  // Logout
  async logout() {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const userJson = await AsyncStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  // Get token
  async getToken() {
    try {
      return await AsyncStorage.getItem('userToken');
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    const token = await this.getToken();
    return !!token;
  }

  // Update profile
  async updateProfile(userData) {
    try {
      const response = await api.put('/auth/update-profile', userData);

      if (response.data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Update failed';
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Password change failed';
    }
  }

  // Upload KYC
  async uploadKYC(formData) {
    try {
      const response = await api.post('/auth/upload-kyc', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'KYC upload failed';
    }
  }
}

export default new AuthService();
