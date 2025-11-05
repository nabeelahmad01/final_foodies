// Development Testing Component - Role Switcher
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../styles/colors';

const DevTestingSwitcher = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const testAccounts = [
    {
      role: 'user',
      email: 'testuser@test.com',
      name: 'Test User',
      color: colors.primary,
    },
    {
      role: 'restaurant',
      email: 'testrestaurant@test.com', 
      name: 'Test Restaurant',
      color: colors.success,
    },
    {
      role: 'rider',
      email: 'testrider@test.com',
      name: 'Test Rider',
      color: colors.warning,
    },
  ];

  const switchRole = async (account) => {
    Alert.alert(
      'Switch Account',
      `Switch to ${account.name} (${account.role})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            try {
              // Clear current session
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('user');
              
              // Navigate to login with pre-filled data
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'Login',
                    params: {
                      testAccount: account,
                      autoFill: true,
                    },
                  },
                ],
              });
            } catch (error) {
              console.error('Role switch error:', error);
            }
          },
        },
      ]
    );
  };

  // Only show in development
  if (__DEV__ !== true) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Dev Testing</Text>
      <Text style={styles.subtitle}>Current: {user?.role || 'None'}</Text>
      
      <View style={styles.buttonContainer}>
        {testAccounts.map((account) => (
          <TouchableOpacity
            key={account.role}
            style={[
              styles.roleButton,
              { backgroundColor: account.color },
              user?.role === account.role && styles.activeRole,
            ]}
            onPress={() => switchRole(account)}
          >
            <Text style={styles.roleText}>
              {account.role.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  title: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  roleButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeRole: {
    borderWidth: 2,
    borderColor: 'white',
  },
  roleText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
});

export default DevTestingSwitcher;
