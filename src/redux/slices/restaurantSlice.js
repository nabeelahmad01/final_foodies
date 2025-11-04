// src/redux/slices/restaurantSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchRestaurants = createAsyncThunk(
  'restaurant/fetchRestaurants',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/restaurants');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch restaurants',
      );
    }
  },
);

export const fetchRestaurantById = createAsyncThunk(
  'restaurant/fetchRestaurantById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/restaurants/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch restaurant',
      );
    }
  },
);

export const searchRestaurants = createAsyncThunk(
  'restaurant/searchRestaurants',
  async (query, { rejectWithValue }) => {
    try {
      const response = await api.get(`/restaurants/search?q=${query}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  },
);

const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState: {
    restaurants: [],
    selectedRestaurant: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearSelectedRestaurant: state => {
      state.selectedRestaurant = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch Restaurants
      .addCase(fetchRestaurants.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle both direct array and object with restaurants property
        state.restaurants = action.payload?.restaurants || action.payload || [];
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Restaurant By ID
      .addCase(fetchRestaurantById.pending, state => {
        state.isLoading = true;
      })
      .addCase(fetchRestaurantById.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle both direct restaurant object and response with restaurant property
        state.selectedRestaurant = action.payload?.restaurant || action.payload;
        console.log('🏪 Restaurant fetched successfully:', {
          hasMenuItems: state.selectedRestaurant?.menuItems?.length || 0,
          restaurantName: state.selectedRestaurant?.name
        });
      })
      .addCase(fetchRestaurantById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Search Restaurants
      .addCase(searchRestaurants.fulfilled, (state, action) => {
        state.restaurants = action.payload;
      });
  },
});

export const { clearSelectedRestaurant } = restaurantSlice.actions;
export default restaurantSlice.reducer;
