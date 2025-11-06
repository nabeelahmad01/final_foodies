// src/components/GlobalNotification.js
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import colors from '../styles/colors';
import { API_URL } from '../utils/constants';

const { width } = Dimensions.get('window');

const GlobalNotification = () => {
  const { user } = useSelector(state => state.auth);
  const navigation = useNavigation();
  const [notification, setNotification] = useState(null);
  const [socket, setSocket] = useState(null);
  const slideAnim = useState(new Animated.Value(-100))[0];
  const [sound, setSound] = useState();

  useEffect(() => {
    if (user?._id) {
      setupSocket();
    }
    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [user?._id]);

  const setupSocket = () => {
    const socketUrl = API_URL.replace('/api', '');
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('🔔 Global notification socket connected');
      // Join user-specific room
      if (user.role === 'rider') {
        newSocket.emit('join', `rider_${user._id}`);
      } else if (user.role === 'restaurant') {
        newSocket.emit('join', `restaurant_${user._id}`);
      }
    });

    // Listen for new order notifications (for riders)
    newSocket.on('newOrderAvailable', (data) => {
      console.log('🔔 New order notification:', data);
      showNotification({
        title: '🚴‍♂️ New Delivery Available!',
        message: `${data.restaurantName} - Rs.${data.totalAmount}`,
        type: 'rider_order',
        data: data,
        action: () => {
          navigation.navigate('RiderDashboard');
          hideNotification();
        }
      });
      playNotificationSound();
    });

    // Listen for new order notifications (for restaurants)
    newSocket.on('newOrder', (data) => {
      console.log('🔔 New restaurant order:', data);
      showNotification({
        title: '🍽️ New Order Received!',
        message: `Order #${data.orderId?.slice(-6)} - Rs.${data.totalAmount}`,
        type: 'restaurant_order',
        data: data,
        action: () => {
          navigation.navigate('RestaurantDashboard');
          hideNotification();
        }
      });
      playNotificationSound();
    });

    // Listen for delivery acceptance (for restaurants)
    newSocket.on('deliveryAccepted', (data) => {
      if (user.role === 'restaurant') {
        showNotification({
          title: '✅ Delivery Accepted!',
          message: `Rider is on the way for order #${data.orderId?.slice(-6)}`,
          type: 'delivery_accepted',
          data: data,
        });
      } else if (user.role === 'rider') {
        showNotification({
          title: '🎉 Delivery Accepted!',
          message: data.message,
          type: 'delivery_confirmed',
          data: data,
          action: () => {
            navigation.navigate('RiderDelivery', { orderId: data.orderId });
            hideNotification();
          }
        });
      }
      playNotificationSound();
    });

    // Listen for order status updates
    newSocket.on('orderUpdate', (data) => {
      console.log('🔔 Order update notification:', data);
      let title = '📦 Order Update';
      let message = `Order status: ${data.status}`;
      
      switch (data.status) {
        case 'accepted':
          title = '✅ Order Accepted!';
          message = 'Restaurant is preparing your order';
          break;
        case 'preparing':
          title = '👨‍🍳 Order Being Prepared';
          message = 'Your food is being cooked';
          break;
        case 'ready':
          title = '🍽️ Order Ready!';
          message = 'Waiting for rider pickup';
          break;
        case 'out_for_delivery':
          title = '🚴‍♂️ Out for Delivery';
          message = 'Rider is on the way';
          break;
        case 'delivered':
          title = '🎉 Order Delivered!';
          message = 'Enjoy your meal!';
          break;
      }

      showNotification({
        title,
        message,
        type: 'order_update',
        data: data,
      });
    });

    setSocket(newSocket);
  };

  const playNotificationSound = async () => {
    try {
      // Try to play notification sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' }, // Online sound as fallback
        { shouldPlay: true, volume: 0.8 }
      );
      setSound(sound);
    } catch (error) {
      console.log('Could not play notification sound:', error);
      // Fallback to vibration
      try {
        const { Haptics } = require('expo-haptics');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (hapticError) {
        console.log('Could not vibrate:', hapticError);
      }
    }
  };

  const showNotification = (notificationData) => {
    setNotification(notificationData);
    
    // Slide down animation
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(15000), // Show for 5 seconds
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setNotification(null);
    });
  };

  const hideNotification = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setNotification(null);
    });
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'rider_order':
        return colors.primary;
      case 'restaurant_order':
        return colors.success;
      case 'delivery_accepted':
      case 'delivery_confirmed':
        return colors.warning;
      case 'order_update':
        return colors.secondary;
      default:
        return colors.primary;
    }
  };

  if (!notification) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: getNotificationColor(notification.type),
        },
      ]}
    >
      <TouchableOpacity
        style={styles.notificationContent}
        onPress={notification.action || hideNotification}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Icon name="notifications" size={24} color={colors.white} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={hideNotification}
        >
          <Icon name="close" size={20} color={colors.white} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 50, // Account for status bar
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default GlobalNotification;
