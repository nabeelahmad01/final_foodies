// src/components/MapErrorBoundary.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../styles/colors';

class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('Map Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <Icon name="map-outline" size={48} color={colors.text.secondary} />
            <Text style={styles.errorTitle}>Map Temporarily Unavailable</Text>
            <Text style={styles.errorMessage}>
              The map feature is currently not available. This might be due to:
            </Text>
            <View style={styles.reasonsList}>
              <Text style={styles.reason}>• Missing Google Maps API key</Text>
              <Text style={styles.reason}>• Network connectivity issues</Text>
              <Text style={styles.reason}>• Device compatibility</Text>
            </View>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => this.setState({ hasError: false, error: null })}
            >
              <Icon name="refresh" size={20} color={colors.white} />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
            <Text style={styles.fallbackMessage}>
              Don't worry! All other app features are working normally.
            </Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  reasonsList: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  reason: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
    paddingLeft: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 16,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 8,
  },
  fallbackMessage: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MapErrorBoundary;
