// src/screens/user/OrderTrackingScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import MapComponent, { Marker, Polyline } from '../../components/MapComponent';
import MapErrorBoundary from '../../components/MapErrorBoundary';
import { RestaurantPin, RiderPin, DeliveryPin } from '../../components/CustomMapPins';
import { calculateDistance, formatDistance, calculateETA, formatETA, calculateBearing } from '../../utils/mapUtils';
import { trackOrder, updateOrderStatus } from '../../redux/slices/orderSlice';
import { ORDER_STATUS } from '../../utils/constants';
import colors from '../../styles/colors';
import io from 'socket.io-client';
import { API_URL } from '../../utils/constants';
import { Audio } from 'expo-audio';
import * as Location from 'expo-location';
import { initializeSound, playNotificationSound, cleanupSound } from '../../utils/soundUtils';

const OrderTrackingScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const dispatch = useDispatch();
  const { trackingOrder } = useSelector(state => state.order);
  const [socket, setSocket] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [orderStatus, setOrderStatus] = useState('pending');
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const mapRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bikeRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dispatch(trackOrder(orderId));
    initializeSound();
    startPulseAnimation();

    // Connect to Socket.IO for real-time updates
    const newSocket = io(API_URL.replace('/api', ''));
    setSocket(newSocket);

    newSocket.emit('joinOrder', orderId);

    // Listen for order status updates
    newSocket.on('orderUpdate', (data) => {
      console.log('Order update received:', data);
      dispatch(updateOrderStatus({ orderId: data.orderId, status: data.status }));
      setOrderStatus(data.status);
      playNotificationSound();
      
      if (data.status === 'accepted') {
        Alert.alert('Order Accepted! 🎉', 'Your order has been accepted by the restaurant.');
      } else if (data.status === 'out_for_delivery') {
        Alert.alert('On the Way! 🚴‍♂️', 'Your order is out for delivery.');
      }
    });

    // Listen for rider location updates
    newSocket.on('riderLocationUpdate', (data) => {
      console.log('Rider location update:', data);
      if (data.orderId === orderId) {
        setRiderLocation(data.location);
        setEstimatedTime(data.estimatedTime);
        animateRiderMovement(data.location);
      }
    });

    // Listen for rider assignment
    newSocket.on('riderAssigned', (data) => {
      console.log('Rider assigned:', data);
      if (data.orderId === orderId) {
        playNotificationSound();
        Alert.alert('Rider Assigned! 🚴‍♂️', `${data.riderName} will deliver your order.`);
      }
    });

    return () => {
      newSocket.disconnect();
      cleanupSound();
    };
  }, [dispatch, orderId]);

  // Start pulse animation for rider marker
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
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

  // Animate rider movement
  const animateRiderMovement = (newLocation) => {
    if (riderMarkerRef.current && riderLocation) {
      // Calculate bearing for bike rotation
      const bearing = calculateBearing(riderLocation, newLocation);
      
      Animated.timing(bikeRotation, {
        toValue: bearing,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Animate marker to new position
      riderMarkerRef.current.animateMarkerToCoordinate(newLocation, 500);
    }
  };

  // Calculate distance and ETA
  const updateDistanceAndETA = () => {
    if (!trackingOrder || !riderLocation) return;

    const deliveryCoords = {
      latitude: trackingOrder.deliveryCoordinates?.latitude,
      longitude: trackingOrder.deliveryCoordinates?.longitude,
    };

    if (deliveryCoords.latitude && deliveryCoords.longitude) {
      const currentDistance = calculateDistance(
        riderLocation.latitude,
        riderLocation.longitude,
        deliveryCoords.latitude,
        deliveryCoords.longitude
      );

      const estimatedMinutes = calculateETA(currentDistance, 'cycling');
      
      setDistance(currentDistance);
      setEta(estimatedMinutes);
    }
  };

  // Update distance and ETA when rider location changes
  useEffect(() => {
    updateDistanceAndETA();
  }, [riderLocation, trackingOrder]);

  // Calculate bearing between two coordinates
  const calculateBearing = (start, end) => {
    const startLat = start.latitude * (Math.PI / 180);
    const startLng = start.longitude * (Math.PI / 180);
    const endLat = end.latitude * (Math.PI / 180);
    const endLng = end.longitude * (Math.PI / 180);

    const dLng = endLng - startLng;
    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

    let bearing = Math.atan2(y, x) * (180 / Math.PI);
    return (bearing + 360) % 360;
  };

  // Format ETA display
  const formatETA = (minutes) => {
    if (!minutes) return 'Calculating...';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  };

  // Custom map style for app theme
  const customMapStyle = [
    {
      featureType: 'all',
      elementType: 'geometry.fill',
      stylers: [{ color: '#f8f9fa' }]
    },
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: colors.text }]
    },
    {
      featureType: 'all',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#ffffff' }, { weight: 2 }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: colors.border }, { weight: 1 }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: colors.primary + '20' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: colors.primary }, { weight: 2 }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: colors.primary + '30' }]
    },
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#f0f2f5' }]
    },
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [{ color: colors.secondary + '20' }]
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: colors.success + '30' }]
    },
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{ color: colors.warning + '20' }]
    }
  ];

  if (!trackingOrder) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Track Order</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingAnimation}>
            <Animated.View style={[styles.loadingDot, { transform: [{ scale: pulseAnim }] }]} />
            <Animated.View style={[styles.loadingDot, styles.loadingDot2, { transform: [{ scale: pulseAnim }] }]} />
            <Animated.View style={[styles.loadingDot, styles.loadingDot3, { transform: [{ scale: pulseAnim }] }]} />
          </View>
          <Text style={styles.loadingText}>🔍 Calculating delivery details...</Text>
          <Text style={styles.loadingSubtext}>Finding the best route for you</Text>
        </View>
      </View>
    );
  }

  const getStatusSteps = () => {
    const steps = [
      {
        key: ORDER_STATUS.PENDING,
        label: 'Order Placed',
        icon: 'checkmark-circle',
      },
      {
        key: ORDER_STATUS.ACCEPTED,
        label: 'Accepted',
        icon: 'checkmark-circle',
      },
      { key: ORDER_STATUS.PREPARING, label: 'Preparing', icon: 'restaurant' },
      {
        key: ORDER_STATUS.OUT_FOR_DELIVERY,
        label: 'Out for Delivery',
        icon: 'bicycle',
      },
      { key: ORDER_STATUS.DELIVERED, label: 'Delivered', icon: 'gift' },
    ];

    const currentIndex = steps.findIndex(s => s.key === trackingOrder.status);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  const handleCallRider = () => {
    if (trackingOrder.riderId?.phone) {
      Linking.openURL(`tel:${trackingOrder.riderId.phone}`);
    }
  };

  const restaurantLocation = {
    latitude: 31.5204,
    longitude: 74.3587,
  };

  const deliveryLocation = {
    latitude: 31.4697,
    longitude: 74.2728,
  };

  return (
    <View style={styles.container}>
      {/* Header with Status */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Track Order</Text>
          <Text style={styles.headerSubtitle}>
            {orderStatus === 'pending' && 'Waiting for restaurant confirmation'}
            {orderStatus === 'accepted' && '✅ Order Accepted! Restaurant is preparing'}
            {orderStatus === 'preparing' && '👨‍🍳 Your order is being prepared'}
            {orderStatus === 'looking_for_rider' && '🔍 Finding nearby rider for delivery'}
            {orderStatus === 'out_for_delivery' && '🚴‍♂️ Rider is on the way to you'}
            {orderStatus === 'delivered' && 'Order delivered successfully!'}
          </Text>
        </View>
        <View style={styles.etaContainer}>
          <Text style={styles.etaText}>{formatETA(estimatedTime)}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Enhanced Map View */}
        <View style={styles.mapContainer}>
          <MapErrorBoundary>
            <MapComponent
              ref={mapRef}
              style={styles.map}
              customMapStyle={customMapStyle}
              initialRegion={{
                latitude: trackingOrder.deliveryCoordinates?.latitude || 31.4952,
                longitude: trackingOrder.deliveryCoordinates?.longitude || 74.3157,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              longitude: trackingOrder.deliveryCoordinates?.longitude || 74.3157,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={false}
            toolbarEnabled={false}
          >
            {/* Restaurant Marker */}
            <Marker
              coordinate={{
                latitude: trackingOrder.restaurantId?.location?.coordinates?.[1] || restaurantLocation.latitude,
                longitude: trackingOrder.restaurantId?.location?.coordinates?.[0] || restaurantLocation.longitude,
              }}
              title={trackingOrder.restaurantId?.name || "Restaurant"}
              description="Your order is being prepared here"
            >
              <RestaurantPin 
                restaurant={trackingOrder.restaurantId} 
                isSelected={orderStatus === 'preparing' || orderStatus === 'accepted'}
              />
            </Marker>

            {/* Delivery Location Marker */}
            <Marker
              coordinate={{
                latitude: trackingOrder.deliveryCoordinates?.latitude || deliveryLocation.latitude,
                longitude: trackingOrder.deliveryCoordinates?.longitude || deliveryLocation.longitude,
              }}
              title="Delivery Location"
              description="Your order will be delivered here"
            >
              <DeliveryPin address={trackingOrder.deliveryAddress} />
            </Marker>

            {/* Animated Rider Marker */}
            {riderLocation && (
              <Marker
                ref={riderMarkerRef}
                coordinate={riderLocation}
                title={trackingOrder.riderId?.name || "Delivery Rider"}
                description="Your delivery rider"
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <RiderPin 
                  rider={trackingOrder.riderId}
                  isMoving={orderStatus === 'out_for_delivery'}
                  rotation={bikeRotation._value}
                />
              </Marker>
            )}

            {/* Enhanced Route Polyline */}
            {riderLocation && (
              <>
                {/* Route Shadow */}
                <Polyline
                  coordinates={[
                    orderStatus === 'out_for_delivery' 
                      ? riderLocation 
                      : {
                          latitude: trackingOrder.restaurantId?.location?.coordinates?.[1] || restaurantLocation.latitude,
                          longitude: trackingOrder.restaurantId?.location?.coordinates?.[0] || restaurantLocation.longitude,
                        },
                    {
                      latitude: trackingOrder.deliveryCoordinates?.latitude || deliveryLocation.latitude,
                      longitude: trackingOrder.deliveryCoordinates?.longitude || deliveryLocation.longitude,
                    }
                  ]}
                  strokeColor="rgba(0, 0, 0, 0.2)"
                  strokeWidth={8}
                  lineCap="round"
                  lineJoin="round"
                />
                {/* Main Route */}
                <Polyline
                  coordinates={[
                    orderStatus === 'out_for_delivery' 
                      ? riderLocation 
                      : {
                          latitude: trackingOrder.restaurantId?.location?.coordinates?.[1] || restaurantLocation.latitude,
                          longitude: trackingOrder.restaurantId?.location?.coordinates?.[0] || restaurantLocation.longitude,
                        },
                    {
                      latitude: trackingOrder.deliveryCoordinates?.latitude || deliveryLocation.latitude,
                      longitude: trackingOrder.deliveryCoordinates?.longitude || deliveryLocation.longitude,
                    }
                  ]}
                  strokeColor={orderStatus === 'out_for_delivery' ? colors.warning : colors.primary}
                  strokeWidth={5}
                  strokePattern={orderStatus === 'out_for_delivery' ? [10, 5] : undefined}
                  lineCap="round"
                  lineJoin="round"
                />
              </>
            )}
          </MapComponent>
          </MapErrorBoundary>
          
          {/* Map Overlay - Order Status */}
          <View style={styles.mapOverlay}>
            <View style={styles.statusBadge}>
              <Icon 
                name={
                  orderStatus === 'pending' ? 'time' :
                  orderStatus === 'accepted' ? 'checkmark-circle' :
                  orderStatus === 'preparing' ? 'restaurant' :
                  orderStatus === 'out_for_delivery' ? 'bicycle' : 'checkmark-done-circle'
                } 
                size={16} 
                color={colors.white} 
              />
              <Text style={styles.statusText}>
                {orderStatus === 'pending' && 'Order Placed'}
                {orderStatus === 'accepted' && 'Accepted'}
                {orderStatus === 'preparing' && 'Preparing'}
                {orderStatus === 'out_for_delivery' && 'On the Way'}
                {orderStatus === 'delivered' && 'Delivered'}
              </Text>
            </View>
            
            {/* Distance and ETA Display */}
            {riderLocation && orderStatus === 'out_for_delivery' && (
              <View style={styles.etaContainer}>
                <View style={styles.etaBadge}>
                  <Icon name="location" size={14} color={colors.primary} />
                  <Text style={styles.etaText}>
                    {distance ? formatDistance(distance) : 'Calculating...'}
                  </Text>
                </View>
                <View style={styles.etaBadge}>
                  <Icon name="time" size={14} color={colors.success} />
                  <Text style={styles.etaText}>
                    {eta ? formatETA(eta) : 'Calculating...'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Order Status Timeline */}
        <View style={styles.timelineContainer}>
          {getStatusSteps().map((step, index) => (
            <View key={step.key} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.timelineIcon,
                    step.completed && styles.timelineIconCompleted,
                    step.active && styles.timelineIconActive,
                  ]}
                >
                  <Icon
                    name={step.icon}
                    size={20}
                    color={step.completed ? colors.white : colors.gray}
                  />
                </View>
                {index < getStatusSteps().length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      step.completed && styles.timelineLineCompleted,
                    ]}
                  />
                )}
              </View>
              <View style={styles.timelineRight}>
                <Text
                  style={[
                    styles.timelineLabel,
                    step.active && styles.timelineLabelActive,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Order Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Order Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID:</Text>
            <Text style={styles.detailValue}>
              #{trackingOrder._id.slice(-6)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Restaurant:</Text>
            <Text style={styles.detailValue}>
              {trackingOrder.restaurantId?.name || 'Restaurant'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Amount:</Text>
            <Text style={styles.detailValue}>
              Rs. {trackingOrder.totalAmount}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Items:</Text>
            <Text style={styles.detailValue}>
              {trackingOrder.items?.length || 0} items
            </Text>
          </View>
        </View>

        {/* Enhanced Rider Info */}
        {trackingOrder.riderId && (
          <View style={styles.riderCard}>
            <View style={styles.riderHeader}>
              <View style={styles.riderInfo}>
                <View style={styles.riderAvatar}>
                  <Icon name="person" size={24} color={colors.white} />
                </View>
                <View style={styles.riderDetails}>
                  <Text style={styles.riderName}>
                    {trackingOrder.riderId.name || 'Delivery Rider'}
                  </Text>
                  <Text style={styles.riderVehicle}>🏍️ Motorcycle • ABC-123</Text>
                  <Text style={styles.riderETA}>ETA: {formatETA(estimatedTime)}</Text>
                </View>
              </View>
              <View style={styles.riderActions}>
                <TouchableOpacity
                  style={styles.riderActionButton}
                  onPress={handleCallRider}
                >
                  <Icon name="call" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.riderActionButton}
                  onPress={() =>
                    navigation.navigate('ChatScreen', {
                      orderId: trackingOrder._id,
                      receiverName: trackingOrder.riderId?.name || 'Rider',
                    })
                  }
                >
                  <Icon name="chatbubble" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Live Tracking Status */}
            <View style={styles.trackingStatus}>
              <Animated.View 
                style={[
                  styles.trackingDot, 
                  { 
                    transform: [{ scale: pulseAnim }],
                    backgroundColor: orderStatus === 'out_for_delivery' ? colors.success : colors.warning
                  }
                ]} 
              />
              <Text style={styles.trackingText}>
                {orderStatus === 'out_for_delivery' 
                  ? '🔴 Live tracking active • Rider is moving' 
                  : orderStatus === 'preparing'
                  ? '🟡 Rider will be assigned soon'
                  : orderStatus === 'accepted'
                  ? '🟢 Order confirmed • Preparing your food'
                  : orderStatus === 'looking_for_rider'
                  ? '🔍 Finding the best rider for you'
                  : '⏳ Waiting for restaurant confirmation'
                }
              </Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="call" size={20} color={colors.primary} />
            <Text style={styles.actionText}>Call Restaurant</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="help-circle" size={20} color={colors.primary} />
            <Text style={styles.actionText}>Need Help?</Text>
          </TouchableOpacity>
        </View>

        {/* Review Button - Show when order is delivered */}
        {orderStatus === 'delivered' && (
          <View style={styles.reviewSection}>
            <TouchableOpacity 
              style={styles.reviewButton}
              onPress={() => navigation.navigate('ReviewScreen', { order: trackingOrder })}
            >
              <Icon name="star" size={20} color={colors.white} />
              <Text style={styles.reviewButtonText}>Rate Your Experience</Text>
            </TouchableOpacity>
            <Text style={styles.reviewSubtext}>
              Help others by sharing your feedback about the food and delivery service
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  etaContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  etaText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingAnimation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginHorizontal: 4,
  },
  loadingDot2: {
    backgroundColor: colors.secondary,
    animationDelay: '0.2s',
  },
  loadingDot3: {
    backgroundColor: colors.warning,
    animationDelay: '0.4s',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  mapContainer: {
    height: 300,
    backgroundColor: colors.lightGray,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'column',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
    marginLeft: 8,
  },
  etaContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  timelineContainer: {
    backgroundColor: colors.white,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineIconCompleted: {
    backgroundColor: colors.success,
  },
  timelineIconActive: {
    backgroundColor: colors.primary,
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: colors.border,
  },
  timelineLineCompleted: {
    backgroundColor: colors.success,
  },
  timelineRight: {
    flex: 1,
    paddingTop: 8,
  },
  timelineLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  timelineLabelActive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  detailsCard: {
    backgroundColor: colors.white,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  riderCard: {
    backgroundColor: colors.white,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  riderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  riderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  riderVehicle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  riderETA: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  riderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  riderActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 8,
  },
  trackingText: {
    fontSize: 12,
    color: colors.text.secondary,
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  reviewSection: {
    marginHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 12,
  },
  reviewButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginLeft: 8,
  },
  reviewSubtext: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 16,
  },
});

export default OrderTrackingScreen;
