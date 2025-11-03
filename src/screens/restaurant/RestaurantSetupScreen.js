import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from 'react-native-toast-notifications';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { createRestaurant } from '../../redux/slices/restaurantSlice';

const RestaurantSetupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [logo, setLogo] = useState(null);
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useSelector((state) => state.auth);
  const { loading: restaurantLoading, error } = useSelector((state) => state.restaurant);

  useEffect(() => {
    if (error) {
      toast.show(error, { type: 'danger' });
    }
  }, [error, toast]);

  const pickImage = async (type) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.show('Sorry, we need camera roll permissions to upload images!', { type: 'danger' });
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [3, 1],
      quality: 0.8,
    });

    if (!result.cancelled) {
      if (type === 'logo') {
        setLogo(result.uri);
      } else {
        setBanner(result.uri);
      }
    }
  };

  const handleSubmit = async () => {
    if (!name || !description || !address || !phone) {
      toast.show('Please fill in all required fields', { type: 'warning' });
      return;
    }

    if (!logo || !banner) {
      toast.show('Please upload both logo and banner images', { type: 'warning' });
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('address', address);
      formData.append('phone', phone);
      formData.append('ownerId', user._id);
      
      // Add logo
      const logoUriParts = logo.split('.');
      const logoFileType = logoUriParts[logoUriParts.length - 1];
      formData.append('logo', {
        uri: logo,
        name: `logo.${logoFileType}`,
        type: `image/${logoFileType}`,
      });
      
      // Add banner
      const bannerUriParts = banner.split('.');
      const bannerFileType = bannerUriParts[bannerUriParts.length - 1];
      formData.append('banner', {
        uri: banner,
        name: `banner.${bannerFileType}`,
        type: `image/${bannerFileType}`,
      });

      await dispatch(createRestaurant(formData)).unwrap();
      
      toast.show('Restaurant created successfully!', { type: 'success' });
      navigation.replace('RestaurantDashboard');
    } catch (error) {
      console.error('Error creating restaurant:', error);
      toast.show(error.message || 'Failed to create restaurant', { type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Setup Your Restaurant</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Restaurant Information</Text>
        
        <Text style={styles.label}>Restaurant Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter restaurant name"
          value={name}
          onChangeText={setName}
        />
        
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell us about your restaurant"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
        
        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter full address"
          value={address}
          onChangeText={setAddress}
        />
        
        <Text style={styles.label}>Contact Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter contact number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Restaurant Images</Text>
        
        <Text style={styles.label}>Logo (Square) *</Text>
        <TouchableOpacity 
          style={styles.imageUpload}
          onPress={() => pickImage('logo')}
        >
          {logo ? (
            <Image source={{ uri: logo }} style={styles.imagePreview} />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <MaterialIcons name="add-a-photo" size={40} color="#999" />
              <Text>Upload Logo</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <Text style={[styles.label, { marginTop: 20 }]}>Banner (Wide) *</Text>
        <TouchableOpacity 
          style={[styles.imageUpload, styles.bannerUpload]}
          onPress={() => pickImage('banner')}
        >
          {banner ? (
            <Image source={{ uri: banner }} style={styles.bannerPreview} />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <MaterialIcons name="add-photo-alternate" size={40} color="#999" />
              <Text>Upload Banner</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={[styles.submitButton, (loading || restaurantLoading) && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={loading || restaurantLoading}
      >
        {loading || restaurantLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Save & Continue</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.footer}>
        <Text style={styles.note}>
          * Required fields. You can add your menu items after setting up your restaurant.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imageUpload: {
    width: 150,
    height: 150,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  bannerUpload: {
    width: '100%',
    height: 150,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  disabledButton: {
    backgroundColor: '#a0c4ff',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginBottom: 30,
  },
  note: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default RestaurantSetupScreen;
