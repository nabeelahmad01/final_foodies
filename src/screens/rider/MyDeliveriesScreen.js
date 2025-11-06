// src/screens/rider/MyDeliveriesScreen.js
import React, { useState, useEffect } from 'react';
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
import colors from '../../styles/colors';
import api from '../../services/api';

const MyDeliveriesScreen = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, completed, cancelled

  useEffect(() => {
    fetchDeliveries();
  }, [filter]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/rider/${user._id}?status=${filter}`);
      setDeliveries(response.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
      Alert.alert('Error', 'Failed to load deliveries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeliveries();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return colors.success;
      case 'cancelled':
        return colors.error;
      case 'out_for_delivery':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return 'checkmark-circle';
      case 'cancelled':
        return 'close-circle';
      case 'out_for_delivery':
        return 'bicycle';
      default:
        return 'time';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderDeliveryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.deliveryCard}
      onPress={() => navigation.navigate('OrderTracking', { orderId: item._id })}
    >
      <View style={styles.deliveryHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>Order #{item._id.slice(-6)}</Text>
          <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Icon name={getStatusIcon(item.status)} size={16} color={colors.white} />
          <Text style={styles.statusText}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.deliveryDetails}>
        <View style={styles.detailRow}>
          <Icon name="restaurant" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>{item.restaurantId?.name || 'Restaurant'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="location" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText} numberOfLines={1}>
            {item.deliveryAddress}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="person" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>{item.userId?.name || 'Customer'}</Text>
        </View>
      </View>

      <View style={styles.deliveryFooter}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>Rs. {item.totalAmount}</Text>
        </View>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => navigation.navigate('ChatScreen', {
            orderId: item._id,
            receiverName: item.userId?.name || 'Customer',
          })}
        >
          <Icon name="chatbubble" size={16} color={colors.primary} />
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (filterType, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === filterType && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Deliveries</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('delivered', 'Completed')}
        {renderFilterButton('cancelled', 'Cancelled')}
      </View>

      {/* Deliveries List */}
      <FlatList
        data={deliveries}
        renderItem={renderDeliveryItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="bicycle" size={64} color={colors.lightGray} />
            <Text style={styles.emptyText}>No deliveries found</Text>
            <Text style={styles.emptySubtext}>
              Your delivery history will appear here
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  deliveryCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  orderDate: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },
  deliveryDetails: {
    marginBottom: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  amountContainer: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
    gap: 4,
  },
  chatButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default MyDeliveriesScreen;
