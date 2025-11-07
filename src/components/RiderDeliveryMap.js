// src/components/RiderDeliveryMap.js
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import MapComponent, { Marker, Polyline } from './MapComponent';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../styles/colors';
import { calculateDistance, formatDistance, calculateETA, formatETA } from '../utils/mapUtils';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

const RiderLocationMarker = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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
  }, []);

  return (
    <Animated.View
      style={[
        styles.riderMarker,
        { transform: [{ scale: pulseAnim }] },
      ]}
    >
      <Icon name="person" size={20} color={colors.white} />
      <View style={styles.riderDot} />
    </Animated.View>
  );
};

const CustomerMarker = ({ customerName }) => {
  return (
    <View style={styles.markerContainer}>
      <View style={styles.customerMarker}>
        <Text style={styles.homeEmoji}>🏠</Text>
      </View>
      <View style={styles.markerLabel}>
        <Text style={styles.markerLabelText}>{customerName || 'Customer'}</Text>
      </View>
    </View>
  );
};

const RestaurantMarker = ({ restaurantName }) => {
  return (
    <View style={styles.markerContainer}>
      <View style={styles.restaurantMarker}>
        <Icon name="restaurant" size={20} color={colors.white} />
      </View>
      <View style={styles.markerLabel}>
        <Text style={styles.markerLabelText}>{restaurantName || 'Restaurant'}</Text>
      </View>
    </View>
  );
};

const RiderDeliveryMap = ({
  order,
  riderLocation,
  onLocationUpdate,
  showNavigateButton = false,
}) => {
  const mapRef = useRef(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  // Get destination based on order status
  const getDestination = () => {
    if (!order) return null;
    
    if (order.status === 'accepted' || order.status === 'preparing') {
      // Going to restaurant
      return {
        latitude: order.restaurantId?.location?.coordinates?.[1],
        longitude: order.restaurantId?.location?.coordinates?.[0],
        name: order.restaurantId?.name,
        type: 'restaurant'
      };
    } else if (order.status === 'ready_for_pickup' || order.status === 'out_for_delivery') {
      // Going to customer
      return {
        latitude: order.deliveryCoordinates?.latitude,
        longitude: order.deliveryCoordinates?.longitude,
        name: order.customerName || 'Customer',
        type: 'customer'
      };
    }
    
    return null;
  };

  const destination = getDestination();

  // Calculate distance and ETA
  useEffect(() => {
    if (riderLocation && destination) {
      const currentDistance = calculateDistance(
        riderLocation.latitude,
        riderLocation.longitude,
        destination.latitude,
        destination.longitude
      );
      
      const estimatedMinutes = calculateETA(currentDistance, 'cycling');
      
      setDistance(currentDistance);
      setEta(estimatedMinutes);
    }
  }, [riderLocation, destination]);

  // Fit map to show rider and destination
  useEffect(() => {
    if (mapRef.current && riderLocation && destination) {
      const coordinates = [riderLocation, destination];
      
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
        animated: true,
      });
    }
  }, [riderLocation, destination]);

  // Start location tracking
  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for delivery tracking.');
        return;
      }

      setIsTracking(true);
      
      // Watch position with high accuracy
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          const newLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          onLocationUpdate && onLocationUpdate(newLocation);
        }
      );

      return () => {
        subscription.remove();
        setIsTracking(false);
      };
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setIsTracking(false);
    }
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    setIsTracking(false);
  };

  if (!order || !destination) {
    return (
      <View style={styles.container}>
        <View style={styles.noOrderContainer}>
          <Icon name="map" size={60} color={colors.lightGray} />
          <Text style={styles.noOrderText}>No active delivery</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapComponent
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: riderLocation?.latitude || destination.latitude,
          longitude: riderLocation?.longitude || destination.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={false}
        followsUserLocation={false}
      >
        {/* Rider Location Marker */}
        {riderLocation && (
          <Marker coordinate={riderLocation}>
            <RiderLocationMarker />
          </Marker>
        )}

        {/* Destination Marker */}
        <Marker coordinate={destination}>
          {destination.type === 'restaurant' ? (
            <RestaurantMarker restaurantName={destination.name} />
          ) : (
            <CustomerMarker customerName={destination.name} />
          )}
        </Marker>

        {/* Route Polyline */}
        {riderLocation && (
          <Polyline
            coordinates={[riderLocation, destination]}
            strokeColor={colors.primary}
            strokeWidth={4}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapComponent>

      {/* Delivery Info Overlay */}
      <View style={styles.infoOverlay}>
        <View style={styles.destinationCard}>
          <View style={styles.destinationHeader}>
            <Icon 
              name={destination.type === 'restaurant' ? 'restaurant' : 'home'} 
              size={20} 
              color={colors.primary} 
            />
            <Text style={styles.destinationTitle}>
              {destination.type === 'restaurant' ? 'Pick up from' : 'Deliver to'}
            </Text>
          </View>
          <Text style={styles.destinationName}>{destination.name}</Text>
          
          {distance && eta && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Icon name="location" size={16} color={colors.success} />
                <Text style={styles.statText}>{formatDistance(distance)}</Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="time" size={16} color={colors.warning} />
                <Text style={styles.statText}>{formatETA(eta)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Order Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>
            {order.status === 'accepted' && '📋 Go to restaurant to pick up order'}
            {order.status === 'preparing' && '⏳ Order is being prepared'}
            {order.status === 'ready_for_pickup' && '✅ Order ready - Pick up now'}
            {order.status === 'out_for_delivery' && '🚴‍♂️ Deliver to customer'}
          </Text>
        </View>
      </View>

      {/* Location Tracking Controls */}
      <View style={styles.trackingControls}>
        {!isTracking ? (
          <TouchableOpacity 
            style={styles.trackingButton}
            onPress={startLocationTracking}
          >
            <Icon name="navigate" size={20} color={colors.white} />
            <Text style={styles.trackingButtonText}>Start Live Tracking</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.trackingButton, styles.trackingButtonActive]}
            onPress={stopLocationTracking}
          >
            <Icon name="stop" size={20} color={colors.white} />
            <Text style={styles.trackingButtonText}>Stop Tracking</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  noOrderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
  },
  noOrderText: {
    fontSize: 18,
    color: colors.textLight,
    marginTop: 16,
  },
  markerContainer: {
    alignItems: 'center',
  },
  riderMarker: {
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
  riderDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  customerMarker: {
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
  restaurantMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  homeEmoji: {
    fontSize: 20,
  },
  markerLabel: {
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  markerLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  infoOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  destinationCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  destinationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  destinationTitle: {
    fontSize: 14,
    color: colors.textLight,
    marginLeft: 8,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 6,
  },
  statusCard: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
  trackingControls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  trackingButtonActive: {
    backgroundColor: colors.error,
  },
  trackingButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginLeft: 8,
  },
});

export default RiderDeliveryMap;
