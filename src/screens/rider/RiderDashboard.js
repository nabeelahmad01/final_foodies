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
} from 'react-native';

import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadUser } from '../../redux/slices/authSlice';
import { useFocusEffect } from '@react-navigation/native';
import io from 'socket.io-client';
import { API_URL } from '../../utils/constants';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import colors from '../../styles/colors';
import ConfirmModal from '../../components/ConfirmModal';

const RiderDashboard = ({ navigation }) => {
  const dispatch = useDispatch();
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
  const [confirmKyc, setConfirmKyc] = useState(false);
  const [confirmAccept, setConfirmAccept] = useState({ visible: false, orderId: null });
  const [socket, setSocket] = useState(null);
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    loadOnlineStatus(); // Load saved online status
    
    // Refresh user data to ensure we have the latest KYC status
    dispatch(loadUser());
    
    if (isOnline) {
      const interval = setInterval(() => {
        fetchAvailableOrders();
      }, 5000); // Poll every 5 seconds when online
      return () => clearInterval(interval);
    }
  }, [isOnline]);

  // Refresh user data when component mounts
  useEffect(() => {
    console.log('🔄 RiderDashboard mounted, refreshing user data...');
    dispatch(loadUser());
  }, []);

  // Debug user state changes
  useEffect(() => {
    console.log('👤 User state updated:', {
      kycStatus: user?.kycStatus,
      role: user?.role,
      currentRole: user?.currentRole,
      userId: user?._id,
      name: user?.name
    });
  }, [user]);

  // Refresh user data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 RiderDashboard focused, refreshing user data...');
      dispatch(loadUser());
    }, [dispatch])
  );

  // Socket connection for real-time notifications
  useEffect(() => {
    if (user?._id && isOnline) {
      console.log('🔌 Connecting to socket for rider notifications...');
      
      // Create socket connection
      const socketUrl = API_URL.replace('/api', '');
      const newSocket = io(socketUrl, {
        transports: ['websocket'],
        timeout: 20000,
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected for rider:', user._id);
        // Join rider-specific room
        newSocket.emit('join', `rider_${user._id}`);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });

      // Listen for new order notifications
      newSocket.on('newOrderAvailable', (orderData) => {
        console.log('🔔 New order notification received:', orderData);
        
        // Show order alert
        setNewOrderAlert(orderData);
        
        // Play notification sound (you can add sound here)
        // Also refresh available orders
        fetchAvailableOrders();
      });

      // Listen for order cancellations
      newSocket.on('orderTaken', (data) => {
        console.log('📦 Order taken by another rider:', data);
        // Remove from available orders
        setAvailableOrders(prev => prev.filter(order => order._id !== data.orderId));
        // Hide alert if it's for this order
        if (newOrderAlert?.orderId === data.orderId) {
          setNewOrderAlert(null);
        }
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        console.log('🔌 Disconnecting socket...');
        newSocket.disconnect();
      };
    }
  }, [user?._id, isOnline]);

  // Cleanup socket when going offline
  useEffect(() => {
    if (!isOnline && socket) {
      console.log('📴 Going offline, disconnecting socket...');
      socket.disconnect();
      setSocket(null);
      setNewOrderAlert(null);
    }
  }, [isOnline, socket]);

  // Load saved online status when component mounts
  const loadOnlineStatus = async () => {
    try {
      // Only restore online status if KYC is approved
      if (user?.kycStatus === 'approved') {
        const savedStatus = await AsyncStorage.getItem(`rider_online_${user._id}`);
        if (savedStatus === 'true') {
          setIsOnline(true);
        }
      }
    } catch (error) {
      console.error('Failed to load online status:', error);
    }
  };

  // Save online status whenever it changes
  const saveOnlineStatus = async (status) => {
    try {
      if (user?._id) {
        await AsyncStorage.setItem(`rider_online_${user._id}`, status.toString());
      }
    } catch (error) {
      console.error('Failed to save online status:', error);
    }
  };

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
    console.log('🔄 Refreshing dashboard data and user info...');
    
    // Refresh user data first to get latest KYC status
    await dispatch(loadUser());
    
    await fetchDashboardData();
    if (isOnline) {
      await fetchAvailableOrders();
    }
    setRefreshing(false);
  };

  const toggleOnlineStatus = () => {
    // Debug user KYC status
    console.log('🔍 Checking KYC status:', {
      userKycStatus: user?.kycStatus,
      isOnline,
      userId: user?._id,
      userRole: user?.role || user?.currentRole,
      fullUser: user
    });
    
    // TEMPORARY: Force allow toggle for testing (remove this later)
    if (__DEV__) {
      console.log('🔧 DEV MODE: Bypassing KYC check for testing');
      const newStatus = !isOnline;
      setIsOnline(newStatus);
      saveOnlineStatus(newStatus);
      return;
    }
    
    // Only check KYC status when trying to go online AND KYC is not approved
    if (!isOnline && user?.kycStatus !== 'approved') {
      console.log('❌ KYC not approved, showing KYC modal');
      setConfirmKyc(true);
      return;
    }
    
    console.log('✅ KYC approved or going offline, allowing toggle');
    // If KYC is approved or going offline, allow the toggle
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    saveOnlineStatus(newStatus); // Save the new status
  };

  const handleAcceptOrder = (orderId) => {
    setConfirmAccept({ visible: true, orderId });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Rider Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome, {user?.name}!</Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
          <TouchableOpacity onPress={async () => {
            console.log('🔄 Manual refresh user data...');
            await dispatch(loadUser());
          }}>
            <Icon name="refresh" size={28} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Icon name="person-circle-outline" size={32} color={colors.white} />
          </TouchableOpacity>
        </View>
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
              {/* Debug KYC Status */}
              <Text style={{fontSize: 10, color: 'red'}}>
                Debug: KYC={user?.kycStatus || 'undefined'}, Role={user?.role || user?.currentRole || 'undefined'}
              </Text>
              {user?.kycStatus === 'approved' && (
                <View style={styles.kycBadge}>
                  <Icon name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.kycText}>KYC Verified</Text>
                </View>
              )}
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

      {/* New Order Alert Modal */}
      {newOrderAlert && (
        <ConfirmModal
          visible={true}
          title="🔔 New Order Available!"
          message={`Restaurant: ${newOrderAlert.restaurantName}\nAmount: Rs.${newOrderAlert.totalAmount}\nDistance: ${newOrderAlert.distance?.toFixed(1)}km\nEarning: Rs.${newOrderAlert.estimatedEarning}`}
          confirmText="Accept Order"
          cancelText="Decline"
          onConfirm={() => {
            handleAcceptOrder(newOrderAlert.orderId);
            setNewOrderAlert(null);
          }}
          onCancel={() => setNewOrderAlert(null)}
        />
      )}

      {/* Confirm KYC Modal */}
      <ConfirmModal
        visible={confirmKyc}
        title="KYC Required"
        message="You need to complete KYC verification before going online. Would you like to complete it now?"
        confirmText="Complete KYC"
        cancelText="Later"
        onConfirm={() => {
          setConfirmKyc(false);
          navigation.navigate('KYCUpload');
        }}
        onCancel={() => setConfirmKyc(false)}
      />

      {/* Accept Delivery Modal */}
      <ConfirmModal
        visible={confirmAccept.visible}
        title="Accept Delivery"
        message="Do you want to accept this delivery order?"
        confirmText="Accept"
        cancelText="Cancel"
        onConfirm={() => {
          const id = confirmAccept.orderId;
          setConfirmAccept({ visible: false, orderId: null });
          navigation.navigate('RiderDelivery', { orderId: id });
        }}
        onCancel={() => setConfirmAccept({ visible: false, orderId: null })}
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
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.success + '20',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  kycText: {
    fontSize: 10,
    color: colors.success,
    fontWeight: '600',
    marginLeft: 4,
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