// src/components/SimpleMapView.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import colors from '../styles/colors';

const { width, height } = Dimensions.get('window');

const SimpleMapView = ({ 
  latitude = 31.4952, 
  longitude = 74.3157, 
  markers = [], 
  style,
  showsUserLocation = false 
}) => {
  const [loading, setLoading] = useState(true);

  // Create HTML for the map
  const createMapHTML = () => {
    const markersHTML = markers.map((marker, index) => `
      L.marker([${marker.latitude}, ${marker.longitude}])
        .addTo(map)
        .bindPopup('${marker.title || `Location ${index + 1}`}');
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <style>
            body { margin: 0; padding: 0; }
            #map { 
                height: 100vh; 
                width: 100vw; 
                background: ${colors.lightGray};
            }
            .leaflet-control-attribution {
                font-size: 10px !important;
                background: rgba(255,255,255,0.8) !important;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <script>
            // Initialize map
            var map = L.map('map', {
                zoomControl: true,
                attributionControl: true
            }).setView([${latitude}, ${longitude}], 15);

            // Add OpenStreetMap tiles (free, no API key needed)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(map);

            // Add custom styling
            var style = document.createElement('style');
            style.innerHTML = \`
                .leaflet-container {
                    background: ${colors.background} !important;
                }
                .leaflet-tile {
                    filter: hue-rotate(${colors.primary === '#FF6B35' ? '20deg' : '0deg'}) saturate(0.8);
                }
            \`;
            document.head.appendChild(style);

            // Add markers
            ${markersHTML}

            // Add user location if requested
            ${showsUserLocation ? `
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    var userLat = position.coords.latitude;
                    var userLng = position.coords.longitude;
                    
                    L.circle([userLat, userLng], {
                        color: '${colors.primary}',
                        fillColor: '${colors.primary}',
                        fillOpacity: 0.3,
                        radius: 100
                    }).addTo(map);
                    
                    L.marker([userLat, userLng])
                        .addTo(map)
                        .bindPopup('Your Location');
                });
            }
            ` : ''}

            // Fit bounds if multiple markers
            ${markers.length > 1 ? `
            var group = new L.featureGroup([${markers.map((_, i) => `markers[${i}]`).join(',')}]);
            map.fitBounds(group.getBounds().pad(0.1));
            ` : ''}
        </script>
    </body>
    </html>
    `;
  };

  return (
    <View style={[styles.container, style]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}
      <WebView
        source={{ html: createMapHTML() }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        onError={(error) => {
          console.warn('Map WebView error:', error);
          setLoading(false);
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={true}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
});

export default SimpleMapView;
