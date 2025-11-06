// src/utils/mapUtils.js
import * as Location from 'expo-location';

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

// Format distance for display
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

// Calculate estimated time of arrival
export const calculateETA = (distance, mode = 'driving') => {
  let speed; // km/h
  
  switch (mode) {
    case 'walking':
      speed = 5;
      break;
    case 'cycling':
      speed = 15;
      break;
    case 'driving':
    default:
      speed = 30; // Average city driving speed
      break;
  }
  
  const timeInHours = distance / speed;
  const timeInMinutes = Math.round(timeInHours * 60);
  
  return timeInMinutes;
};

// Format ETA for display
export const formatETA = (minutes) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};

// Get current location
export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    throw error;
  }
};

// Calculate bearing between two points (for rider rotation)
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = deg2rad(lon2 - lon1);
  const lat1Rad = deg2rad(lat1);
  const lat2Rad = deg2rad(lat2);
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x);
  bearing = bearing * (180 / Math.PI); // Convert to degrees
  bearing = (bearing + 360) % 360; // Normalize to 0-360
  
  return bearing;
};

// Get address from coordinates (reverse geocoding)
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (addresses && addresses.length > 0) {
      const address = addresses[0];
      return `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim();
    }
    
    return 'Unknown location';
  } catch (error) {
    console.error('Error getting address:', error);
    return 'Unknown location';
  }
};

// Create region object for map
export const createRegion = (latitude, longitude, latitudeDelta = 0.01, longitudeDelta = 0.01) => {
  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

// Fit map to show multiple coordinates
export const fitToCoordinates = (coordinates, padding = 50) => {
  if (!coordinates || coordinates.length === 0) return null;
  
  let minLat = coordinates[0].latitude;
  let maxLat = coordinates[0].latitude;
  let minLng = coordinates[0].longitude;
  let maxLng = coordinates[0].longitude;
  
  coordinates.forEach(coord => {
    minLat = Math.min(minLat, coord.latitude);
    maxLat = Math.max(maxLat, coord.latitude);
    minLng = Math.min(minLng, coord.longitude);
    maxLng = Math.max(maxLng, coord.longitude);
  });
  
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const latDelta = (maxLat - minLat) * 1.2; // Add 20% padding
  const lngDelta = (maxLng - minLng) * 1.2;
  
  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: Math.max(latDelta, 0.01), // Minimum zoom level
    longitudeDelta: Math.max(lngDelta, 0.01),
  };
};

// Check if location is within delivery radius
export const isWithinDeliveryRadius = (
  restaurantLat, 
  restaurantLng, 
  deliveryLat, 
  deliveryLng, 
  radiusKm = 10
) => {
  const distance = calculateDistance(restaurantLat, restaurantLng, deliveryLat, deliveryLng);
  return distance <= radiusKm;
};

export default {
  calculateDistance,
  formatDistance,
  calculateETA,
  formatETA,
  getCurrentLocation,
  calculateBearing,
  getAddressFromCoordinates,
  createRegion,
  fitToCoordinates,
  isWithinDeliveryRadius,
};
