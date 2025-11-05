// Web-only Map Component - No react-native-maps
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MapComponent = ({ children, style, ...props }) => {
  return (
    <View style={[styles.webMapContainer, style]}>
      <Text style={styles.webMapText}>🗺️ Map View</Text>
      <Text style={styles.webMapSubtext}>
        (Maps are not available on web - use mobile app for full experience)
      </Text>
      {children}
    </View>
  );
};

const MarkerComponent = ({ children, ...props }) => {
  return (
    <View style={styles.webMarker}>
      <Text style={styles.webMarkerText}>📍</Text>
    </View>
  );
};

const PolylineComponent = (props) => {
  return (
    <View style={styles.webPolyline}>
      <Text style={styles.webPolylineText}>📏 Route</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  webMapContainer: {
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#b0d4e3',
    borderStyle: 'dashed',
    minHeight: 200,
  },
  webMapText: {
    fontSize: 24,
    marginBottom: 10,
  },
  webMapSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  webMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
  webMarkerText: {
    fontSize: 20,
  },
  webPolyline: {
    position: 'absolute',
    bottom: 10,
    left: 10,
  },
  webPolylineText: {
    fontSize: 12,
    color: '#666',
  },
});

export default MapComponent;
export { MarkerComponent as Marker, PolylineComponent as Polyline };
