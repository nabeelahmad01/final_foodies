// src/screens/restaurant/RestaurantDashboard.js
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
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import colors from '../../styles/colors';
import ConfirmModal from '../../components/ConfirmModal';
import { t, useLanguageRerender } from '../../utils/i18n';
import { logout } from '../../redux/slices/authSlice';

const RestaurantDashboard = ({ navigation }) => {
  useLanguageRerender();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [restaurant, setRestaurant] = useState(null);
  const [stats, setStats] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showKycPrompt, setShowKycPrompt] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (!user || !user._id) {
        console.error('User ID is not available');
        return;
      }
      
      console.log('Fetching restaurant for user ID:', user._id);
      
      // Fetch restaurant details
      const restaurantRes = await api.get(`/restaurants?ownerId=${user._id}`);
      
      if (restaurantRes.data && restaurantRes.data.restaurants && restaurantRes.data.restaurants.length > 0) {
        const restaurantData = restaurantRes.data.restaurants[0];
        console.log('Restaurant data:', restaurantData);
        
        setRestaurant(restaurantData);
        setIsOpen(restaurantData.isOpen || false);

        // Only fetch stats if we have a valid restaurant ID
        if (restaurantData._id) {
          console.log('Fetching dashboard stats for restaurant ID:', restaurantData._id);
          const statsRes = await api.get(`/restaurants/${restaurantData._id}/dashboard`);
          if (statsRes.data && statsRes.data.stats) {
            setStats(statsRes.data.stats);
          } else {
            console.warn('Invalid stats response format:', statsRes.data);
            setStats({
              totalOrders: 0,
              pendingOrders: 0,
              completedOrders: 0,
              totalEarnings: 0,
              monthlyEarnings: 0,
              weeklyEarnings: 0
            });
          }
        }
      } else {
        console.log('No restaurant found for user');
        setRestaurant(null);
        setStats({
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          totalEarnings: 0,
          monthlyEarnings: 0,
          weeklyEarnings: 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set default stats on error
      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalEarnings: 0,
        monthlyEarnings: 0,
        weeklyEarnings: 0
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const toggleRestaurantStatus = async () => {
    try {
      await api.put(`/restaurants/${restaurant._id}`, {
        isOpen: !isOpen,
      });
      setIsOpen(!isOpen);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  if (!restaurant) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Restaurant Dashboard</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Icon name="log-out-outline" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.setupContainer}>
          <Icon name="restaurant-outline" size={80} color={colors.lightGray} />
          <Text style={styles.setupText}>Setup Your Restaurant</Text>
          <Text style={styles.setupSubtext}>
            Complete your restaurant profile to start receiving orders
          </Text>
          <TouchableOpacity
            style={styles.setupButton}
            onPress={() => {
              if (user?.kycStatus !== 'approved') {
                setShowKycPrompt(true);
              } else {
                navigation.navigate('SetupRestaurant');
              }
            }}
          >
            <Text style={styles.setupButtonText}>Get Started</Text>
          </TouchableOpacity>
          <ConfirmModal
            visible={showKycPrompt}
            title={t('rider.kycRequiredTitle')}
            message={t('rider.kycRequiredMsg')}
            confirmText={t('profile.kyc')}
            cancelText={t('common.cancel')}
            onCancel={() => setShowKycPrompt(false)}
            onConfirm={() => {
              setShowKycPrompt(false);
              navigation.navigate('KYCUpload');
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>{restaurant.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.headerButton}>
            <Icon name="settings-outline" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
            <Icon name="log-out-outline" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Restaurant Status Toggle */}
        <View style={styles.statusCard}>
          <View style={styles.statusLeft}>
            <Icon
              name={isOpen ? 'checkmark-circle' : 'close-circle'}
              size={32}
              color={isOpen ? colors.success : colors.error}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Restaurant Status</Text>
              <Text style={[styles.statusText, { color: isOpen ? colors.success : colors.error }]}>
                {isOpen ? 'Open for Orders' : 'Closed'}
              </Text>
            </View>
          </View>
          <Switch
            value={isOpen}
            onValueChange={toggleRestaurantStatus}
            trackColor={{ false: colors.gray, true: colors.success }}
            thumbColor={colors.white}
          />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#FFE5E5' }]}>
            <Icon name="cart-outline" size={32} color={colors.primary} />
            <Text style={styles.statValue}>{stats?.todayOrders || 0}</Text>
            <Text style={styles.statLabel}>Today's Orders</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E5F5FF' }]}>
            <Icon name="cash-outline" size={32} color={colors.success} />
            <Text style={styles.statValue}>Rs. {stats?.todayRevenue || 0}</Text>
            <Text style={styles.statLabel}>Today's Revenue</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFF4E5' }]}>
            <Icon name="time-outline" size={32} color={colors.warning} />
            <Text style={styles.statValue}>{stats?.pendingOrders || 0}</Text>
            <Text style={styles.statLabel}>Pending Orders</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#F0E5FF' }]}>
            <Icon name="star-outline" size={32} color={colors.warning} />
            <Text style={styles.statValue}>{restaurant.rating || '0.0'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('RestaurantOrders')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
                <Icon name="list" size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionText}>View Orders</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.gray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('MenuManagement', { restaurantId: restaurant._id })}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: colors.success + '20' }]}>
                <Icon name="restaurant" size={24} color={colors.success} />
              </View>
              <Text style={styles.actionText}>Manage Menu</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.gray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('RestaurantProfile')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: colors.warning + '20' }]}>
                <Icon name="create" size={24} color={colors.warning} />
              </View>
              <Text style={styles.actionText}>Edit Restaurant Info</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.gray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Earnings')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#2196F3' + '20' }]}>
                <Icon name="wallet" size={24} color="#2196F3" />
              </View>
              <Text style={styles.actionText}>Earnings & Payouts</Text>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
    padding: 8,
  },
  logoutButton: {
    padding: 8,
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  setupText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 20,
  },
  setupSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  setupButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 24,
  },
  setupButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
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

export default RestaurantDashboard;