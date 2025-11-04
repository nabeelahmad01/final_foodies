// Frontend - Address Management Screen
// src/screens/user/AddressManagementScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import colors from '../../styles/colors';
import { useToast } from '../../context.js/ToastContext';
import { handleApiError, showSuccess } from '../../utils/helpers';
import ConfirmModal from '../../components/ConfirmModal';

const AddressManagementScreen = ({ navigation, route }) => {
  const toast = useToast();
  const nav = useNavigation();
  const [addresses, setAddresses] = useState([]);
  const [filteredAddresses, setFilteredAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmState, setConfirmState] = useState({ visible: false, targetId: null });
  const [formData, setFormData] = useState({
    label: 'Home',
    address: '',
    city: 'Lahore',
    country: 'Pakistan',
    isDefault: false,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      // Always use real API - no more mock data
      const response = await api.get('/user/addresses');
      const userAddresses = response.data?.addresses || [];
      
      setAddresses(userAddresses);
      // Filter only Pakistan addresses
      const pakistanAddresses = userAddresses.filter(addr => 
        addr.country === 'Pakistan' || !addr.country
      );
      setFilteredAddresses(pakistanAddresses);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      setAddresses([]);
      setFilteredAddresses([]);
      handleApiError(error, toast);
    }
  };

  const handleAdd = async () => {
    try {
      // Always use real API - no more mock data
      const response = await api.post('/user/addresses', formData);
      const newAddress = response.data?.address || {
        ...formData,
        _id: Date.now().toString(),
        country: 'Pakistan' // Ensure country is always Pakistan
      };
      
      const updatedAddresses = [...addresses, newAddress];
      setAddresses(updatedAddresses);
      
      // Filter only Pakistan addresses
      const pakistanAddresses = updatedAddresses.filter(addr => 
        addr.country === 'Pakistan' || !addr.country
      );
      setFilteredAddresses(pakistanAddresses);
      
      setShowAddModal(false);
      setFormData({ 
        label: 'Home', 
        address: '', 
        city: 'Lahore', 
        country: 'Pakistan',
        isDefault: false 
      });
      showSuccess(toast, 'Address added');
    } catch (error) {
      console.error('Error adding address:', error);
      // In development, still add to local state
      if (__DEV__) {
        const newAddress = {
          ...formData,
          _id: Date.now().toString(),
          country: 'Pakistan'
        };
        const updatedAddresses = [...addresses, newAddress];
        setAddresses(updatedAddresses);
        setFilteredAddresses(updatedAddresses.filter(addr => 
          addr.country === 'Pakistan' || !addr.country
        ));
        setShowAddModal(false);
        showSuccess(toast, 'Address added (offline)');
      } else {
        handleApiError(error, toast);
      }
    }
  };

  const handleDelete = (id) => {
    setConfirmState({ visible: true, targetId: id });
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/addresses/${id}`, { isDefault: true });
      fetchAddresses();
      showSuccess(toast, 'Default address updated');
    } catch (error) {
      handleApiError(error, toast);
    }
  };

  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    // If this screen was opened from checkout, return the selected address
    if (route.params?.fromCheckout) {
      navigation.navigate('Checkout', { selectedAddress: address });
    }
  };

  const renderAddress = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.addressCard, 
        selectedAddress?._id === item._id && { borderColor: colors.primary, borderWidth: 1 }
      ]}
      onPress={() => handleSelectAddress(item)}
    >
      <View style={styles.addressHeader}>
        <View style={styles.addressLeft}>
          <Icon 
            name={selectedAddress?._id === item._id ? "radio-button-on" : "radio-button-off"} 
            size={24} 
            color={colors.primary} 
          />
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>{item.label}</Text>
            {item.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={(e) => {
          e.stopPropagation(); // Prevent triggering the parent onPress
          handleDelete(item._id);
        }}>
          <Icon name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
      <Text style={styles.addressText}>{item.address}</Text>
      <Text style={styles.cityText}>{item.city}, Pakistan</Text>
      {!item.isDefault && (
        <TouchableOpacity
          style={styles.setDefaultButton}
          onPress={(e) => {
            e.stopPropagation(); // Prevent triggering the parent onPress
            handleSetDefault(item._id);
          }}
        >
          <Text style={styles.setDefaultText}>Set as Default</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Addresses</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Icon name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredAddresses}
        renderItem={renderAddress}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No addresses found. Add your first address!</Text>
          </View>
        }
      />

      {/* Add Address Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Address</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Label (Home, Work, etc.)"
              value={formData.label}
              onChangeText={(text) => setFormData({ ...formData, label: text })}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Complete Address"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              multiline
            />
            
            <TextInput
              style={styles.input}
              placeholder="City"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAdd}
              >
                <Text style={styles.addText}>Add Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        visible={confirmState.visible}
        title="Delete Address"
        message="Are you sure you want to delete this address?"
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setConfirmState({ visible: false, targetId: null })}
        onConfirm={async () => {
          const id = confirmState.targetId;
          setConfirmState({ visible: false, targetId: null });
          try {
            await api.delete(`/addresses/${id}`);
            fetchAddresses();
            showSuccess(toast, 'Address deleted');
          } catch (error) {
            handleApiError(error, toast);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: colors.primary,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.white },
  list: { padding: 20 },
  addressCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addressLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  addressInfo: { marginLeft: 12, flex: 1 },
  addressLabel: { fontSize: 16, fontWeight: 'bold' },
  defaultBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  defaultText: { fontSize: 10, color: colors.success, fontWeight: '600' },
  addressText: { fontSize: 14, color: colors.text.secondary, marginBottom: 4 },
  cityText: { fontSize: 12, color: colors.text.secondary },
  setDefaultButton: {
    marginTop: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  setDefaultText: { color: colors.primary, fontWeight: '600' },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: { backgroundColor: colors.background },
  cancelText: { color: colors.text.primary, fontWeight: '600' },
  addButton: { backgroundColor: colors.primary },
  addText: { color: colors.white, fontWeight: '600' },
});

export default AddressManagementScreen;