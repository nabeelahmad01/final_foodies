// Web Testing Dashboard - No Maps Required
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../styles/colors';
import api from '../services/api';
import { logout } from '../redux/slices/authSlice';
import WebKYCUpload from '../components/WebKYCUpload';

const WebTestingDashboard = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch orders based on role
      let ordersResponse;
      if (user.role === 'user') {
        ordersResponse = await api.get('/orders/my-orders');
      } else if (user.role === 'restaurant') {
        ordersResponse = await api.get('/restaurants/orders');
      } else if (user.role === 'rider') {
        ordersResponse = await api.get('/orders/available');
      }
      
      setOrders(ordersResponse?.data?.orders || []);
      
      // Basic stats
      setStats({
        totalOrders: ordersResponse?.data?.orders?.length || 0,
        pendingOrders: ordersResponse?.data?.orders?.filter(o => o.status === 'pending')?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user.role]);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const testAccounts = [
    {
      role: 'user',
      email: 'na619277@gmail.com',
      name: 'Test User',
      color: colors.primary,
      actions: ['Place Order', 'View Orders', 'Track Order'],
    },
    {
      role: 'restaurant',
      email: 'restaurant@test.com',
      name: 'Test Restaurant',
      color: colors.success,
      actions: ['View Orders', 'Accept Order', 'Update Status'],
    },
    {
      role: 'rider',
      email: 'rider@test.com',
      name: 'Test Rider',
      color: colors.warning,
      actions: ['View Available', 'Accept Delivery', 'Update Location'],
    },
  ];

  const getStatusColor = (status) => {
    const statusColors = {
      pending: '#ff9500',
      confirmed: '#007aff',
      preparing: '#ff3b30',
      ready: '#34c759',
      picked_up: '#5856d6',
      delivered: '#00c7be',
      cancelled: '#8e8e93',
    };
    return statusColors[status] || '#8e8e93';
  };

  const currentAccount = testAccounts.find(acc => acc.role === user.role);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchData} />
      }
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: currentAccount?.color || colors.primary }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>🧪 Testing Dashboard</Text>
            <Text style={styles.subtitle}>
              {Platform.OS === 'web' ? '🌐 Web Version' : '📱 Mobile Version'}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Icon name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userRole}>Role: {user.role}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pendingOrders}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{user.wallet?.balance || 0}</Text>
          <Text style={styles.statLabel}>Wallet</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {currentAccount?.actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionButton, { borderLeftColor: currentAccount.color }]}
            onPress={() => {
              // Navigate based on action
              if (action === 'Place Order') navigation.navigate('Home');
              if (action === 'View Orders') navigation.navigate('Orders');
              if (action === 'Track Order') navigation.navigate('OrderTracking', { orderId: orders[0]?._id });
            }}
          >
            <Icon name="flash" size={20} color={currentAccount.color} />
            <Text style={styles.actionText}>{action}</Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity
          style={[styles.actionButton, { borderLeftColor: colors.error }]}
          onPress={handleLogout}
        >
          <Icon name="people" size={20} color={colors.error} />
          <Text style={styles.actionText}>Switch Account</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders ({orders.length})</Text>
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>
              {user.role === 'user' ? 'Place your first order!' : 'Waiting for orders...'}
            </Text>
          </View>
        ) : (
          orders.slice(0, 5).map((order) => (
            <TouchableOpacity
              key={order._id}
              style={styles.orderCard}
              onPress={() => {
                if (user.role === 'user') {
                  navigation.navigate('OrderTracking', { orderId: order._id });
                }
              }}
            >
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>#{order._id.slice(-6)}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) },
                  ]}
                >
                  <Text style={styles.statusText}>{order.status}</Text>
                </View>
              </View>
              <Text style={styles.orderAmount}>₨{order.totalAmount}</Text>
              <Text style={styles.orderTime}>
                {new Date(order.createdAt).toLocaleString()}
              </Text>
              {order.items && (
                <Text style={styles.orderItems}>
                  {order.items.length} item(s)
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Testing Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Testing Flow</Text>
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>🔄 Complete Order Flow</Text>
          <Text style={styles.instructionText}>
            1. User: Place order → Check backend logs{'\n'}
            2. Logout → Login as Restaurant → Accept order{'\n'}
            3. Logout → Login as Rider → Deliver order{'\n'}
            4. Check console logs for notifications
          </Text>
        </View>
        
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>🌐 Web vs Mobile</Text>
          <Text style={styles.instructionText}>
            • Web: Full testing dashboard (current){'\n'}
            • Mobile: Complete app with maps{'\n'}
            • Both share same backend & database
          </Text>
        </View>

        {/* Web KYC Upload Test */}
        <WebKYCUpload />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  userInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  userRole: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'capitalize',
  },
  userEmail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 2,
  },
  actionText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  orderCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  orderTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  orderItems: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  instructionCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default WebTestingDashboard;
