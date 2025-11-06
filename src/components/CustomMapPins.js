// src/components/CustomMapPins.js
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../styles/colors';

// Restaurant Pin Component
export const RestaurantPin = ({ restaurant, isSelected = false }) => {
  return (
    <View style={styles.pinContainer}>
      <View style={[styles.restaurantPin, isSelected && styles.selectedPin]}>
        <View style={styles.restaurantIconContainer}>
          <Icon name="restaurant" size={18} color={colors.white} />
        </View>
        <View style={styles.pinShadow} />
      </View>
      <View style={styles.pinArrow} />
      {restaurant?.name && (
        <View style={styles.restaurantLabel}>
          <Text style={styles.restaurantLabelText} numberOfLines={1}>
            {restaurant.name}
          </Text>
        </View>
      )}
    </View>
  );
};

// Rider Pin Component with Animation
export const RiderPin = ({ rider, isMoving = false, rotation = 0 }) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isMoving) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isMoving, pulseAnim]);

  return (
    <View style={styles.pinContainer}>
      <Animated.View 
        style={[
          styles.riderPin,
          {
            transform: [
              { scale: pulseAnim },
              { rotate: `${rotation}deg` }
            ]
          }
        ]}
      >
        <View style={styles.riderBackground}>
          {/* Bike Icon */}
          <View style={styles.bikeContainer}>
            <Icon name="bicycle" size={16} color={colors.white} />
          </View>
          {/* Rider Person */}
          <View style={styles.riderPersonContainer}>
            <Icon name="person" size={12} color={colors.white} />
          </View>
        </View>
        <View style={styles.riderPinShadow} />
        {/* Movement Trail Effect */}
        {isMoving && (
          <View style={styles.movementTrail}>
            <View style={[styles.trailDot, { opacity: 0.6 }]} />
            <View style={[styles.trailDot, { opacity: 0.4 }]} />
            <View style={[styles.trailDot, { opacity: 0.2 }]} />
          </View>
        )}
      </Animated.View>
      <View style={styles.riderPinArrow} />
      {rider?.name && (
        <View style={styles.riderLabel}>
          <Text style={styles.riderLabelText} numberOfLines={1}>
            🏍️ {rider.name}
          </Text>
        </View>
      )}
    </View>
  );
};

// Delivery Location Pin
export const DeliveryPin = ({ address }) => {
  return (
    <View style={styles.pinContainer}>
      <View style={styles.deliveryPin}>
        <View style={styles.deliveryIconContainer}>
          <Icon name="home" size={18} color={colors.white} />
        </View>
        <View style={styles.deliveryPinShadow} />
      </View>
      <View style={styles.deliveryPinArrow} />
      {address && (
        <View style={styles.deliveryLabel}>
          <Text style={styles.deliveryLabelText} numberOfLines={2}>
            📍 {address}
          </Text>
        </View>
      )}
    </View>
  );
};

// User Location Pin
export const UserLocationPin = () => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.userLocationContainer}>
      <Animated.View 
        style={[
          styles.userLocationPulse,
          { transform: [{ scale: pulseAnim }] }
        ]}
      />
      <View style={styles.userLocationPin}>
        <Icon name="person" size={16} color={colors.white} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Restaurant Pin Styles
  restaurantPin: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  selectedPin: {
    backgroundColor: colors.success,
    transform: [{ scale: 1.2 }],
  },
  restaurantIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 4,
  },
  pinShadow: {
    position: 'absolute',
    bottom: -2,
    width: 35,
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 4,
    zIndex: -1,
  },
  pinArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
    marginTop: -1,
  },
  restaurantLabel: {
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    maxWidth: 120,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  restaurantLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },

  // Rider Pin Styles
  riderPin: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    position: 'relative',
  },
  riderBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  bikeContainer: {
    position: 'absolute',
    bottom: 8,
    left: 12,
  },
  riderPersonContainer: {
    position: 'absolute',
    top: 6,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    padding: 2,
  },
  riderPinShadow: {
    position: 'absolute',
    bottom: -3,
    width: 40,
    height: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 5,
    zIndex: -1,
  },
  movementTrail: {
    position: 'absolute',
    left: -60,
    top: '50%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  trailDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
    marginRight: 8,
  },
  riderPinArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.warning,
    marginTop: -1,
  },
  riderLabel: {
    backgroundColor: colors.warning,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 6,
    maxWidth: 140,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  riderLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },

  // Delivery Pin Styles
  deliveryPin: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  deliveryIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 3,
  },
  deliveryPinShadow: {
    position: 'absolute',
    bottom: -2,
    width: 32,
    height: 7,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 4,
    zIndex: -1,
  },
  deliveryPinArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.success,
    marginTop: -1,
  },
  deliveryLabel: {
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
    maxWidth: 150,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  deliveryLabelText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
  },

  // User Location Pin Styles
  userLocationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    opacity: 0.3,
  },
  userLocationPin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default {
  RestaurantPin,
  RiderPin,
  DeliveryPin,
  UserLocationPin,
};
