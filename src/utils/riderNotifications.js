// src/utils/riderNotifications.js
import io from 'socket.io-client';
import { API_URL } from './constants';
import { sendLocalNotification } from '../services/pushNotifications';

// Function to manually trigger rider notifications (for testing)
export const triggerRiderNotification = async (riderId, orderData) => {
  try {
    console.log('🔔 Triggering rider notification manually...');
    
    // Create socket connection
    const socket = io(API_URL.replace('/api', ''), {
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to server for notification trigger');
      
      // Emit new order notification to specific rider
      socket.emit('notifyRider', {
        riderId: riderId,
        orderData: {
          _id: orderData._id || 'test-order-123',
          restaurantName: orderData.restaurantName || 'Test Restaurant',
          totalAmount: orderData.totalAmount || 500,
          distance: orderData.distance || '2.5 km',
          deliveryAddress: orderData.deliveryAddress || 'Test Address',
          items: orderData.items || [{ name: 'Test Item', quantity: 1 }]
        }
      });

      // Also emit to all online riders
      socket.emit('newOrderAvailable', {
        _id: orderData._id || 'test-order-123',
        restaurantName: orderData.restaurantName || 'Test Restaurant',
        totalAmount: orderData.totalAmount || 500,
        distance: orderData.distance || '2.5 km',
        deliveryAddress: orderData.deliveryAddress || 'Test Address',
        items: orderData.items || [{ name: 'Test Item', quantity: 1 }]
      });

      console.log('📡 Notification emitted to rider:', riderId);
      
      // Disconnect after sending
      setTimeout(() => {
        socket.disconnect();
        console.log('🔌 Disconnected from notification server');
      }, 2000);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Failed to connect for notification:', error);
    });

  } catch (error) {
    console.error('❌ Error triggering rider notification:', error);
  }
};

// Function to broadcast new order to all online riders
export const broadcastNewOrder = async (orderData) => {
  try {
    console.log('📢 Broadcasting new order to all riders...');
    
    const socket = io(API_URL.replace('/api', ''), {
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('✅ Connected for order broadcast');
      
      // Broadcast to all online riders
      socket.emit('broadcastNewOrder', {
        orderId: orderData._id,
        restaurantId: orderData.restaurantId,
        restaurantName: orderData.restaurantName,
        totalAmount: orderData.totalAmount,
        deliveryAddress: orderData.deliveryAddress,
        customerLocation: orderData.deliveryCoordinates,
        restaurantLocation: orderData.restaurantLocation,
        items: orderData.items,
        estimatedDeliveryTime: orderData.estimatedDeliveryTime,
        createdAt: new Date().toISOString()
      });

      console.log('📡 Order broadcast sent');
      
      setTimeout(() => {
        socket.disconnect();
      }, 2000);
    });

  } catch (error) {
    console.error('❌ Error broadcasting order:', error);
  }
};

// Function to test rider notification system
export const testRiderNotificationSystem = async (riderId) => {
  console.log('🧪 Testing rider notification system...');
  
  const testOrderData = {
    _id: 'test-order-' + Date.now(),
    restaurantName: 'Pizza Palace',
    totalAmount: 750,
    distance: '1.8 km',
    deliveryAddress: 'Test Street, Test City',
    items: [
      { name: 'Margherita Pizza', quantity: 1, price: 500 },
      { name: 'Coca Cola', quantity: 2, price: 125 }
    ]
  };

  // Send local notification first
  await sendLocalNotification(
    '🧪 Test: New Order Available!',
    `${testOrderData.restaurantName} - Rs. ${testOrderData.totalAmount}`,
    { type: 'test_order', orderId: testOrderData._id }
  );

  // Then trigger socket notification
  await triggerRiderNotification(riderId, testOrderData);
  
  console.log('✅ Test notification sent');
};
