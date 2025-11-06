// src/screens/rider/RiderProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../../styles/colors';
import { logout } from '../../redux/slices/authSlice';
import api from '../../services/api';

const RiderProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [riderStats, setRiderStats] = useState({
    totalDeliveries: 0,
    rating: 0,
    totalEarnings: 0,
    completionRate: 0,
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  useEffect(() => {
    fetchRiderStats();
  }, []);

  const fetchRiderStats = async () => {
    try {
      const response = await api.get(`/riders/${user._id}/stats`);
      setRiderStats(response.data.stats || {
        totalDeliveries: 0,
        rating: 0,
        totalEarnings: 0,
        completionRate: 0,
      });
    } catch (error) {
      console.error('Failed to fetch rider stats:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => dispatch(logout()),
        },
      ]
    );
  };

  const renderProfileOption = (icon, title, subtitle, onPress, rightComponent) => (
    <TouchableOpacity style={styles.optionItem} onPress={onPress}>
      <View style={styles.optionLeft}>
        <View style={styles.optionIcon}>
          <Icon name={icon} size={20} color={colors.primary} />
        </View>
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>{title}</Text>
          {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || <Icon name="chevron-forward" size={20} color={colors.text.secondary} />}
    </TouchableOpacity>
  );

  const renderStatCard = (title, value, icon, color) => (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Icon name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
          <Icon name="create" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{
                uri: user?.profileImage || 'https://via.placeholder.com/100',
              }}
              style={styles.profileImage}
            />
            <View style={styles.onlineIndicator} />
          </View>
          <Text style={styles.profileName}>{user?.name || 'Rider Name'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <Text style={styles.profilePhone}>{user?.phone}</Text>
          
          {/* KYC Status */}
          <View style={[
            styles.kycBadge,
            { backgroundColor: user?.kycStatus === 'approved' ? colors.success : colors.warning }
          ]}>
            <Icon 
              name={user?.kycStatus === 'approved' ? 'checkmark-circle' : 'time'} 
              size={16} 
              color={colors.white} 
            />
            <Text style={styles.kycText}>
              {user?.kycStatus === 'approved' ? 'Verified' : 'Pending Verification'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Performance Stats</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Deliveries', riderStats.totalDeliveries, 'bicycle', colors.primary)}
            {renderStatCard('Rating', riderStats.rating.toFixed(1), 'star', colors.warning)}
            {renderStatCard('Earnings', `Rs. ${riderStats.totalEarnings}`, 'wallet', colors.success)}
            {renderStatCard('Success Rate', `${riderStats.completionRate}%`, 'checkmark-circle', colors.secondary)}
          </View>
        </View>

        {/* Account Options */}
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.optionsList}>
            {renderProfileOption(
              'person',
              'Personal Information',
              'Update your profile details',
              () => navigation.navigate('EditProfile')
            )}
            {renderProfileOption(
              'card',
              'Payment Methods',
              'Manage your payment options',
              () => navigation.navigate('PaymentMethods')
            )}
            {renderProfileOption(
              'document',
              'Documents',
              'View your KYC documents',
              () => navigation.navigate('KYCStatus')
            )}
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.optionsList}>
            {renderProfileOption(
              'notifications',
              'Push Notifications',
              'Receive order notifications',
              null,
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.lightGray, true: colors.primary }}
                thumbColor={colors.white}
              />
            )}
            {renderProfileOption(
              'location',
              'Location Services',
              'Allow location tracking',
              null,
              <Switch
                value={locationEnabled}
                onValueChange={setLocationEnabled}
                trackColor={{ false: colors.lightGray, true: colors.primary }}
                thumbColor={colors.white}
              />
            )}
            {renderProfileOption(
              'help-circle',
              'Help & Support',
              'Get help and contact support',
              () => navigation.navigate('Help')
            )}
            {renderProfileOption(
              'document-text',
              'Terms & Conditions',
              'Read our terms and policies',
              () => navigation.navigate('Terms')
            )}
          </View>
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="log-out" size={20} color={colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Foodies Rider v1.0.0</Text>
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
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: colors.white,
    marginBottom: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.white,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    borderWidth: 3,
    borderColor: colors.white,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  kycText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 3,
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
  statTitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  optionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  optionsList: {
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  optionSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  logoutSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  versionSection: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  versionText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});

export default RiderProfileScreen;
