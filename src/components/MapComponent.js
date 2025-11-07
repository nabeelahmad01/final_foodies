// Native Map Component - Uses react-native-maps with error handling
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import colors from '../styles/colors';

// Try to import maps with error handling
let MapView, Marker, Polyline;
let isMapboxGL = false;

try {
  // First try react-native-maps (Google Maps)
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Polyline = maps.Polyline;
  console.log('✅ Google Maps loaded successfully');
} catch (error) {
  console.warn('Google Maps not available, trying Mapbox:', error);
  try {
    // Fallback to Mapbox GL
    const mapboxGL = require('@react-native-mapbox-gl/maps');
    MapView = mapboxGL.MapView;
    Marker = mapboxGL.PointAnnotation;
    Polyline = mapboxGL.LineLayer;
    isMapboxGL = true;
    console.log('✅ Mapbox GL loaded successfully');
  } catch (mapboxError) {
    console.warn('No maps available:', mapboxError);
  }
}

// Custom map style to match app theme
const customMapStyle = [
  {
    "featureType": "all",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "featureType": "all",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "all",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "all",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#eeeeee"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e5e5e5"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#dadada"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e5e5e5"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#eeeeee"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#c9c9c9"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  }
];

// Fallback component when maps are not available
const MapFallback = ({ style }) => (
  <View style={[style, fallbackStyles.container]}>
    <View style={fallbackStyles.content}>
      <Text style={fallbackStyles.title}>🗺️ Map View</Text>
      <Text style={fallbackStyles.message}>
        Map is loading or not available in this build.
      </Text>
      <Text style={fallbackStyles.subtitle}>
        Location services are still working in the background.
      </Text>
    </View>
  </View>
);

const MapComponent = ({ 
  children,
  style,
  customMapStyle: providedStyle,
  showsUserLocation = false,
  showsMyLocationButton = false,
  showsCompass = false,
  toolbarEnabled = false,
  rotateEnabled = true,
  scrollEnabled = true,
  zoomEnabled = true,
  pitchEnabled = false,
  ...props 
}) => {
  const [mapError, setMapError] = useState(false);

  // If MapView is not available, show fallback
  if (!MapView || mapError) {
    return <MapFallback style={style} />;
  }

  return (
    <MapView 
      style={style} 
      customMapStyle={providedStyle || customMapStyle}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={showsMyLocationButton}
      showsCompass={showsCompass}
      toolbarEnabled={toolbarEnabled}
      rotateEnabled={rotateEnabled}
      scrollEnabled={scrollEnabled}
      zoomEnabled={zoomEnabled}
      pitchEnabled={pitchEnabled}
      // Prevent opening external maps
      onPress={() => {}} // Override default press behavior
      onMarkerPress={() => {}} // Prevent marker press from opening external maps
      onCalloutPress={() => {}} // Prevent callout press from opening external maps
      onError={(error) => {
        console.warn('Map error:', error);
        setMapError(true);
      }}
      {...props}
    >
      {children}
    </MapView>
  );
};

const fallbackStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default MapComponent;
export { Marker, Polyline };
