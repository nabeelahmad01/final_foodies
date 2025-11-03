// src/screens/user/RestaurantDetailScreen.js
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { addToCart } from '../../redux/slices/cartSlice';
import { fetchRestaurantById } from '../../redux/slices/restaurantSlice';
import colors from '../../styles/colors';
import Analytics from '../../services/analytics';
import { useToast } from '../../context.js/ToastContext';
import { showSuccess } from '../../utils/helpers';
import ConfirmModal from '../../components/ConfirmModal';
import { t, useLanguageRerender } from '../../utils/i18n';

const RestaurantDetailScreen = ({ route, navigation }) => {
  useLanguageRerender();
  const { restaurant } = route.params;
  const dispatch = useDispatch();
  const toast = useToast();
  const { selectedRestaurant, isLoading } = useSelector(
    state => state.restaurant,
  );
  const { restaurantId } = useSelector(state => state.cart);
  const [confirmReplace, setConfirmReplace] = React.useState({ visible: false, item: null });

  useEffect(() => {
    dispatch(fetchRestaurantById(restaurant._id));
  }, [dispatch, restaurant._id]);
useEffect(() => {
  // Track restaurant view
  Analytics.logViewItem({
    id: restaurant._id,
    name: restaurant.name,
    category: restaurant.cuisineType?.join(', '),
  });
}, [restaurant]);

  const handleAddToCart = item => {
    // Check if adding from different restaurant
    Analytics.logAddToCart(item);
    if (restaurantId && restaurantId !== restaurant._id) {
      setConfirmReplace({ visible: true, item });
    } else {
      dispatch(addToCart({ item, restaurant }));
      showSuccess(toast, t('cart.itemAdded'));
    }
  };

  const menuItems = selectedRestaurant?.menuItems || restaurant.menuItems || [];

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{restaurant.name}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Restaurant Cover Image */}
        <Image
          source={{
            uri: restaurant.images?.[0] || 'https://via.placeholder.com/400',
          }}
          style={styles.coverImage}
        />

        {/* Restaurant Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.cuisine}>
            {restaurant.cuisineType?.join(', ')}
          </Text>

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Icon name="star" size={18} color={colors.warning} />
              <Text style={styles.metaText}>
                {restaurant.rating || '4.5'} ({restaurant.totalReviews || '0'}{' '}
                reviews)
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Icon
                name="time-outline"
                size={18}
                color={colors.text.secondary}
              />
              <Text style={styles.metaText}>30-40 mins</Text>
            </View>
          </View>

          {restaurant.description && (
            <Text style={styles.description}>{restaurant.description}</Text>
          )}
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>{t('restaurant.menu')}</Text>

          {menuItems.map(item => (
            <View key={item._id} style={styles.menuItem}>
              <View style={styles.menuItemInfo}>
                <View style={styles.menuItemLeft}>
                  <Image
                    source={{
                      uri: item.image || 'https://via.placeholder.com/80',
                    }}
                    style={styles.menuItemImage}
                  />
                </View>
                <View style={styles.menuItemDetails}>
                  <Text style={styles.menuItemName}>{item.name}</Text>
                  <Text style={styles.menuItemDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <Text style={styles.menuItemPrice}>Rs. {item.price}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddToCart(item)}
              >
                <Icon name="add" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
      <ConfirmModal
        visible={confirmReplace.visible}
        title={t('restaurantDetail.replaceTitle')}
        message={t('restaurantDetail.replaceMsg')}
        confirmText={t('common.yes')}
        cancelText={t('common.cancel')}
        onCancel={() => setConfirmReplace({ visible: false, item: null })}
        onConfirm={() => {
          const item = confirmReplace.item;
          setConfirmReplace({ visible: false, item: null });
          dispatch(addToCart({ item, restaurant }));
          showSuccess(toast, t('cart.itemAdded'));
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.primary,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  coverImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.lightGray,
  },
  infoContainer: {
    backgroundColor: colors.white,
    padding: 20,
    marginBottom: 16,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  cuisine: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  menuSection: {
    backgroundColor: colors.white,
    padding: 20,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  menuItemLeft: {
    width: 80,
    height: 80,
  },
  menuItemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: colors.lightGray,
  },
  menuItemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  menuItemDesc: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 6,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});

export default RestaurantDetailScreen;
