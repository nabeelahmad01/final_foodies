import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import colors from '../../styles/colors';
import { useToast } from '../../context.js/ToastContext';

const AddressPickerScreen = ({ navigation }) => {
  const toast = useToast();
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          toast.show('Location permission denied', 'error');
          setLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const initial = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(initial);
      } catch (e) {
        setRegion({ latitude: 31.5204, longitude: 74.3587, latitudeDelta: 0.05, longitudeDelta: 0.05 }); // Lahore fallback
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const confirm = async () => {
    if (!region) return;
    // Simple reverse geocode
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: region.latitude, longitude: region.longitude });
      const addr = results?.[0];
      const addressLine = [addr?.name, addr?.street, addr?.city].filter(Boolean).join(', ');
      navigation.navigate('Checkout', {
        selectedAddress: {
          label: 'Selected',
          address: addressLine || 'Pinned Location',
          city: addr?.city || 'Lahore',
          coords: { lat: region.latitude, lng: region.longitude },
        },
      });
    } catch (e) {
      toast.show('Selected location set', 'success');
      navigation.navigate('Checkout', {
        selectedAddress: {
          label: 'Selected',
          address: 'Pinned Location',
          city: 'Lahore',
          coords: { lat: region.latitude, lng: region.longitude },
        },
      });
    }
  };

  if (loading || !region) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 8, color: colors.text.secondary }}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={region} onRegionChangeComplete={setRegion}>
        <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} />
      </MapView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmBtn} onPress={confirm}>
          <Text style={styles.confirmText}>Use This Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  footer: { position: 'absolute', left: 16, right: 16, bottom: 24 },
  confirmBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  confirmText: { color: colors.white, fontWeight: '700' },
});

export default AddressPickerScreen;
