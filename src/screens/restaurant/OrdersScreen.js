// src/screens/restaurant/OrdersScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import colors from '../../styles/colors';
import { ORDER_STATUS, API_URL } from '../../utils/constants';
import io from 'socket.io-client';

const OrdersScreen = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [restaurantId, setRestaurantId] = useState(null);

  useEffect(() => {
    fetchRestaurant();
  }, []);

  useEffect(() => {
    if (restaurantId) {
      fetchOrders();
      setupSocketListeners();
    }
  }, [restaurantId]);

  const fetchRestaurant = async () => {
    try {
      const response = await api.get('/restaurants');
      const myRestaurant = response.data.restaurants.find(
        r => r.ownerId._id === user._id || r.ownerId === user._id,
      );
      if (myRestaurant) {
        setRestaurantId(myRestaurant._id);
      }
    } catch (error) {
      console.error('Failed to fetch restaurant:', error);
    }
  };

  const setupSocketListeners = () => {
    const socket = io(API_URL.replace('/api', ''));

    socket.on('newOrder', data => {
      if (data.restaurantId === restaurantId) {
        fetchOrders();
        Alert.alert('New Order! 🎉', 'You have a new order');
      }
    });

    return () => socket.disconnect();
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get(`/restaurants/${restaurantId}/orders`);
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleAcceptOrder = async orderId => {
    try {
      await api.put(`/orders/${orderId}/accept`);
      Alert.alert('Success', 'Order accepted');
      fetchOrders();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept order');
    }
  };

  const handleRejectOrder = async orderId => {
    Alert.alert('Reject Order', 'Are you sure you want to reject this order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.put(`/orders/${orderId}/reject`, {
              reason: 'Unable to fulfill order',
            });
            Alert.alert('Success', 'Order rejected');
            fetchOrders();
          } catch (error) {
            Alert.alert('Error', 'Failed to reject order');
          }
        },
      },
    ]);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      Alert.alert('Success', 'Order status updated');
      fetchOrders();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const filterOrders = () => {
    if (filter === 'all') return orders;
    if (filter === 'pending') {
      return orders.filter(o => o.status === ORDER_STATUS.PENDING);
    }
    if (filter === 'active') {
      return orders.filter(o =>
        [ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING].includes(o.status),
      );
    }
    if (filter === 'completed') {
      return orders.filter(o =>
        [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(o.status),
      );
    }
    return orders;
  };

  const getStatusColor = status => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return colors.warning;
      case ORDER_STATUS.ACCEPTED:
      case ORDER_STATUS.PREPARING:
        return colors.primary;
      case ORDER_STATUS.OUT_FOR_DELIVERY:
        return '#2196F3';
      case ORDER_STATUS.DELIVERED:
        return colors.success;
      case ORDER_STATUS.CANCELLED:
        return colors.error;
      default:
        return colors.gray;
    }
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item._id.slice(-6)}</Text>
          <Text style={styles.orderTime}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.customerInfo}>
        <Icon name="person" size={16} color={colors.text.secondary} />
        <Text style={styles.customerName}>{item.userId?.name}</Text>
      </View>

      <View style={styles.itemsList}>
        {item.items.map((orderItem, index) => (
          <Text key={index} style={styles.itemText}>
            {orderItem.quantity}x {orderItem.name}
          </Text>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.totalAmount}>Rs. {item.totalAmount}</Text>

        {item.status === ORDER_STATUS.PENDING && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleRejectOrder(item._id)}
            >
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={() => handleAcceptOrder(item._id)}
            >
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === ORDER_STATUS.ACCEPTED && (
          <TouchableOpacity
            style={styles.preparingBtn}
            onPress={() => handleUpdateStatus(item._id, ORDER_STATUS.PREPARING)}
          >
            <Text style={styles.preparingText}>Start Preparing</Text>
          </TouchableOpacity>
        )}

        {item.status === ORDER_STATUS.PREPARING && (
          <TouchableOpacity
            style={styles.readyBtn}
            onPress={() =>
              handleUpdateStatus(item._id, ORDER_STATUS.OUT_FOR_DELIVERY)
            }
          >
            <Text style={styles.readyText}>Mark Ready</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (!restaurantId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Orders</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text>Loading restaurant...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.filterContainer}>
        {['all', 'pending', 'active', 'completed'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text
              style={[
                styles.filterText,
                filter === tab && styles.filterTextActive,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filterOrders()}
        renderItem={renderOrder}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="receipt-outline" size={80} color={colors.lightGray} />
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        }
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  orderTime: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  customerName: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  itemsList: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  itemText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rejectBtn: {
    backgroundColor: colors.error + '20',
  },
  acceptBtn: {
    backgroundColor: colors.success,
  },
  rejectText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 14,
  },
  acceptText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  preparingBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  preparingText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  readyBtn: {
    backgroundColor: colors.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  readyText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
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
  },
});

export default OrdersScreen;
