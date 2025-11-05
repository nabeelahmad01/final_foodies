// Testing Dashboard for Order Flow
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../styles/colors';
import api from '../services/api';

const TestingDashboard = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/orders/my-orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff9500',
      confirmed: '#007aff',
      preparing: '#ff3b30',
      ready: '#34c759',
      picked_up: '#5856d6',
      delivered: '#00c7be',
      cancelled: '#8e8e93',
    };
    return colors[status] || '#8e8e93';
  };

  const testActions = [
    {
      title: 'Switch to Restaurant',
      icon: 'restaurant',
      action: () => navigation.navigate('Login', { testRole: 'restaurant' }),
      color: colors.success,
    },
    {
      title: 'Switch to Rider',
      icon: 'bicycle',
      action: () => navigation.navigate('Login', { testRole: 'rider' }),
      color: colors.warning,
    },
    {
      title: 'View Backend Logs',
      icon: 'terminal',
      action: () => console.log('Check backend terminal for logs'),
      color: colors.info,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchOrders} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Testing Dashboard</Text>
        <Text style={styles.subtitle}>Current Role: {user?.role}</Text>
      </View>

      {/* Test Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {testActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionButton, { borderLeftColor: action.color }]}
            onPress={action.action}
          >
            <Icon name={action.icon} size={20} color={action.color} />
            <Text style={styles.actionText}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders ({orders.length})</Text>
        {orders.map((order) => (
          <View key={order._id} style={styles.orderCard}>
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
          </View>
        ))}
      </View>

      {/* Testing Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Testing Steps</Text>
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>1. Place Order (User)</Text>
          <Text style={styles.instructionText}>
            • Add items to cart{'\n'}
            • Go to checkout{'\n'}
            • Place order with wallet payment
          </Text>
        </View>
        
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>2. Accept Order (Restaurant)</Text>
          <Text style={styles.instructionText}>
            • Switch to restaurant account{'\n'}
            • Check notifications{'\n'}
            • Accept/reject order
          </Text>
        </View>
        
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>3. Deliver Order (Rider)</Text>
          <Text style={styles.instructionText}>
            • Switch to rider account{'\n'}
            • View available orders{'\n'}
            • Accept and deliver
          </Text>
        </View>
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
    backgroundColor: colors.primary,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
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

export default TestingDashboard;
