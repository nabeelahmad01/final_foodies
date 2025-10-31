// src/screens/restaurant/MenuManagement.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
  Switch,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import colors from '../../styles/colors';

const MenuManagement = ({ navigation, route }) => {
  const { restaurantId } = route.params;
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Main Course',
    isAvailable: true,
    image: null,
  });
  const [uploading, setUploading] = useState(false);

  const categories = [
    'Appetizer',
    'Main Course',
    'Dessert',
    'Beverage',
    'Side Dish',
  ];

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/restaurants/${restaurantId}/menu`);
      setMenuItems(response.data.menuItems || []);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
      Alert.alert('Error', 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled) return;

    const asset = result.assets && result.assets[0];
    if (asset?.uri) {
      const name = asset.fileName || asset.uri.split('/').pop() || 'menu_item.jpg';
      setFormData({
        ...formData,
        image: {
          uri: asset.uri,
          type: 'image/jpeg',
          fileName: name,
        },
      });
    }
  };

  const uploadImageToCloudinary = async imageUri => {
    const data = new FormData();
    data.append('file', {
      uri: imageUri.uri,
      type: imageUri.type || 'image/jpeg',
      name: imageUri.fileName || 'menu_item.jpg',
    });
    data.append('upload_preset', 'your_upload_preset'); // Replace with your Cloudinary preset

    try {
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/your_cloud_name/image/upload', // Replace
        {
          method: 'POST',
          body: data,
        },
      );
      const result = await response.json();
      return result.secure_url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setUploading(true);

    try {
      let imageUrl = formData.image?.uri;

      // Upload image if new image selected
      if (formData.image && !formData.image.uri.startsWith('http')) {
        imageUrl = await uploadImageToCloudinary(formData.image);
      }

      const submitData = {
        ...formData,
        image: imageUrl,
        price: parseFloat(formData.price),
      };

      if (editingItem) {
        await api.put(
          `/restaurants/${restaurantId}/menu/${editingItem._id}`,
          submitData,
        );
        Alert.alert('Success', 'Menu item updated');
      } else {
        await api.post(`/restaurants/${restaurantId}/menu`, submitData);
        Alert.alert('Success', 'Menu item added');
      }

      setShowAddModal(false);
      setEditingItem(null);
      resetForm();
      fetchMenuItems();
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to save menu item',
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = itemId => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/restaurants/${restaurantId}/menu/${itemId}`);
            Alert.alert('Success', 'Item deleted');
            fetchMenuItems();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const handleEdit = item => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      isAvailable: item.isAvailable,
      image: item.image ? { uri: item.image } : null,
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Main Course',
      isAvailable: true,
      image: null,
    });
  };

  const renderMenuItem = ({ item }) => (
    <View style={styles.menuCard}>
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/80' }}
        style={styles.menuImage}
      />
      <View style={styles.menuInfo}>
        <Text style={styles.menuName}>{item.name}</Text>
        <Text style={styles.menuDesc} numberOfLines={1}>
          {item.description}
        </Text>
        <Text style={styles.menuPrice}>Rs. {item.price}</Text>
        <View style={styles.menuMeta}>
          <Text
            style={[
              styles.availability,
              { color: item.isAvailable ? colors.success : colors.error },
            ]}
          >
            {item.isAvailable ? 'Available' : 'Out of Stock'}
          </Text>
          <Text style={styles.category}>{item.category}</Text>
        </View>
      </View>
      <View style={styles.menuActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEdit(item)}
        >
          <Icon name="create-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item._id)}
        >
          <Icon name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setEditingItem(null);
            setShowAddModal(true);
          }}
        >
          <Icon name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Menu List */}
      <FlatList
        data={menuItems}
        renderItem={renderMenuItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="fast-food-outline" size={80} color={colors.lightGray} />
            <Text style={styles.emptyText}>No menu items yet</Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addFirstText}>Add First Item</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit' : 'Add'} Menu Item
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Icon name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Image Picker */}
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {formData.image ? (
                <Image
                  source={{ uri: formData.image.uri }}
                  style={styles.previewImage}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Icon name="camera" size={32} color={colors.gray} />
                  <Text style={styles.imageText}>Add Image</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Form Fields */}
            <TextInput
              style={styles.input}
              placeholder="Item Name *"
              value={formData.name}
              onChangeText={text => setFormData({ ...formData, name: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={formData.description}
              onChangeText={text =>
                setFormData({ ...formData, description: text })
              }
              multiline
              numberOfLines={3}
            />

            <TextInput
              style={styles.input}
              placeholder="Price (Rs.) *"
              value={formData.price}
              onChangeText={text => setFormData({ ...formData, price: text })}
              keyboardType="numeric"
            />

            {/* Category Picker */}
            <View style={styles.categoryContainer}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    formData.category === cat && styles.categoryChipActive,
                  ]}
                  onPress={() => setFormData({ ...formData, category: cat })}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      formData.category === cat && styles.categoryTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Availability Toggle */}
            <View style={styles.availabilityRow}>
              <Text style={styles.availabilityLabel}>Available</Text>
              <Switch
                value={formData.isAvailable}
                onValueChange={value =>
                  setFormData({ ...formData, isAvailable: value })
                }
                trackColor={{ false: colors.gray, true: colors.success }}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                uploading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitText}>
                  {editingItem ? 'Update' : 'Add'} Item
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  menuCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
  },
  menuInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  menuName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  menuDesc: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  menuPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  menuMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  availability: {
    fontSize: 12,
    fontWeight: '600',
  },
  category: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  menuActions: {
    justifyContent: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 16,
    marginBottom: 24,
  },
  addFirstButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 24,
  },
  addFirstText: {
    color: colors.white,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  imagePicker: {
    height: 150,
    borderRadius: 12,
    backgroundColor: colors.background,
    marginBottom: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    marginTop: 8,
    color: colors.text.secondary,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  categoryTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  availabilityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray,
  },
  submitText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MenuManagement;
