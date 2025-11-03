import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import colors from '../../styles/colors';
import { useToast } from '../../context.js/ToastContext';
import { t, useLanguageRerender } from '../../utils/i18n';
import { handleApiError, showSuccess } from '../../utils/helpers';
import api from '../../services/api';
import { MAPBOX_ACCESS_TOKEN } from '../../config/keys';

const SetupRestaurantScreen = ({ navigation }) => {
  useLanguageRerender();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [addressLabel, setAddressLabel] = useState('');
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [askUseLocation, setAskUseLocation] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query || query.length < 3) {
        setSuggestions([]);
        return;
      }
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query,
        )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&autocomplete=true&limit=5`;
        const res = await fetch(url);
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (_) {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setAskUseLocation(true);
  }, []);

  const loadCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast.show(t('common.error'), 'error');
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
      // reverse geocode
      try {
        const rev = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${initial.longitude},${initial.latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`);
        const data = await rev.json();
        const place = data?.features?.[0]?.place_name;
        if (place) setAddressLabel(place);
      } catch {}
      setLoading(false);
    } catch (e) {
      setLoading(false);
      handleApiError(e, toast);
    }
  };

  const canContinue = useMemo(() => {
    if (step === 1) return name.trim().length > 1;
    if (step === 2) return !!region && addressLabel.trim().length > 2;
    return true;
  }, [step, name, region, addressLabel]);

  const submit = async () => {
    try {
      setLoading(true);
      const payload = {
        name: name.trim(),
        address: {
          label: addressLabel.trim(),
          formatted: addressLabel.trim(),
          coords: { lat: region.latitude, lng: region.longitude },
        },
      };
      await api.post('/restaurants', payload);
      setLoading(false);
      showSuccess(toast, t('common.success'));
      navigation.replace('RestaurantDashboard');
    } catch (e) {
      setLoading(false);
      handleApiError(e, toast);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Setup Restaurant</Text>
        <View style={styles.placeholder} />
      </View>

      {step === 1 && (
        <View style={styles.content}>
          <Text style={styles.title}>Restaurant Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter restaurant name"
            value={name}
            onChangeText={setName}
          />
        </View>
      )}

      {step === 2 && (
        <View style={styles.content}>
          <Text style={styles.title}>Restaurant Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Search address or type label"
            value={query}
            onChangeText={setQuery}
          />
          {!!suggestions.length && (
            <View style={styles.suggestions}>
              {suggestions.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={styles.suggestionItem}
                  onPress={() => {
                    const [lng, lat] = f.center || [];
                    if (lng && lat) {
                      setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
                    }
                    setAddressLabel(f.place_name || '');
                    setQuery(f.place_name || '');
                    setSuggestions([]);
                  }}
                >
                  <Text numberOfLines={2} style={styles.suggestionText}>{f.place_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TextInput
            style={styles.input}
            placeholder="Address label (optional)"
            value={addressLabel}
            onChangeText={setAddressLabel}
          />
          <View style={styles.mapContainer}>
            {region ? (
              <MapView style={styles.map} initialRegion={region} region={region} onRegionChangeComplete={setRegion}>
                <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} />
              </MapView>
            ) : (
              <View style={styles.mapPlaceholder}>
                {loading ? <ActivityIndicator /> : <Text style={styles.placeholderText}>Map</Text>}
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.locationBtn} onPress={() => setAskUseLocation(true)}>
            <Icon name="locate" size={18} color={colors.primary} />
            <Text style={styles.locationBtnText}>Use Current Location</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity style={[styles.navBtn, styles.secondary]} onPress={() => setStep(step - 1)}>
            <Text style={styles.navBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        {step < 2 && (
          <TouchableOpacity style={[styles.navBtn, !canContinue && styles.disabled]} onPress={() => canContinue && setStep(step + 1)} disabled={!canContinue}>
            <Text style={styles.navBtnText}>Next</Text>
          </TouchableOpacity>
        )}
        {step === 2 && (
          <TouchableOpacity style={[styles.submitBtn, (!canContinue || loading) && styles.disabled]} onPress={submit} disabled={!canContinue || loading}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>Create</Text>}
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={askUseLocation} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Use Current Location?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.navBtn, styles.secondary]} onPress={() => setAskUseLocation(false)}>
                <Text style={styles.navBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => {
                  setAskUseLocation(false);
                  loadCurrentLocation();
                }}
              >
                <Text style={styles.navBtnText}>Use</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: colors.primary },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white },
  placeholder: { width: 40 },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  input: { backgroundColor: colors.white, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
  mapContainer: { height: 240, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.white },
  map: { flex: 1 },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.text.secondary },
  locationBtn: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationBtnText: { color: colors.primary, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  navBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  secondary: { backgroundColor: colors.background },
  disabled: { opacity: 0.6 },
  navBtnText: { color: colors.text.primary, fontWeight: '700' },
  submitBtn: { backgroundColor: colors.success, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12 },
  submitText: { color: colors.white, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary, marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
});

export default SetupRestaurantScreen;
