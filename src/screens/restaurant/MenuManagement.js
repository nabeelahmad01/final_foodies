// src/screens/restaurant/MenuManagement.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Switch,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import colors from '../../styles/colors';
import { useToast } from '../../context.js/ToastContext';
import { handleApiError, showSuccess } from '../../utils/helpers';
import ConfirmModal from '../../components/ConfirmModal';

const MenuManagement = ({ navigation, route }) => {
  const toast = useToast();
  
  // Check if restaurantId is provided
  if (!route.params?.restaurantId) {
    Alert.alert('Error', 'Restaurant ID is missing. Please set up your restaurant again.', [
      { text: 'OK', onPress: () => navigation.navigate('SetupRestaurant') }
    ]);
    return null;
  }
  
  const { restaurantId } = route.params;
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // Form states
  const [editingItem, setEditingItem] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    isAvailable: true,
    image: null,
  });
  
  // UI states
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ 
    visible: false, 
    id: null, 
    type: 'item', // 'item' or 'category'
    name: '' 
  });

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCategories();
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  // Load menu items when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchMenuItems(selectedCategory._id);
    } else {
      setMenuItems([]);
    }
  }, [selectedCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories().finally(() => setRefreshing(false));
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // In production: const response = await api.get(`/restaurants/${restaurantId}/categories`);
      // Mock data for development
      const mockCategories = [
        { _id: '1', name: 'Burgers', items: [] },
        { _id: '2', name: 'Pizza', items: [] },
        { _id: '3', name: 'Biryani', items: [] },
        { _id: '4', name: 'Tikka', items: [] },
        { _id: '5', name: 'Karahi', items: [] },
      ];
      setCategories(mockCategories);
      if (mockCategories.length > 0 && !selectedCategory) {
        setSelectedCategory(mockCategories[0]);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      handleApiError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async (categoryId) => {
    try {
      setLoading(true);
      // In production: const response = await api.get(`/restaurants/${restaurantId}/menu?category=${categoryId}`);
      // Mock data for development
      const mockMenuItems = {
        '1': [
          { _id: '101', name: 'Chicken Burger', description: 'Juicy chicken patty with fresh veggies', price: 350, image: 'https://via.placeholder.com/150', isAvailable: true },
          { _id: '102', name: 'Beef Burger', description: 'Classic beef patty with cheese', price: 450, image: 'https://via.placeholder.com/150', isAvailable: true },
          { _id: '103', name: 'Zinger Burger', description: 'Spicy crispy chicken burger', price: 400, image: 'https://via.placeholder.com/150', isAvailable: false },
        ],
        '2': [
          { _id: '201', name: 'Margherita Pizza', description: 'Classic cheese pizza', price: 800, image: 'https://via.placeholder.com/150', isAvailable: true },
          { _id: '202', name: 'Pepperoni Pizza', description: 'Pepperoni with extra cheese', price: 950, image: 'https://via.placeholder.com/150', isAvailable: true },
        ],
        '3': [
          { _id: '301', name: 'Chicken Biryani', description: 'Fragrant rice with chicken', price: 300, image: 'https://via.placeholder.com/150', isAvailable: true },
          { _id: '302', name: 'Beef Biryani', description: 'Spicy beef biryani', price: 350, image: 'https://via.placeholder.com/150', isAvailable: true },
        ],
      };
      
      setMenuItems(mockMenuItems[categoryId] || []);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
      handleApiError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  // Handle category selection
  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
  };

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.show('Please enter a category name', 'error');
      return;
    }

    try {
      // In production: await api.post(`/restaurants/${restaurantId}/categories`, { name: newCategory.trim() });
      const newCat = {
        _id: Date.now().toString(),
        name: newCategory.trim(),
        items: []
      };
      
      setCategories(prev => [...prev, newCat]);
      setSelectedCategory(newCat);
      setShowCategoryModal(false);
      setNewCategory('');
      showSuccess(toast, 'Category added successfully');
    } catch (error) {
      console.error('Error adding category:', error);
      handleApiError(error, toast);
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryId) => {
    try {
      // In production: await api.delete(`/restaurants/${restaurantId}/categories/${categoryId}`);
      setCategories(prev => prev.filter(cat => cat._id !== categoryId));
      if (selectedCategory && selectedCategory._id === categoryId) {
        setSelectedCategory(null);
      }
      showSuccess(toast, 'Category deleted');
    } catch (error) {
      console.error('Error deleting category:', error);
      handleApiError(error, toast);
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        toast.show('We need access to your photos', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (result.canceled) return;

      const asset = result.assets && result.assets[0];
      if (asset?.uri) {
        const name = asset.fileName || asset.uri.split('/').pop() || 'menu_item.jpg';
        setFormData(prev => ({
          ...prev,
          image: {
            uri: asset.uri,
            type: 'image/jpeg',
            fileName: name,
          },
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      toast.show('Failed to pick image', 'error');
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        toast.show('We need camera permission to take photos', 'error');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (result.canceled) return;

      const asset = result.assets && result.assets[0];
      if (asset?.uri) {
        const name = asset.fileName || `photo_${Date.now()}.jpg`;
        setFormData(prev => ({
          ...prev,
          image: {
            uri: asset.uri,
            type: 'image/jpeg',
            fileName: name,
          },
        }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      toast.show('Failed to take photo', 'error');
    }
  };

  // Show image picker options
  const showImagePickerOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: pickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // Upload image to server (mock implementation for development)
  const uploadImageToServer = async (imageUri) => {
    // In production, implement actual image upload to your server or cloud storage
    // For development, we'll just return the local URI
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(imageUri.uri);
      }, 1000);
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      toast.show('Please fill in all required fields', 'error');
      return;
    }

    if (!selectedCategory) {
      toast.show('Please select a category first', 'error');
      return;
    }

    setUploading(true);

    try {
      let imageUrl = formData.image?.uri || 'https://via.placeholder.com/150';

      // Upload image if it's a new image (not a URL)
      if (formData.image && !formData.image.uri.startsWith('http')) {
        imageUrl = await uploadImageToServer(formData.image);
      }

      const menuItem = {
        _id: editingItem?._id || Date.now().toString(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: selectedCategory._id,
        isAvailable: formData.isAvailable,
        image: imageUrl,
      };

      // In production: Make API call to save the menu item
      // if (editingItem) {
      //   await api.put(`/restaurants/${restaurantId}/menu/${editingItem._id}`, menuItem);
      // } else {
      //   await api.post(`/restaurants/${restaurantId}/menu`, menuItem);
      // }

      // For development, update local state
      if (editingItem) {
        setMenuItems(prev => 
          prev.map(item => 
            item._id === editingItem._id ? menuItem : item
          )
        );
        showSuccess(toast, 'Menu item updated');
      } else {
        setMenuItems(prev => [...prev, menuItem]);
        showSuccess(toast, 'Menu item added');
      }

      setShowAddModal(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      console.error('Error saving menu item:', error);
      handleApiError(error, toast);
    } finally {
      setUploading(false);
    }
  };

  // Handle delete confirmation
  const handleDelete = (itemId, type = 'item', name = '') => {
    setConfirmDelete({ 
      visible: true, 
      id: itemId, 
      type,
      name: name || 'this item' 
    });
  };

  // Confirm delete action
  const confirmDeleteAction = async () => {
    try {
      if (confirmDelete.type === 'category') {
        handleDeleteCategory(confirmDelete.id);
      } else {
        // In production: await api.delete(`/restaurants/${restaurantId}/menu/${confirmDelete.id}`);
        setMenuItems(prev => prev.filter(item => item._id !== confirmDelete.id));
        showSuccess(toast, 'Item deleted');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      handleApiError(error, toast);
    } finally {
      setConfirmDelete({ visible: false, id: null, type: 'item', name: '' });
    }
  };

  // Render category item
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory?._id === item._id && styles.selectedCategoryItem,
      ]}
      onPress={() => handleSelectCategory(item)}
      onLongPress={() => handleDelete(item._id, 'category', item.name)}
    >
      <Text 
        style={[
          styles.categoryText,
          selectedCategory?._id === item._id && styles.selectedCategoryText,
        ]}
      >
        {item.name}
      </Text>
      {item.items && item.items.length > 0 && (
        <Text style={styles.categoryItemCount}>
          {item.items.length}
        </Text>
      )}
    </TouchableOpacity>
  );

  // Render add category button
  const renderAddCategoryButton = () => (
    <TouchableOpacity
      style={styles.addCategoryButton}
      onPress={() => setShowCategoryModal(true)}
    >
      <Icon name="add" size={20} color={colors.primary} />
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="restaurant-outline" size={64} color={colors.gray} />
      <Text style={styles.emptyText}>No items in this category</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonText}>Add Your First Item</Text>
      </TouchableOpacity>
    </View>
  );

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

  // Render menu item
  const renderMenuItem = ({ item }) => (
    <TouchableOpacity
      style={styles.menuCard}
      onPress={() => handleEdit(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/80' }}
        style={styles.menuImage}
        resizeMode="cover"
      />
      <View style={styles.menuInfo}>
        <View style={styles.menuHeader}>
          <Text style={styles.menuName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.menuPrice}>Rs. {item.price}</Text>
        </View>
        
        {item.description ? (
          <Text style={styles.menuDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        
        <View style={styles.menuFooter}>
          <View style={[
            styles.availabilityBadge,
            { backgroundColor: item.isAvailable ? '#e6f7ee' : '#fee2e2' }
          ]}>
            <View style={[
              styles.availabilityDot,
              { backgroundColor: item.isAvailable ? colors.success : colors.error }
            ]} />
            <Text style={[
              styles.availabilityText,
              { 
                color: item.isAvailable ? colors.success : colors.error,
                marginLeft: 10
              }
            ]}>
              {item.isAvailable ? 'Available' : 'Out of Stock'}
            </Text>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleEdit(item);
              }}
            >
              <Icon name="create-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(item._id, 'item', item.name);
              }}
            >
              <Icon name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Show loading state
  if (loading && !refreshing) {
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
          onPress={() => navigation.goBack()}
          style={styles.backButton}
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

      {/* Categories List */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={item => item._id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          ListFooterComponent={renderAddCategoryButton()}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {selectedCategory ? (
          menuItems.length > 0 ? (
            <FlatList
              data={menuItems}
              renderItem={renderMenuItem}
              keyExtractor={item => item._id}
              contentContainerStyle={styles.menuList}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                />
              }
            />
          ) : (
            <ScrollView
              contentContainerStyle={styles.emptyContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                />
              }
            >
              <Icon name="fast-food-outline" size={80} color={colors.lightGray} />
              <Text style={styles.emptyTitle}>No items in this category</Text>
              <Text style={styles.emptySubtitle}>
                Add your first menu item to get started
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.addButtonText}>Add Menu Item</Text>
              </TouchableOpacity>
            </ScrollView>
          )
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="folder-open-outline" size={80} color={colors.lightGray} />
            <Text style={styles.emptyTitle}>No Category Selected</Text>
            <Text style={styles.emptySubtitle}>
              Select a category or create a new one to add menu items
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={styles.addButtonText}>Create Category</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Add/Edit Menu Item Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddModal(false);
          setEditingItem(null);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
              >
                <Icon name="close" size={24} color={colors.darkGray} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Item Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({...formData, name: text})}
                  placeholder="Enter item name"
                  placeholderTextColor={colors.gray}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({...formData, description: text})}
                  placeholder="Enter item description"
                  placeholderTextColor={colors.gray}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Price (PKR) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price}
                  onChangeText={(text) => setFormData({...formData, price: text})}
                  placeholder="Enter price"
                  placeholderTextColor={colors.gray}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formGroup, styles.availabilityContainer]}>
                <Text style={styles.label}>Available</Text>
                <Switch
                  value={formData.isAvailable}
                  onValueChange={(value) => setFormData({...formData, isAvailable: value})}
                  trackColor={{ false: colors.lightGray, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Item Image</Text>
                <TouchableOpacity 
                  style={styles.imagePicker}
                  onPress={showImagePickerOptions}
                >
                  {formData.image ? (
                    <Image 
                      source={{ uri: formData.image.uri }} 
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Icon name="camera" size={32} color={colors.gray} />
                      <Text style={styles.imagePlaceholderText}>
                        Tap to add a photo
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, uploading && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxWidth: 400 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Icon name="close" size={24} color={colors.darkGray} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Category Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newCategory}
                  onChangeText={setNewCategory}
                  placeholder="Enter category name"
                  placeholderTextColor={colors.gray}
                />
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleAddCategory}
              >
                <Text style={styles.saveButtonText}>Add Category</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={confirmDelete.visible}
        title={`Delete ${confirmDelete.type === 'category' ? 'Category' : 'Item'}`}
        message={`Are you sure you want to delete ${confirmDelete.name || 'this item'}?`}
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ ...confirmDelete, visible: false })}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.primary,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
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
  categoriesContainer: {
    padding: 16,
  },
  categoriesList: {
    paddingVertical: 8,
  },
  categoryItem: {
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCategoryItem: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  selectedCategoryText: {
    color: colors.white,
  },
  categoryItemCount: {
    fontSize: 12,
    color: colors.text.secondary,
    position: 'absolute',
    top: 12,
    right: 12,
  },
  addCategoryButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  menuList: {
    padding: 16,
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
