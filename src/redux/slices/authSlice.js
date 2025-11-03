// src/redux/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mockApi from '../../services/mockApi';
import api from '../../services/api';

// Use mock API for development
const isDevelopment = process.env.NODE_ENV === 'development';
const apiClient = isDevelopment ? mockApi : api;

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = isDevelopment 
        ? (await apiClient.login({ email, password })).data
        : (await apiClient.post('/auth/login', { email, password })).data;
      
      if (response && response.token) {
        await AsyncStorage.setItem('userToken', response.token);
        return response;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      return rejectWithValue(error.message || 'Login failed. Please try again.');
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = isDevelopment
        ? await apiClient.register(userData)
        : (await apiClient.post('/auth/register', userData)).data;
      
      if (response && response.token) {
        await AsyncStorage.setItem('userToken', response.token);
        return response;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Registration error:', error);
      return rejectWithValue(error.message || 'Registration failed. Please try again.');
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await AsyncStorage.removeItem('userToken');
  await AsyncStorage.removeItem('user');
  return null;
});

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('No token found in AsyncStorage');
        return null;
      }

      // In development, use mock API
      if (isDevelopment) {
        console.log('Using mock API for user data');
        try {
          const response = await mockApi.getUser();
          return response;
        } catch (mockError) {
          console.error('Mock API error:', mockError);
          // Fallback to a basic mock user if mock API fails
          return { 
            id: 'mock-user-id', 
            _id: 'mock-user-id',
            email: 'admin786@gmail.com', 
            name: 'Rizwan',
            phone: '031807371071',
            role: 'restaurant',
            kycStatus: 'pending',
            isEmailVerified: true,
            isPhoneVerified: true
          };
        }
      }

      // In production, call the real API
      console.log('Fetching user data from API');
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error in loadUser:', error);
      // In development, return a mock user on error
      if (isDevelopment) {
        console.log('Falling back to mock user due to error');
        return { 
          id: 'mock-user-id', 
          _id: 'mock-user-id',
          email: 'admin786@gmail.com', 
          name: 'Rizwan',
          phone: '031807371071',
          role: 'restaurant',
          kycStatus: 'pending',
          isEmailVerified: true,
          isPhoneVerified: true
        };
      }
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load user',
      );
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
  },
  reducers: {
    clearError: state => {
      state.error = null;
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(register.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.isLoading = false;
        state.error = null;
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
