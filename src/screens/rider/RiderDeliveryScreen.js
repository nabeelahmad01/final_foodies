// src/screens/rider/RiderDeliveryScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import MapComponent, { Marker, Polyline } from '../../components/MapComponent';
import { RestaurantPin, RiderPin, DeliveryPin } from '../../components/CustomMapPins';
import RiderDeliveryMap from '../../components/RiderDeliveryMap';
import { calculateDistance, formatDistance, calculateETA, formatETA } from '../../utils/mapUtils';
import colors from '../../styles/colors';
import api from '../../services/api';
import * as Location from 'expo-location';
import io from 'socket.io-client';
import { API_URL } from '../../utils/constants';

const RiderDeliveryScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const { user } = useSelector(state => state.auth);
  const [order, setOrder] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [socket, setSocket] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState('picked_up');
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const mapRef = useRef(null);

  useEffect(() => {
    fetchOrderDetails();
    getCurrentLocation();
    setupSocket();
    startLocationTracking();
    startPulseAnimation();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data.order);
    } catch (error) {
      console.error('Error fetching order:', error);
      Alert.alert('Error', 'Failed to load order details');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed for delivery tracking');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const setupSocket = () => {
    const newSocket = io(API_URL.replace('/api', ''));
    setSocket(newSocket);
    
    newSocket.emit('joinOrder', orderId);
    newSocket.emit('riderOnline', { riderId: user._id, orderId });
  };

  const startLocationTracking = () => {
    const locationInterval = setInterval(async () => {
      try {
        const location = await Location.getCurrentPositionAsync({});
        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        setCurrentLocation(newLocation);
        
        // Update location on server
        await api.put(`/orders/${orderId}/rider-location`, {
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
        });
      } catch (error) {
        console.error('Error updating location:', error);
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(locationInterval);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Calculate distance and ETA to delivery location
  const updateDistanceAndETA = () => {
    if (!order || !currentLocation) return;

    const deliveryCoords = {
      latitude: order.deliveryCoordinates?.latitude,
      longitude: order.deliveryCoordinates?.longitude,
    };

    if (deliveryCoords.latitude && deliveryCoords.longitude) {
      const currentDistance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        deliveryCoords.latitude,
        deliveryCoords.longitude
      );

      const estimatedMinutes = calculateETA(currentDistance, 'cycling');
      
      setDistance(currentDistance);
      setEta(estimatedMinutes);
    }
  };

  // Update distance and ETA when location changes
  useEffect(() => {
    updateDistanceAndETA();
  }, [currentLocation, order]);

  const updateDeliveryStatus = async (status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      setDeliveryStatus(status);
      
      // Emit socket event
      if (socket) {
        socket.emit('orderUpdate', {
          orderId,
          status,
          riderId: user._id,
        });
      }

      // Show success message
      const statusMessages = {
        'picked_up': 'Order picked up from restaurant',
        'on_the_way': 'On the way to delivery location',
        'arrived': 'Arrived at delivery location',
        'delivered': 'Order delivered successfully',
      };

      Alert.alert('Status Updated', statusMessages[status]);

      if (status === 'delivered') {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update delivery status');
    }
  };

  const callCustomer = () => {
    if (order?.userId?.phone) {
      Linking.openURL(`tel:${order.userId.phone}`);
    }
  };

  const getStatusButtons = () => {
    const buttons = [
      {
        key: 'picked_up',
        label: 'Picked Up',
        icon: 'checkmark-circle',
        color: colors.success,
        description: 'Order collected from restaurant',
      },
      {
        key: 'on_the_way',
        label: 'On the Way',
        icon: 'bicycle',
        color: colors.primary,
        description: 'Heading to delivery location',
      },
      {
        key: 'arrived',
        label: 'Arrived',
        icon: 'location',
        color: colors.warning,
        description: 'Reached delivery location',
      },
      {
        key: 'delivered',
        label: 'Delivered',
        icon: 'gift',
        color: colors.success,
        description: 'Order delivered to customer',
      },
    ];

    return buttons;
  };

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={[styles.loadingDot, { transform: [{ scale: pulseAnim }] }]} />
        <Text style={styles.loadingText}>Loading delivery details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Delivery in Progress</Text>
          <Text style={styles.headerSubtitle}>Order #{order._id.slice(-6)}</Text>
        </View>
        <TouchableOpacity style={styles.callButton} onPress={callCustomer}>
          <Icon name="call" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Enhanced Delivery Map */}
      <RiderDeliveryMap
        order={order}
        riderLocation={currentLocation}
        onLocationUpdate={(location) => {
          setCurrentLocation(location);
          // Emit location update to customers
          if (socket) {
            socket.emit('riderLocationUpdate', {
              orderId: order._id,
              location,
              estimatedTime: eta,
            });
          }
        }}
      />

      {/* Order Details */}
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderTitle}>Delivery Details</Text>
          <View style={styles.amountBadge}>
            <Text style={styles.amountText}>Rs. {order.totalAmount}</Text>
          </View>
        </View>
        
        <View style={styles.orderInfo}>
          <View style={styles.infoRow}>
            <Icon name="location" size={16} color={colors.text.secondary} />
            <Text style={styles.infoText}>{order.deliveryAddress}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="person" size={16} color={colors.text.secondary} />
            <Text style={styles.infoText}>{order.userId?.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="call" size={16} color={colors.text.secondary} />
            <Text style={styles.infoText}>{order.userId?.phone}</Text>
          </View>
        </View>

        {/* Distance and ETA Display */}
        {currentLocation && (
          <View style={styles.deliveryStats}>
            <View style={styles.statItem}>
              <Icon name="navigate" size={20} color={colors.primary} />
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>
                {distance ? formatDistance(distance) : 'Calculating...'}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="time" size={20} color={colors.success} />
              <Text style={styles.statLabel}>ETA</Text>
              <Text style={styles.statValue}>
                {eta ? formatETA(eta) : 'Calculating...'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Status Update Buttons */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Update Delivery Status</Text>
        <View style={styles.statusButtons}>
          {getStatusButtons().map((button) => (
            <TouchableOpacity
              key={button.key}
              style={[
                styles.statusButton,
                deliveryStatus === button.key && styles.statusButtonActive,
                { borderColor: button.color }
              ]}
              onPress={() => updateDeliveryStatus(button.key)}
              disabled={deliveryStatus === button.key}
            >
              <Icon 
                name={button.icon} 
                size={24} 
                color={deliveryStatus === button.key ? colors.white : button.color} 
              />
              <Text style={[
                styles.statusButtonText,
                deliveryStatus === button.key && styles.statusButtonTextActive
              ]}>
                {button.label}
              </Text>
              <Text style={[
                styles.statusButtonDescription,
                deliveryStatus === button.key && styles.statusButtonDescriptionActive
              ]}>
                {button.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: 250,
    backgroundColor: colors.lightGray,
  },
  map: {
    flex: 1,
  },
  restaurantMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  deliveryMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  riderMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  orderCard: {
    backgroundColor: colors.white,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  amountBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  orderInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  deliveryStats: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  statusContainer: {
    backgroundColor: colors.white,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  statusButtons: {
    gap: 12,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: colors.background,
  },
  statusButtonActive: {
    backgroundColor: colors.primary,
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  statusButtonTextActive: {
    color: colors.white,
  },
  statusButtonDescription: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 12,
  },
  statusButtonDescriptionActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default RiderDeliveryScreen;
