// ============================================
// FIREBASE PUSH NOTIFICATIONS SETUP
// ============================================

// 1. Install dependencies
// npm install expo-notifications firebase

// 2. src/services/pushNotifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export async function registerForPushNotifications() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push Token:', token);

    // Save token to backend
    try {
      await api.post('/users/push-token', { pushToken: token });
    } catch (error) {
      console.error('Failed to save push token:', error);
    }
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}

// Listen to notifications
export function setupNotificationListeners(navigation) {
  // Handle notification when app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification);
    }
  );

  // Handle notification tap
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;
      
      // Navigate based on notification type
      if (data.type === 'order') {
        navigation.navigate('OrderTracking', { orderId: data.orderId });
      } else if (data.type === 'restaurant_order') {
        navigation.navigate('RestaurantOrders', { restaurantId: data.restaurantId });
      } else if (data.type === 'delivery') {
        navigation.navigate('DeliveryScreen', { orderId: data.orderId });
      }
    }
  );

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

// Send local notification (for testing)
export async function sendLocalNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Send immediately
  });
}