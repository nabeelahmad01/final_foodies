// src/screens/rider/DeliveryScreen.js (WITHOUT EXPO)
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import api from '../../services/api';
import colors from '../../styles/colors';
import { ORDER_STATUS } from '../../utils/constants';

const DeliveryScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState('pickup'); // pickup, delivering, delivered

  useEffect(() => {
    fetchOrderDetails();
    acceptDelivery();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data.order);

      if (response.data.order.status === ORDER_STATUS.OUT_FOR_DELIVERY) {
        setCurrentStep('delivering');
      }

      setIsLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch order details');
      navigation.goBack();
    }
  };

  const acceptDelivery = async () => {
    try {
      await api.put(`/orders/${orderId}/accept-delivery`);
    } catch (error) {
      console.error('Failed to accept delivery:', error);
    }
  };

  const handleCallRestaurant = () => {
    if (order?.restaurantId?.phone) {
      Linking.openURL(`tel:${order.restaurantId.phone}`);
    } else {
      Alert.alert('Error', 'Restaurant phone number not available');
    }
  };

  const handleCallCustomer = () => {
    if (order?.userId?.phone) {
      Linking.openURL(`tel:${order.userId.phone}`);
    } else {
      Alert.alert('Error', 'Customer phone number not available');
    }
  };

  const handleNavigate = destination => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps');
    });
  };

  const handlePickedUp = async () => {
    Alert.alert(
      'Confirm Pickup',
      'Have you picked up the order from the restaurant?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await api.put(`/orders/${orderId}/status`, {
                status: ORDER_STATUS.OUT_FOR_DELIVERY,
              });
              setCurrentStep('delivering');
              Alert.alert('Success', 'Order marked as picked up');
              fetchOrderDetails();
            } catch (error) {
              Alert.alert('Error', 'Failed to update status');
            }
          },
        },
      ],
    );
  };

  const handleDelivered = async () => {
    Alert.alert(
      'Confirm Delivery',
      'Have you delivered the order to the customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await api.put(`/orders/${orderId}/complete-delivery`);
              Alert.alert(
                'Delivery Completed! 🎉',
                'Great job! Your earnings have been updated.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('RiderDashboard'),
                  },
                ],
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to complete delivery');
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={60} color={colors.error} />
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const restaurantLocation = {
    latitude: order?.restaurantId?.location?.coordinates[1] || 31.5204,
    longitude: order?.restaurantId?.location?.coordinates[0] || 74.3587,
  };

  const deliveryLocation = {
    latitude: order?.deliveryCoordinates?.latitude || 31.4697,
    longitude: order?.deliveryCoordinates?.longitude || 74.2728,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery #{order._id.slice(-6)}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: 31.4952,
              longitude: 74.3157,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
          >
            <Marker
              coordinate={restaurantLocation}
              title="Restaurant"
              pinColor={colors.primary}
            >
              <Icon name="restaurant" size={30} color={colors.primary} />
            </Marker>
            <Marker
              coordinate={deliveryLocation}
              title="Customer Location"
              pinColor={colors.success}
            >
              <Icon name="location" size={30} color={colors.success} />
            </Marker>
            <Polyline
              coordinates={[restaurantLocation, deliveryLocation]}
              strokeColor={colors.primary}
              strokeWidth={3}
            />
          </MapView>
        </View>

        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                currentStep !== 'pickup' && styles.stepDotCompleted,
              ]}
            >
              <Icon
                name={currentStep !== 'pickup' ? 'checkmark' : 'restaurant'}
                size={16}
                color={colors.white}
              />
            </View>
            <Text style={styles.stepLabel}>Pickup</Text>
          </View>

          <View style={styles.stepLine} />

          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                currentStep === 'delivered' && styles.stepDotCompleted,
              ]}
            >
              <Icon
                name={currentStep === 'delivered' ? 'checkmark' : 'bicycle'}
                size={16}
                color={colors.white}
              />
            </View>
            <Text style={styles.stepLabel}>Delivering</Text>
          </View>

          <View style={styles.stepLine} />

          <View style={styles.stepItem}>
            <View style={styles.stepDot}>
              <Icon name="location" size={16} color={colors.white} />
            </View>
            <Text style={styles.stepLabel}>Delivered</Text>
          </View>
        </View>

        {/* Restaurant Details */}
        {currentStep === 'pickup' && (
          <View style={styles.detailCard}>
            <View style={styles.cardHeader}>
              <Icon name="restaurant" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>Pickup from Restaurant</Text>
            </View>
            <Text style={styles.locationName}>
              {order.restaurantId?.name || 'Restaurant'}
            </Text>
            <Text style={styles.locationAddress}>
              {order.restaurantId?.address || 'Address not available'}
            </Text>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCallRestaurant}
              >
                <Icon name="call" size={20} color={colors.primary} />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navigateButton}
                onPress={() =>
                  handleNavigate(
                    `${restaurantLocation.latitude},${restaurantLocation.longitude}`,
                  )
                }
              >
                <Icon name="navigate" size={20} color={colors.white} />
                <Text style={styles.navigateButtonText}>Navigate</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Customer Details */}
        {currentStep !== 'pickup' && (
          <View style={styles.detailCard}>
            <View style={styles.cardHeader}>
              <Icon name="location" size={24} color={colors.success} />
              <Text style={styles.cardTitle}>Deliver to Customer</Text>
            </View>
            <Text style={styles.locationName}>
              {order.userId?.name || 'Customer'}
            </Text>
            <Text style={styles.locationAddress}>{order.deliveryAddress}</Text>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCallCustomer}
              >
                <Icon name="call" size={20} color={colors.primary} />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navigateButton}
                onPress={() =>
                  handleNavigate(
                    `${deliveryLocation.latitude},${deliveryLocation.longitude}`,
                  )
                }
              >
                <Icon name="navigate" size={20} color={colors.white} />
                <Text style={styles.navigateButtonText}>Navigate</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Order Items */}
        <View style={styles.itemsCard}>
          <Text style={styles.itemsTitle}>Order Items</Text>
          {order.items?.map((item, index) => (
            <Text key={index} style={styles.itemText}>
              {item.quantity}x {item.name}
            </Text>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>Rs. {order.totalAmount}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Method</Text>
            <Text style={styles.paymentValue}>
              {order.paymentMethod === 'cash'
                ? 'Cash on Delivery'
                : 'Paid Online'}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          {currentStep === 'pickup' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handlePickedUp}
            >
              <Icon name="checkmark-circle" size={24} color={colors.white} />
              <Text style={styles.actionButtonText}>
                Picked Up from Restaurant
              </Text>
            </TouchableOpacity>
          )}

          {currentStep === 'delivering' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelivered}
            >
              <Icon name="checkmark-circle" size={24} color={colors.white} />
              <Text style={styles.actionButtonText}>Mark as Delivered</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Chat Button */}
        {currentStep !== 'pickup' && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() =>
              navigation.navigate('ChatScreen', {
                orderId: order._id,
                receiverName: order.userId?.name || 'Customer',
              })
            }
          >
            <Icon name="chatbubbles" size={20} color={colors.primary} />
            <Text style={styles.chatButtonText}>Chat with Customer</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.primary,
  },
  headerBackButton: {
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
  },
  placeholder: {
    width: 40,
  },
  mapContainer: {
    height: 200,
    backgroundColor: colors.lightGray,
  },
  map: {
    flex: 1,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.white,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepDotCompleted: {
    backgroundColor: colors.success,
  },
  stepLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 8,
    marginBottom: 28,
  },
  detailCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  locationAddress: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  navigateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    gap: 8,
  },
  navigateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  itemsCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  itemText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  chatButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 24,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 24,
  },
  backButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default DeliveryScreen;
