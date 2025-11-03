// src/services/restaurantService.js
import api from './api';

const restaurantService = {
  async getMyRestaurant() {
    const res = await api.get('/restaurants');
    return res.data;
  },

  async getMenu(restaurantId) {
    const res = await api.get(`/restaurants/${restaurantId}/menu`);
    return res.data;
  },

  async addMenuItem(restaurantId, data) {
    const res = await api.post(`/restaurants/${restaurantId}/menu`, data);
    return res.data;
  },

  async updateMenuItem(restaurantId, itemId, data) {
    const res = await api.put(`/restaurants/${restaurantId}/menu/${itemId}`, data);
    return res.data;
  },

  async deleteMenuItem(restaurantId, itemId) {
    const res = await api.delete(`/restaurants/${restaurantId}/menu/${itemId}`);
    return res.data;
  },

  async getOrders(restaurantId) {
    const res = await api.get(`/restaurants/${restaurantId}/orders`);
    return res.data;
  },

  async acceptOrder(orderId) {
    const res = await api.put(`/orders/${orderId}/accept`);
    return res.data;
  },

  async rejectOrder(orderId, reason = 'Unable to fulfill order') {
    const res = await api.put(`/orders/${orderId}/reject`, { reason });
    return res.data;
  },

  async updateOrderStatus(orderId, status) {
    const res = await api.put(`/orders/${orderId}/status`, { status });
    return res.data;
  },
};

export default restaurantService;

