// src/screens/user/CheckoutScreen.js (Expo Go Compatible)
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { createOrder } from '../../redux/slices/orderSlice';
import { clearCart } from '../../redux/slices/cartSlice';
import api from '../../services/api';
import colors from '../../styles/colors';
import { PAYMENT_METHODS } from '../../utils/constants';
import { useToast } from '../../context.js/ToastContext';
import { handleApiError, showSuccess } from '../../utils/helpers';
import { t, useLanguageRerender } from '../../utils/i18n';
import PromoCodeInput from '../../components/PromoCodeInput';
import ConfirmModal from '../../components/ConfirmModal';

const CheckoutScreen = ({ navigation, route }) => {
  useLanguageRerender();
  const dispatch = useDispatch();
  const toast = useToast();
  const { items, totalAmount, restaurantId } = useSelector(state => state.cart);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.WALLET);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(route?.params?.selectedAddress || null);
  const [promo, setPromo] = useState({ code: '', discount: 0 });
  const [confirmWallet, setConfirmWallet] = useState(false);

  const deliveryFee = 100;
  const tax = Math.round(totalAmount * 0.1);
  const discount = useMemo(() => Math.min(Math.round((totalAmount + deliveryFee + tax) * (promo.discount || 0)), 999999), [promo.discount, totalAmount, deliveryFee, tax]);
  const grandTotal = Math.max(totalAmount + deliveryFee + tax - discount, 0);

  // NOTE: Stripe payment removed for Expo Go testing
  // In production build, add Stripe back

  const handlePayWithWallet = async () => {
    setConfirmWallet(true);
  };

  const applyPromo = async (code) => {
    // Simple demo: if code is FOOD10 -> 10% off
    if (code.toUpperCase() === 'FOOD10') {
      setPromo({ code, discount: 0.1 });
      showSuccess(toast, t('checkout.promoApplied'));
    } else {
      setPromo({ code: '', discount: 0 });
      toast.show(t('checkout.invalidPromo'), 'error');
    }
  };

  const createOrderInDB = async () => {
    try {
      const orderData = {
        restaurantId,
        items: items.map(item => ({
          menuItemId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: grandTotal,
        deliveryAddress: selectedAddress?.address || 'Home - Johar Town, Lahore',
        deliveryCoords: selectedAddress?.coords || undefined,
        promoCode: promo.code || undefined,
        paymentMethod,
      };

      const result = await dispatch(createOrder(orderData)).unwrap();

      setIsProcessing(false);
      dispatch(clearCart());
      showSuccess(toast, t('checkout.orderPlaced'));
      navigation.replace('OrderTracking', { orderId: result._id });
    } catch (error) {
      setIsProcessing(false);
      handleApiError(error, toast);
    }
  };

  const handlePlaceOrder = () => {
    // For Expo Go testing, only wallet payment
    if (paymentMethod === PAYMENT_METHODS.CARD) {
      // Replace Alert with toast per UX guidelines
      toast.show(t('checkout.expoGoCardToast'), 'info');
      setPaymentMethod(PAYMENT_METHODS.WALLET);
      handlePayWithWallet();
    } else {
      handlePayWithWallet();
    }
  };

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
        <Text style={styles.headerTitle}>{t('checkout.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('checkout.paymentMethod')}</Text>

          <TouchableOpacity
            style={[
              styles.paymentCard,
              paymentMethod === PAYMENT_METHODS.CARD && styles.selectedCard,
            ]}
            onPress={() => setPaymentMethod(PAYMENT_METHODS.CARD)}
          >
            <Icon
              name="card"
              size={24}
              color={
                paymentMethod === PAYMENT_METHODS.CARD
                  ? colors.primary
                  : colors.gray
              }
            />
            <Text style={styles.paymentLabel}>{t('checkout.card')}</Text>
            <Text style={styles.expoWarning}>{t('checkout.cardUnavailable')}</Text>
            <View style={styles.radioOuter}>
              {paymentMethod === PAYMENT_METHODS.CARD && (
                <View style={styles.radioInner} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentCard,
              paymentMethod === PAYMENT_METHODS.WALLET && styles.selectedCard,
            ]}
            onPress={() => setPaymentMethod(PAYMENT_METHODS.WALLET)}
          >
            <Icon
              name="wallet"
              size={24}
              color={
                paymentMethod === PAYMENT_METHODS.WALLET
                  ? colors.primary
                  : colors.gray
              }
            />
            <Text style={styles.paymentLabel}>{t('checkout.wallet')}</Text>
            <Text style={styles.walletBalance}>{t('checkout.walletBalance')}</Text>
            <View style={styles.radioOuter}>
              {paymentMethod === PAYMENT_METHODS.WALLET && (
                <View style={styles.radioInner} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Expo Go Notice */}
        <View style={styles.noticeCard}>
          <Icon name="information-circle" size={24} color={colors.warning} />
          <Text style={styles.noticeText}>{t('checkout.notice')}</Text>
        </View>

        {/* Order Summary */
        }
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('checkout.orderSummary')}</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('checkout.totalAmount')}</Text>
              <Text style={styles.summaryValue}>Rs. {grandTotal}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('checkout.estimatedTime')}</Text>
              <Text style={styles.summaryValue}>30-40 mins</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('checkout.items')}</Text>
              <Text style={styles.summaryValue}>
                {items.reduce((sum, item) => sum + item.quantity, 0)} items
              </Text>
            </View>
            {!!promo.code && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Promo ({promo.code.toUpperCase()})</Text>
                <Text style={styles.summaryValue}>- Rs. {discount}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Delivery Address */
        }
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('checkout.deliveryAddress')}</Text>
          <View style={styles.addressCard}>
            <Icon name="location" size={20} color={colors.primary} />
            <View style={styles.addressDetails}>
              <Text style={styles.addressLabel}>{selectedAddress?.label || 'Home'}</Text>
              <Text style={styles.addressText}>{selectedAddress?.address || 'Johar Town, Lahore'}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('AddressPicker')}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>{t('checkout.chooseOnMap')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Promo Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('checkout.promoCode')}</Text>
          <PromoCodeInput onApply={applyPromo} />
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            isProcessing && styles.disabledButton,
          ]}
          onPress={handlePlaceOrder}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Icon name="checkmark-circle" size={20} color={colors.white} />
              <Text style={styles.buttonText}>{`${t('checkout.placeOrderWith')} ${grandTotal}`}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Confirm Wallet Payment */}
      <ConfirmModal
        visible={confirmWallet}
        title={t('checkout.payWithWalletTitle')}
        message={t('checkout.payWithWalletMsg')}
        confirmText={t('checkout.pay')}
        cancelText={t('common.cancel')}
        onCancel={() => setConfirmWallet(false)}
        onConfirm={async () => {
          setConfirmWallet(false);
          setIsProcessing(true);
          await createOrderInDB();
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
  placeholder: {
    width: 40,
  },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: '#FFF5F0',
  },
  paymentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  walletBalance: {
    fontSize: 14,
    color: colors.text.secondary,
    marginRight: 12,
  },
  expoWarning: {
    fontSize: 11,
    color: colors.warning,
    marginRight: 8,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
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
  buttonContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  placeOrderButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: colors.gray,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});

export default CheckoutScreen;
