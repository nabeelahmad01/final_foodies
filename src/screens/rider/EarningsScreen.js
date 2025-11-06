// src/screens/rider/EarningsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../../styles/colors';
import api from '../../services/api';

const EarningsScreen = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  const [earnings, setEarnings] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0,
  });
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      // Fetch earnings data
      const earningsResponse = await api.get(`/riders/${user._id}/earnings`);
      setEarnings(earningsResponse.data.earnings || {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        total: 0,
      });

      // Fetch recent completed deliveries
      const deliveriesResponse = await api.get(`/orders/rider/${user._id}?status=delivered&limit=10`);
      setRecentDeliveries(deliveriesResponse.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
      Alert.alert('Error', 'Failed to load earnings data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderEarningCard = (title, amount, icon, color) => (
    <View style={[styles.earningCard, { borderLeftColor: color }]}>
      <View style={styles.earningHeader}>
        <Icon name={icon} size={24} color={color} />
        <Text style={styles.earningTitle}>{title}</Text>
      </View>
      <Text style={styles.earningAmount}>Rs. {amount.toLocaleString()}</Text>
    </View>
  );

  const renderRecentDelivery = (delivery, index) => (
    <View key={delivery._id} style={styles.deliveryItem}>
      <View style={styles.deliveryInfo}>
        <Text style={styles.deliveryId}>#{delivery._id.slice(-6)}</Text>
        <Text style={styles.deliveryDate}>{formatDate(delivery.updatedAt)}</Text>
        <Text style={styles.deliveryRestaurant}>
          {delivery.restaurantId?.name || 'Restaurant'}
        </Text>
      </View>
      <View style={styles.deliveryEarning}>
        <Text style={styles.deliveryAmount}>Rs. {delivery.totalAmount}</Text>
        <Text style={styles.deliveryCommission}>
          Commission: Rs. {Math.round(delivery.totalAmount * 0.15)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Earnings</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Icon name="refresh" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Earnings Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Earnings Summary</Text>
          
          {renderEarningCard('Today', earnings.today, 'today', colors.primary)}
          {renderEarningCard('This Week', earnings.thisWeek, 'calendar', colors.success)}
          {renderEarningCard('This Month', earnings.thisMonth, 'stats-chart', colors.warning)}
          {renderEarningCard('Total Earnings', earnings.total, 'wallet', colors.secondary)}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="bicycle" size={32} color={colors.primary} />
              <Text style={styles.statValue}>{recentDeliveries.length}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="time" size={32} color={colors.success} />
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="flash" size={32} color={colors.warning} />
              <Text style={styles.statValue}>25 min</Text>
              <Text style={styles.statLabel}>Avg Time</Text>
            </View>
          </View>
        </View>

        {/* Recent Deliveries */}
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Deliveries</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyDeliveries')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentDeliveries.length > 0 ? (
            <View style={styles.deliveriesList}>
              {recentDeliveries.slice(0, 5).map(renderRecentDelivery)}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="receipt" size={48} color={colors.lightGray} />
              <Text style={styles.emptyText}>No recent deliveries</Text>
              <Text style={styles.emptySubtext}>
                Complete deliveries to see your earnings here
              </Text>
            </View>
          )}
        </View>

        {/* Payout Information */}
        <View style={styles.payoutContainer}>
          <Text style={styles.sectionTitle}>Payout Information</Text>
          <View style={styles.payoutCard}>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutLabel}>Commission Rate</Text>
              <Text style={styles.payoutValue}>15%</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutLabel}>Payout Schedule</Text>
              <Text style={styles.payoutValue}>Weekly</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutLabel}>Next Payout</Text>
              <Text style={styles.payoutValue}>Friday</Text>
            </View>
          </View>
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
  content: {
    flex: 1,
  },
  summaryContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  earningCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  earningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginLeft: 8,
  },
  earningAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  recentContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  deliveriesList: {
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deliveryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  deliveryDate: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  deliveryRestaurant: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  deliveryEarning: {
    alignItems: 'flex-end',
  },
  deliveryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  deliveryCommission: {
    fontSize: 12,
    color: colors.success,
    marginTop: 2,
  },
  payoutContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  payoutCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  payoutLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  payoutValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default EarningsScreen;
