// src/screens/user/CartScreen.js
import React from 'react';
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
import {
  addToCart,
  removeFromCart,
  clearCart,
} from '../../redux/slices/cartSlice';
import colors from '../../styles/colors';
import ConfirmModal from '../../components/ConfirmModal';
import { t, useLanguageRerender } from '../../utils/i18n';

const CartScreen = ({ navigation }) => {
  useLanguageRerender();
  const dispatch = useDispatch();
  const { items, restaurantName, totalAmount } = useSelector(
    state => state.cart,
  );

  const deliveryFee = 100;
  const tax = Math.round(totalAmount * 0.1);
  const grandTotal = totalAmount + deliveryFee + tax;

  const handleRemove = itemId => {
    dispatch(removeFromCart(itemId));
  };

  const handleAdd = item => {
    dispatch(addToCart({ item, restaurant: { name: restaurantName } }));
  };

  const [confirmClear, setConfirmClear] = React.useState(false);
  const handleClearCart = () => setConfirmClear(true);

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('cart.title')}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="cart-outline" size={100} color={colors.lightGray} />
          <Text style={styles.emptyText}>{t('cart.empty')}</Text>
          <Text style={styles.emptySubtext}>{t('cart.addItems')}</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          >
            <Text style={styles.browseButtonText}>{t('home.popularRestaurants')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('cart.title')}</Text>
        <TouchableOpacity onPress={handleClearCart}>
          <Text style={styles.clearButton}>{t('common.delete')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Restaurant Info */}
        <View style={styles.restaurantBanner}>
          <Icon name="restaurant" size={20} color={colors.primary} />
          <Text style={styles.restaurantName}>{restaurantName}</Text>
        </View>

        {/* Cart Items */}
        <View style={styles.itemsContainer}>
          {items.map(item => (
            <View key={item.id} style={styles.cartItem}>
              <Image
                source={{ uri: item.image || 'https://via.placeholder.com/60' }}
                style={styles.itemImage}
              />

              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>Rs. {item.price}</Text>
              </View>

              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleRemove(item.id)}
                >
                  <Icon name="remove" size={16} color={colors.primary} />
                </TouchableOpacity>

                <Text style={styles.quantity}>{item.quantity}</Text>

                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleAdd(item)}
                >
                  <Icon name="add" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={styles.addressContainer}>
          <Text style={styles.sectionTitle}>{t('profile.savedAddresses')}</Text>
          <View style={styles.addressCard}>
            <Icon name="location" size={20} color={colors.primary} />
            <View style={styles.addressDetails}>
              <Text style={styles.addressLabel}>Home</Text>
              <Text style={styles.addressText}>Johar Town, Lahore</Text>
            </View>
            <TouchableOpacity>
              <Icon name="chevron-forward" size={20} color={colors.gray} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bill Summary */}
        <View style={styles.billContainer}>
          <Text style={styles.sectionTitle}>{t('cart.total')}</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>{t('cart.subtotal')}</Text>
            <Text style={styles.billValue}>Rs. {totalAmount}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>{t('cart.deliveryFee')}</Text>
            <Text style={styles.billValue}>Rs. {deliveryFee}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>{t('cart.tax')}</Text>
            <Text style={styles.billValue}>Rs. {tax}</Text>
          </View>

          <View style={[styles.billRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{t('cart.total')}</Text>
            <Text style={styles.totalValue}>Rs. {grandTotal}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.checkoutContainer}>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutText}>{t('cart.checkout')}</Text>
          <Icon name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Confirm Clear Modal */}
      <ConfirmModal
        visible={confirmClear}
        title={t('cart.clearTitle')}
        message={t('cart.clearMsg')}
        confirmText={t('common.yes')}
        cancelText={t('common.cancel')}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false);
          dispatch(clearCart());
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  clearButton: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
  },
  browseButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 24,
  },
  browseButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  restaurantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  itemsContainer: {
    backgroundColor: colors.white,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.lightGray,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    minWidth: 24,
    textAlign: 'center',
  },
  addressContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  addressDetails: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  billContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 100,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  billValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});

export default CartScreen;
