// src/screens/rider/RiderDashboard.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Switch,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import colors from '../../styles/colors';

const RiderDashboard = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    todayEarnings: 0,
    activeOrders: 0,
    totalEarnings: 0,
  });
  const [availableOrders, setAvailableOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    if (isOnline) {
      const interval = setInterval(() => {
        fetchAvailableOrders();
      }, 5000); // Poll every 5 seconds when online
      return () => clearInterval(interval);
    }
  }, [isOnline]);

  const fetchDashboardData = async () => {
    try {
      // Fetch rider stats
      const statsRes = await api.get('/riders/dashboard');
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const fetchAvailableOrders = async () => {
    try {
      const response = await api.get('/orders/rider/available');
      setAvailableOrders(response.data.orders);
    } catch (error) {
      console.error('Failed to fetch available orders:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    if (isOnline) {
      await fetchAvailableOrders();
    }
    setRefreshing(false);
  };

  const toggleOnlineStatus = () => {
    if (!isOnline) {
      if (user.kycStatus !== 'approved') {
        Alert.alert(
          'KYC Required',
          'Please complete KYC verification to go online',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Complete KYC',
              onPress: () => navigation.navigate('KYCUpload'),
            },
          ]
        );
        return;
      }
    }
    setIsOnline(!isOnline);
  };

  const handleAcceptOrder = (orderId) => {
    Alert.alert(
      'Accept Delivery',
      'Do you want to accept this delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => navigation.navigate('DeliveryScreen', { orderId }),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Rider Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome, {user?.name}!</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Icon name="person-circle-outline" size={32} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Online/Offline Toggle */}
        <View style={styles.statusCard}>
          <View style={styles.statusLeft}>
            <Icon
              name={isOnline ? 'bicycle' : 'pause-circle'}
              size={32}
              color={isOnline ? colors.success : colors.gray}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Status</Text>
              <Text style={[styles.statusText, { color: isOnline ? colors.success : colors.gray }]}>
                {isOnline ? 'Online - Ready for Orders' : 'Offline'}
              </Text>
            </View>
          </View>
          <Switch
            value={isOnline}
            onValueChange={toggleOnlineStatus}
            trackColor={{ false: colors.gray, true: colors.success }}
            thumbColor={colors.white}
          />
        </View>

        {/* Earnings Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E5F5FF' }]}>
            <Icon name="bicycle-outline" size={28} color={colors.primary} />
            <Text style={styles.statValue}>{stats.todayDeliveries}</Text>
            <Text style={styles.statLabel}>Today's Deliveries</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E5FFE5' }]}>
            <Icon name="cash-outline" size={28} color={colors.success} />
            <Text style={styles.statValue}>Rs. {stats.todayEarnings}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFF4E5' }]}>
            <Icon name="time-outline" size={28} color={colors.warning} />
            <Text style={styles.statValue}>{stats.activeOrders}</Text>
            <Text style={styles.statLabel}>Active Orders</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFE5F5' }]}>
            <Icon name="wallet-outline" size={28} color={colors.primary} />
            <Text style={styles.statValue}>Rs. {stats.totalEarnings}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
        </View>

        {/* Available Orders */}
        {isOnline && availableOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Deliveries</Text>
            {availableOrders.map((order) => (
              <View key={order._id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderRestaurant}>
                      {order.restaurantId?.name}
                    </Text>
                    <Text style={styles.orderDistance}>2.5 km away</Text>
                  </View>
                  <View style={styles.orderEarnings}>
                    <Text style={styles.earningsLabel}>Earnings</Text>
                    <Text style={styles.earningsAmount}>Rs. 150</Text>
                  </View>
                </View>

                <View style={styles.orderRoute}>
                  <View style={styles.routeStep}>
                    <Icon name="restaurant" size={16} color={colors.primary} />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {order.restaurantId?.address}
                    </Text>
                  </View>
                  <View style={styles.routeDivider} />
                  <View style={styles.routeStep}>
                    <Icon name="location" size={16} color={colors.success} />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {order.deliveryAddress}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAcceptOrder(order._id)}
                >
                  <Text style={styles.acceptButtonText}>Accept Delivery</Text>
                  <Icon name="arrow-forward" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {isOnline && availableOrders.length === 0 && (
          <View style={styles.noOrdersContainer}>
            <Icon name="bicycle-outline" size={60} color={colors.lightGray} />
            <Text style={styles.noOrdersText}>No available deliveries</Text>
            <Text style={styles.noOrdersSubtext}>
              You'll be notified when new orders arrive
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('MyDeliveries')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
                <Icon name="list" size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionText}>My Deliveries</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.gray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Earnings')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: colors.success + '20' }]}>
                <Icon name="wallet" size={24} color={colors.success} />
              </View>
              <Text style={styles.actionText}>Earnings & Payouts</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.gray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('RiderProfile')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: colors.warning + '20' }]}>
                <Icon name="person" size={24} color={colors.warning} />
              </View>
              <Text style={styles.actionText}>My Profile</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.gray} />
          </TouchableOpacity>
        </View>
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
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginTop: 4,
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusInfo: {
    marginLeft: 12,
  },
  statusTitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderRestaurant: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  orderDistance: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  orderEarnings: {
    alignItems: 'flex-end',
  },
  earningsLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  earningsAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
  },
  orderRoute: {
    marginBottom: 16,
  },
  routeStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  routeDivider: {
    width: 2,
    height: 20,
    backgroundColor: colors.border,
    marginLeft: 7,
    marginVertical: 4,
  },
  acceptButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  noOrdersContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  noOrdersText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 16,
  },
  noOrdersSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  actionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
});

export default RiderDashboard;