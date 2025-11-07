// Web Testing Dashboard - Fixed Version
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
import NetworkDebugger from '../components/NetworkDebugger';

const WebTestingDashboard = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch orders
      const ordersRes = await api.get('/orders/my-orders');
      setOrders(ordersRes.data.orders || []);
      
      // Basic stats
      setStats({
        totalOrders: ordersRes.data.orders?.length || 0,
        pendingOrders: ordersRes.data.orders?.filter(o => o.status === 'pending').length || 0,
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigation.replace('Login');
  };

  const testAccounts = [
    { role: 'user', email: 'user@test.com', name: 'Test User' },
    { role: 'restaurant', email: 'restaurant@test.com', name: 'Test Restaurant' },
    { role: 'rider', email: 'rider@test.com', name: 'Test Rider' },
  ];

  const currentAccount = testAccounts.find(acc => acc.role === user.role);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchData} />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>🧪 Web Testing Dashboard</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Icon name="log-out-outline" size={20} color={colors.white} />
              <Text style={styles.logoutText}>Switch Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Current User Info */}
        <View style={styles.userCard}>
          <Text style={styles.userTitle}>Current User</Text>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userRole}>Role: {user.role}</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Quick Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalOrders}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.pendingOrders}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Role-specific Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Role Actions</Text>
          {user.role === 'user' && (
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>Browse Restaurants</Text>
            </TouchableOpacity>
          )}
          {user.role === 'restaurant' && (
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>Manage Orders</Text>
            </TouchableOpacity>
          )}
          {user.role === 'rider' && (
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>Available Deliveries</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>🌐 Web vs Mobile</Text>
          <Text style={styles.instructionText}>
            • Web: Full testing dashboard (current){'\n'}
            • Mobile: Complete app with maps{'\n'}
            • Both share same backend & database
          </Text>
        </View>

        {/* Network Debugger */}
        <View style={styles.debuggerCard}>
          <Text style={styles.debuggerTitle}>🔧 Network Debugger</Text>
          <NetworkDebugger />
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
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: colors.white,
    marginLeft: 5,
    fontWeight: 'bold',
  },
  userCard: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
  },
  userTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  statsCard: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionsCard: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  actionButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  instructionCard: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  debuggerCard: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  debuggerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
});

export default WebTestingDashboard;
