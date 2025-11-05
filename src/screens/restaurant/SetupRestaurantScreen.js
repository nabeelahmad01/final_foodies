import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MapComponent, { Marker } from '../../components/MapComponent';
import * as Location from 'expo-location';
import { useDispatch } from 'react-redux';
import colors from '../../styles/colors';
import { useToast } from '../../context.js/ToastContext';
import { t, useLanguageRerender } from '../../utils/i18n';
import { handleApiError, showSuccess } from '../../utils/helpers';
import { updateUser } from '../../redux/slices/authSlice';
import api from '../../services/api';
import { MAPBOX_ACCESS_TOKEN } from '../../config/keys';

const SetupRestaurantScreen = ({ navigation }) => {
  useLanguageRerender();
  const toast = useToast();
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [addressLabel, setAddressLabel] = useState('');
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [askUseLocation, setAskUseLocation] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query || query.length < 3) {
        setSuggestions([]);
        return;
      }
      try {
        // Primary search with Pakistan country filter
        const primaryUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&autocomplete=true&limit=10&country=pk&types=address,poi,place,locality,neighborhood`;
        
        console.log('Fetching address suggestions for:', query);
        const primaryRes = await fetch(primaryUrl);
        const primaryData = await primaryRes.json();
        
        let allResults = primaryData.features || [];
        
        // If we get fewer than 3 results, try a broader search
        if (allResults.length < 3) {
          console.log('Few results found, trying broader search...');
          const broadUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query + ' Pakistan'
          )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&autocomplete=true&limit=8&types=address,poi,place,locality,neighborhood`;
          
          const broadRes = await fetch(broadUrl);
          const broadData = await broadRes.json();
          
          // Merge results and remove duplicates
          const broadResults = (broadData.features || []).filter(feature => {
            // Check if the result is in Pakistan
            const context = feature.context || [];
            const country = context.find(c => c.id.includes('country'));
            const isInPakistan = country && country.text.toLowerCase() === 'pakistan';
            
            // Also check if result already exists
            const isDuplicate = allResults.some(existing => existing.id === feature.id);
            
            return isInPakistan && !isDuplicate;
          });
          
          allResults = [...allResults, ...broadResults];
        }
        
        // Filter to only include results from Pakistan and sort by relevance
        const pakistanResults = allResults
          .filter(feature => {
            const context = feature.context || [];
            const country = context.find(c => c.id.includes('country'));
            return country && country.text.toLowerCase() === 'pakistan';
          })
          .slice(0, 8); // Limit to 8 suggestions
        
        console.log('Filtered Pakistan results:', pakistanResults.length, 'suggestions');
        
        // If still very few results, add some common Pakistani location suggestions
        if (pakistanResults.length < 2) {
          const commonPakistaniPlaces = [
            { id: 'manual-lahore', place_name: `${query}, Lahore, Punjab, Pakistan`, center: [74.3587, 31.5204] },
            { id: 'manual-karachi', place_name: `${query}, Karachi, Sindh, Pakistan`, center: [67.0011, 24.8607] },
            { id: 'manual-islamabad', place_name: `${query}, Islamabad, Pakistan`, center: [73.0479, 33.6844] },
            { id: 'manual-rawalpindi', place_name: `${query}, Rawalpindi, Punjab, Pakistan`, center: [73.0479, 33.5651] },
            { id: 'manual-faisalabad', place_name: `${query}, Faisalabad, Punjab, Pakistan`, center: [73.1344, 31.4504] },
            { id: 'manual-multan', place_name: `${query}, Multan, Punjab, Pakistan`, center: [71.5249, 30.1575] },
            { id: 'manual-peshawar', place_name: `${query}, Peshawar, Khyber Pakhtunkhwa, Pakistan`, center: [71.5249, 34.0151] },
            { id: 'manual-quetta', place_name: `${query}, Quetta, Balochistan, Pakistan`, center: [66.9750, 30.1798] },
            { id: 'manual-sialkot', place_name: `${query}, Sialkot, Punjab, Pakistan`, center: [74.5247, 32.4945] },
            { id: 'manual-gujranwala', place_name: `${query}, Gujranwala, Punjab, Pakistan`, center: [74.1883, 32.1877] }
          ].filter(place => {
            const queryLower = query.toLowerCase();
            const placeName = place.place_name.toLowerCase();
            const cityName = place.place_name.split(',')[1].trim().toLowerCase();
            
            return placeName.includes(queryLower) || 
                   queryLower.includes(cityName) ||
                   cityName.includes(queryLower);
          });
          
          pakistanResults.push(...commonPakistaniPlaces.slice(0, 3));
        }
        
        setSuggestions(pakistanResults);
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
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
        toast.show('Location permission is required', 'error');
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
      setUseCurrentLocation(true);
      
      // Set a default address label if reverse geocoding fails
      setAddressLabel(`Near ${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
      
      // Try reverse geocoding but don't block on it
      try {
        const rev = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
          `${initial.longitude},${initial.latitude}.json?` +
          `access_token=${MAPBOX_ACCESS_TOKEN}&limit=1&country=pk`
        );
        const data = await rev.json();
        
        // Only use the result if it's in Pakistan
        const result = data?.features?.[0];
        if (result) {
          const context = result.context || [];
          const country = context.find(c => c.id.includes('country'));
          
          if (country && country.text.toLowerCase() === 'pakistan') {
            setAddressLabel(result.place_name);
          } else {
            toast.show('Please select a location in Pakistan', 'warning');
          }
        }
      } catch (error) {
        console.log('Reverse geocoding failed, using coordinates as fallback');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      toast.show('Failed to get current location', 'error');
      setLoading(false);
    }
  };

  const canContinue = useMemo(() => {
    if (step === 1) return name.trim().length > 1;
    if (step === 2) return !!region && addressLabel.trim().length > 2;
    return true;
  }, [step, name, region, addressLabel]);

  const submit = async () => {
    if (!region) {
      toast.show('Please select a location on the map', 'error');
      return;
    }
    
    if (!addressLabel.trim()) {
      toast.show('Please enter an address label', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      // Always use real API - no more mock data
      console.log('Creating restaurant:', {
        name: name.trim(),
        address: addressLabel.trim(),
        coords: { lat: region.latitude, lng: region.longitude }
      });
      
      // Extract city from address
      const addressParts = addressLabel.trim().split(',').map(part => part.trim());
      let city = 'Lahore'; // Default city
      
      // Try to find city from address parts
      if (addressParts.length >= 2) {
        // Look for common Pakistani cities or use second-to-last part
        const possibleCity = addressParts[addressParts.length - 2];
        const pakistaniCities = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'];
        
        // Check if any part contains a known city
        for (const part of addressParts) {
          for (const pkCity of pakistaniCities) {
            if (part.toLowerCase().includes(pkCity.toLowerCase())) {
              city = pkCity;
              break;
            }
          }
          if (city !== 'Lahore') break; // Found a city, stop searching
        }
        
        // If no known city found, use the second-to-last part
        if (city === 'Lahore' && possibleCity) {
          city = possibleCity;
        }
      }
      
      console.log('Extracted city:', city, 'from address:', addressLabel);
      
      // Real API call
      const response = await api.post('/restaurants', {
        name: name.trim(),
        address: addressLabel.trim(),
        city: city,
        location: {
          type: 'Point',
          coordinates: [region.longitude, region.latitude]
        }
      });
      
      // Get the created restaurant ID and update user data
      const restaurantId = response.data?.restaurant?._id || response.data?._id;
      console.log('Created restaurant ID:', restaurantId);
      
      // Update user's restaurantId in Redux
      dispatch(updateUser({ restaurantId }));
      
      showSuccess(toast, 'Restaurant setup successful!');
      setLoading(false);
      // Navigate to RestaurantDashboard instead of MenuManagement
      navigation.replace('RestaurantDashboard');
    } catch (error) {
      console.error('Error creating restaurant:', error);
      setLoading(false);
      
      // Show more specific error messages
      if (error.response) {
        // Server responded with error status
        const message = error.response.data?.message || 'Failed to create restaurant';
        toast.show(message, 'error');
      } else if (error.request) {
        // No response received
        toast.show('Network error. Please check your connection.', 'error');
      } else {
        // Other errors
        toast.show('An error occurred. Please try again.', 'error');
      }
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
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color={colors.text.secondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.input, styles.searchInput]}
              placeholder="Search for your restaurant's address"
              placeholderTextColor={colors.text.secondary}
              value={query}
              onChangeText={setQuery}
            />
          </View>
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
            style={[styles.input, styles.addressInput]}
            placeholder="Enter your restaurant's address"
            placeholderTextColor={colors.text.secondary}
            value={addressLabel}
            onChangeText={setAddressLabel}
            multiline
            numberOfLines={2}
          />
          <View style={styles.mapContainer}>
            {region ? (
              <MapComponent style={styles.map} initialRegion={region} region={region} onRegionChangeComplete={setRegion}>
                <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} />
              </MapComponent>
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
  input: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  searchIcon: {
    padding: 12,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
    borderWidth: 0,
    paddingLeft: 0,
  },
  addressInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
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
