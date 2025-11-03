// src/screens/user/ProfileScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { logout } from '../../redux/slices/authSlice';
import colors from '../../styles/colors';
import { useToast } from '../../context.js/ToastContext';
import { handleApiError, showSuccess } from '../../utils/helpers';
import authService from '../../services/authService';
import { loadUser } from '../../redux/slices/authSlice';
import LanguageSelector from '../../components/LanguageSelector';
import { Modal, TextInput } from 'react-native';
import { t } from '../../utils/i18n';
import ConfirmModal from '../../components/ConfirmModal';
import { useLanguageRerender } from '../../utils/i18n';

const ProfileScreen = ({ navigation }) => {
  useLanguageRerender();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const toast = useToast();
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showLanguageModal, setShowLanguageModal] = React.useState(false);
  const [editForm, setEditForm] = React.useState({ name: user?.name || '', phone: user?.phone || '' });

  const [confirmLogout, setConfirmLogout] = React.useState(false);
  const handleLogout = () => setConfirmLogout(true);

  const menuItems = [
    {
      icon: 'person-outline',
      title: t('profile.editProfile'),
      subtitle: t('profile.editProfile'),
      onPress: () => {
        setEditForm({ name: user?.name || '', phone: user?.phone || '' });
        setShowEditModal(true);
      },
    },
    {
      icon: 'location-outline',
      title: t('profile.savedAddresses'),
      subtitle: t('profile.savedAddresses'),
      onPress: () => navigation.navigate('AddressManagement'),
    },
    {
      icon: 'wallet-outline',
      title: t('profile.wallet'),
      subtitle: 'Rs. 500 balance',
      onPress: () => navigation.navigate('Wallet'),
    },
    {
      icon: 'card-outline',
      title: t('profile.paymentMethods'),
      subtitle: t('profile.paymentMethods'),
      onPress: () => navigation.navigate('PaymentMethods'),
    },
    {
      icon: 'notifications-outline',
      title: t('profile.notifications'),
      subtitle: t('profile.notifications'),
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      icon: 'help-circle-outline',
      title: t('profile.helpSupport'),
      subtitle: t('profile.helpSupport'),
      onPress: () => navigation.navigate('Help'),
    },
    {
      icon: 'document-text-outline',
      title: t('profile.termsConditions'),
      subtitle: t('profile.termsConditions'),
      onPress: () => navigation.navigate('Terms'),
    },
    {
      icon: 'shield-checkmark-outline',
      title: t('profile.kyc'),
      subtitle: user?.kycStatus === 'approved' ? 'Verified' : 'Not verified',
      onPress: () => navigation.navigate('KYCUpload'),
    },
    {
      icon: 'storefront-outline',
      title: t('profile.becomeRestaurant'),
      subtitle: t('profile.startSelling'),
      onPress: () => navigation.navigate('KYCUpload'),
    },
    {
      icon: 'bicycle-outline',
      title: t('profile.becomeRider'),
      subtitle: t('profile.deliverAndEarn'),
      onPress: () => navigation.navigate('KYCUpload'),
    },
    {
      icon: 'language-outline',
      title: t('profile.language'),
      subtitle: t('profile.language'),
      onPress: () => setShowLanguageModal(true),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user?.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarButton}>
              <Icon name="camera" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <Text style={styles.userPhone}>{user?.phone || ''}</Text>

          {user?.kycStatus === 'approved' && (
            <View style={styles.verifiedBadge}>
              <Icon name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.verifiedText}>Verified Account</Text>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuIcon}>
                <Icon name={item.icon} size={24} color={colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.gray} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="log-out-outline" size={24} color={colors.error} />
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.editProfile')}</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Icon name="close" size={22} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder={t('profile.editProfile')}
              value={editForm.name}
              onChangeText={(t) => setEditForm({ ...editForm, name: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              keyboardType="phone-pad"
              value={editForm.phone}
              onChangeText={(t) => setEditForm({ ...editForm, phone: t })}
            />
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={async () => {
                try {
                  await authService.updateProfile(editForm);
                  await dispatch(loadUser());
                  showSuccess(toast, t('common.success'));
                  setShowEditModal(false);
                } catch (e) {
                  handleApiError(e, toast);
                }
              }}
            >
              <Text style={styles.saveBtnText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal visible={showLanguageModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.language')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Icon name="close" size={22} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <LanguageSelector onClose={() => setShowLanguageModal(false)} />
          </View>
        </View>
      </Modal>

      {/* Logout Confirm */}
      <ConfirmModal
        visible={confirmLogout}
        title={t('auth.logout')}
        message={t('auth.logout')}
        confirmText={t('auth.logout')}
        cancelText={t('common.cancel')}
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          dispatch(logout());
          // Ensure we land on Login after logout
          if (navigation?.reset) {
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } else if (navigation?.replace) {
            navigation.replace('Login');
          } else {
            navigation.navigate('Login');
          }
        }}
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
  profileCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.white,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  menuContainer: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
  },
  saveBtnText: {
    color: colors.white,
    fontWeight: '700',
  },
});

export default ProfileScreen;
