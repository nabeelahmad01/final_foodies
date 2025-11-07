// src/components/LiveTrackingMap.js
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import MapComponent, { Marker, Polyline } from './MapComponent';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../styles/colors';
import { calculateDistance, formatDistance, calculateETA, formatETA } from '../utils/mapUtils';

const { width } = Dimensions.get('window');

const AnimatedDeliveryIcon = ({ rotation = 0, isMoving = false }) => {
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isMoving) {
      // Bounce animation when moving
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      bounceAnim.setValue(1);
    }
  }, [isMoving]);

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: rotation,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [rotation]);

  return (
    <Animated.View
      style={[
        styles.riderMarker,
        {
          transform: [
            { scale: bounceAnim },
            { rotate: rotateAnim.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              })
            }
          ],
        },
      ]}
    >
      <View style={styles.bikeContainer}>
        <Text style={styles.bikeEmoji}>🏍️</Text>
        <View style={styles.deliveryBox}>
          <Icon name="cube" size={8} color={colors.white} />
        </View>
      </View>
    </Animated.View>
  );
};

const RestaurantMarker = ({ name }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.markerContainer}>
      <Animated.View
        style={[
          styles.restaurantMarker,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <Icon name="restaurant" size={20} color={colors.white} />
      </Animated.View>
      <View style={styles.markerLabel}>
        <Text style={styles.markerLabelText}>{name || 'Restaurant'}</Text>
      </View>
    </View>
  );
};

const DeliveryMarker = ({ address }) => {
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
    <View style={styles.markerContainer}>
      <Animated.View
        style={[
          styles.deliveryMarker,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <Text style={styles.homeEmoji}>🏠</Text>
      </Animated.View>
      <View style={styles.markerLabel}>
        <Text style={styles.markerLabelText}>Your Location</Text>
      </View>
    </View>
  );
};

const LiveTrackingMap = ({
  restaurantLocation,
  deliveryLocation,
  riderLocation,
  orderStatus,
  restaurantName,
  deliveryAddress,
  onMapReady,
}) => {
  const mapRef = useRef(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const [riderRotation, setRiderRotation] = useState(0);

  // Calculate distance and ETA when rider location changes
  useEffect(() => {
    if (riderLocation && deliveryLocation) {
      const currentDistance = calculateDistance(
        riderLocation.latitude,
        riderLocation.longitude,
        deliveryLocation.latitude,
        deliveryLocation.longitude
      );
      
      const estimatedMinutes = calculateETA(currentDistance, 'cycling');
      
      setDistance(currentDistance);
      setEta(estimatedMinutes);
    }
  }, [riderLocation, deliveryLocation]);

  // Calculate bearing for rider rotation
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

  // Update rider rotation based on movement
  useEffect(() => {
    if (riderLocation && deliveryLocation) {
      const bearing = calculateBearing(riderLocation, deliveryLocation);
      setRiderRotation(bearing);
    }
  }, [riderLocation, deliveryLocation]);

  // Fit map to show all markers
  useEffect(() => {
    if (mapRef.current && restaurantLocation && deliveryLocation) {
      const coordinates = [restaurantLocation, deliveryLocation];
      if (riderLocation) {
        coordinates.push(riderLocation);
      }

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [restaurantLocation, deliveryLocation, riderLocation]);

  // Generate polyline coordinates
  const getPolylineCoordinates = () => {
    if (!riderLocation) return [];
    
    if (orderStatus === 'preparing' || orderStatus === 'accepted') {
      // Show route from rider to restaurant
      return [riderLocation, restaurantLocation];
    } else if (orderStatus === 'out_for_delivery') {
      // Show route from rider to delivery location
      return [riderLocation, deliveryLocation];
    }
    
    return [];
  };

  return (
    <View style={styles.container}>
      <MapComponent
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: restaurantLocation?.latitude || 31.5204,
          longitude: restaurantLocation?.longitude || 74.3587,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onMapReady={onMapReady}
      >
        {/* Restaurant Marker */}
        {restaurantLocation && (
          <Marker coordinate={restaurantLocation}>
            <RestaurantMarker name={restaurantName} />
          </Marker>
        )}

        {/* Delivery Location Marker */}
        {deliveryLocation && (
          <Marker coordinate={deliveryLocation}>
            <DeliveryMarker address={deliveryAddress} />
          </Marker>
        )}

        {/* Rider Marker */}
        {riderLocation && (
          <Marker coordinate={riderLocation}>
            <AnimatedDeliveryIcon
              rotation={riderRotation}
              isMoving={orderStatus === 'out_for_delivery'}
            />
          </Marker>
        )}

        {/* Route Polyline */}
        {getPolylineCoordinates().length > 1 && (
          <Polyline
            coordinates={getPolylineCoordinates()}
            strokeColor={colors.primary}
            strokeWidth={4}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapComponent>

      {/* Live Stats Overlay */}
      {riderLocation && orderStatus === 'out_for_delivery' && (
        <View style={styles.statsOverlay}>
          <View style={styles.statCard}>
            <Icon name="location" size={16} color={colors.primary} />
            <Text style={styles.statText}>
              {distance ? formatDistance(distance) : 'Calculating...'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="time" size={16} color={colors.success} />
            <Text style={styles.statText}>
              {eta ? formatETA(eta) : 'Calculating...'}
            </Text>
          </View>
        </View>
      )}

      {/* Status Badge */}
      <View style={styles.statusBadge}>
        <View style={[styles.statusDot, { 
          backgroundColor: orderStatus === 'out_for_delivery' ? colors.success : colors.warning 
        }]} />
        <Text style={styles.statusText}>
          {orderStatus === 'out_for_delivery' 
            ? 'Rider is on the way' 
            : orderStatus === 'preparing'
            ? 'Preparing your order'
            : orderStatus === 'accepted'
            ? 'Order confirmed'
            : 'Processing order'
          }
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
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
  homeEmoji: {
    fontSize: 20,
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
  bikeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bikeEmoji: {
    fontSize: 24,
  },
  deliveryBox: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
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
  statsOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 6,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
});

export default LiveTrackingMap;
