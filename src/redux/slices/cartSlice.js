// src/redux/slices/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    restaurantId: null,
    restaurantName: null,
    totalAmount: 0,
  },
  reducers: {
    addToCart: (state, action) => {
      const { item, restaurant } = action.payload;

      // Check if cart has items from different restaurant
      if (state.restaurantId && state.restaurantId !== restaurant.id) {
        // Clear cart and start fresh
        state.items = [];
      }

      state.restaurantId = restaurant.id;
      state.restaurantName = restaurant.name;

      const existingItem = state.items.find(i => i.id === item.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...item, quantity: 1 });
      }

      state.totalAmount = state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );
    },
    removeFromCart: (state, action) => {
      const itemId = action.payload;
      const existingItem = state.items.find(i => i.id === itemId);

      if (existingItem) {
        if (existingItem.quantity === 1) {
          state.items = state.items.filter(i => i.id !== itemId);
        } else {
          existingItem.quantity -= 1;
        }
      }

      state.totalAmount = state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );

      // Clear restaurant info if cart is empty
      if (state.items.length === 0) {
        state.restaurantId = null;
        state.restaurantName = null;
      }
    },
    clearCart: state => {
      state.items = [];
      state.restaurantId = null;
      state.restaurantName = null;
      state.totalAmount = 0;
    },
    updateQuantity: (state, action) => {
      const { itemId, quantity } = action.payload;
      const item = state.items.find(i => i.id === itemId);

      if (item && quantity > 0) {
        item.quantity = quantity;
      } else if (quantity === 0) {
        state.items = state.items.filter(i => i.id !== itemId);
      }

      state.totalAmount = state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );
    },
  },
});

export const { addToCart, removeFromCart, clearCart, updateQuantity } =
  cartSlice.actions;
export default cartSlice.reducer;
