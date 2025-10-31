// src/screens/user/OrderTrackingScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { trackOrder, updateOrderStatus } from '../../redux/slices/orderSlice';
import { ORDER_STATUS } from '../../utils/constants';
import colors from '../../styles/colors';
import io from 'socket.io-client';
import { API_URL } from '../../utils/constants';

const OrderTrackingScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const dispatch = useDispatch();
  const { trackingOrder } = useSelector(state => state.order);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    dispatch(trackOrder(orderId));

    // Connect to Socket.IO for real-time updates
    const newSocket = io(API_URL.replace('/api', ''));
    setSocket(newSocket);

    newSocket.emit('joinOrder', orderId);

    newSocket.on('orderUpdate', data => {
      dispatch(
        updateOrderStatus({ orderId: data.orderId, status: data.status }),
      );
    });

    return () => {
      newSocket.disconnect();
    };
  }, [dispatch, orderId]);

  if (!trackingOrder) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Track Order</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading order details...</Text>
        </View>
      </View>
    );
  }

  const getStatusSteps = () => {
    const steps = [
      {
        key: ORDER_STATUS.PENDING,
        label: 'Order Placed',
        icon: 'checkmark-circle',
      },
      {
        key: ORDER_STATUS.ACCEPTED,
        label: 'Accepted',
        icon: 'checkmark-circle',
      },
      { key: ORDER_STATUS.PREPARING, label: 'Preparing', icon: 'restaurant' },
      {
        key: ORDER_STATUS.OUT_FOR_DELIVERY,
        label: 'Out for Delivery',
        icon: 'bicycle',
      },
      { key: ORDER_STATUS.DELIVERED, label: 'Delivered', icon: 'gift' },
    ];

    const currentIndex = steps.findIndex(s => s.key === trackingOrder.status);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  const handleCallRider = () => {
    if (trackingOrder.riderId?.phone) {
      Linking.openURL(`tel:${trackingOrder.riderId.phone}`);
    }
  };

  const restaurantLocation = {
    latitude: 31.5204,
    longitude: 74.3587,
  };

  const deliveryLocation = {
    latitude: 31.4697,
    longitude: 74.2728,
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
        <Text style={styles.headerTitle}>Track Order</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map View */}
        <View style={styles.mapContainer}>
          <MapView
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
            />
            <Marker
              coordinate={deliveryLocation}
              title="Your Location"
              pinColor={colors.success}
            />
            <Polyline
              coordinates={[restaurantLocation, deliveryLocation]}
              strokeColor={colors.primary}
              strokeWidth={3}
            />
          </MapView>
        </View>

        {/* Order Status Timeline */}
        <View style={styles.timelineContainer}>
          {getStatusSteps().map((step, index) => (
            <View key={step.key} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.timelineIcon,
                    step.completed && styles.timelineIconCompleted,
                    step.active && styles.timelineIconActive,
                  ]}
                >
                  <Icon
                    name={step.icon}
                    size={20}
                    color={step.completed ? colors.white : colors.gray}
                  />
                </View>
                {index < getStatusSteps().length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      step.completed && styles.timelineLineCompleted,
                    ]}
                  />
                )}
              </View>
              <View style={styles.timelineRight}>
                <Text
                  style={[
                    styles.timelineLabel,
                    step.active && styles.timelineLabelActive,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Order Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Order Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID:</Text>
            <Text style={styles.detailValue}>
              #{trackingOrder._id.slice(-6)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Restaurant:</Text>
            <Text style={styles.detailValue}>
              {trackingOrder.restaurantId?.name || 'Restaurant'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Amount:</Text>
            <Text style={styles.detailValue}>
              Rs. {trackingOrder.totalAmount}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Items:</Text>
            <Text style={styles.detailValue}>
              {trackingOrder.items?.length || 0} items
            </Text>
          </View>
        </View>

        {/* Rider Info */}
        {trackingOrder.riderId && (
          <View style={styles.riderCard}>
            <View style={styles.riderInfo}>
              <View style={styles.riderAvatar}>
                <Icon name="person" size={24} color={colors.white} />
              </View>
              <View style={styles.riderDetails}>
                <Text style={styles.riderName}>
                  {trackingOrder.riderId.name || 'Delivery Rider'}
                </Text>
                <Text style={styles.riderVehicle}>Motorcycle • ABC-123</Text>
              </View>
            </View>
            <View style={styles.riderActions}>
              <TouchableOpacity
                style={styles.riderActionButton}
                onPress={handleCallRider}
              >
                <Icon name="call" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.riderActionButton}>
                <Icon name="chatbubble" size={20} color={colors.primary} />
              </TouchableOpacity>
              // In OrderTrackingScreen.js, add this button:
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() =>
                  navigation.navigate('ChatScreen', {
                    orderId: order._id,
                    receiverName: order.riderId?.name || 'Rider',
                  })
                }
              >
                <Icon name="chatbubbles" size={20} color={colors.white} />
                <Text style={styles.chatButtonText}>Chat with Rider</Text>
              </TouchableOpacity>
              ;
            </View>
          </View>
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
  header: {
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: 250,
    backgroundColor: colors.lightGray,
  },
  map: {
    flex: 1,
  },
  timelineContainer: {
    backgroundColor: colors.white,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineIconCompleted: {
    backgroundColor: colors.success,
  },
  timelineIconActive: {
    backgroundColor: colors.primary,
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: colors.border,
  },
  timelineLineCompleted: {
    backgroundColor: colors.success,
  },
  timelineRight: {
    flex: 1,
    paddingTop: 8,
  },
  timelineLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  timelineLabelActive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  detailsCard: {
    backgroundColor: colors.white,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  riderCard: {
    backgroundColor: colors.white,
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  riderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  riderVehicle: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  riderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  riderActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OrderTrackingScreen;
