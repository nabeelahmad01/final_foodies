import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from 'react-native-toast-notifications';
import { useNavigation } from '@react-navigation/native';
import { loadUser } from '../../redux/slices/authSlice';
import { KYC_STATUS } from '../../utils/constants';
import api from '../../services/api';

const KYCStatusScreen = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const navigation = useNavigation();
  const { user, loading } = useSelector((state) => state.auth);
  const [forceApproved, setForceApproved] = useState(false);
  
  // Refresh user data periodically to check KYC status
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(loadUser());
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [dispatch]);

  const getStatusDetails = () => {
    // Force approved state for development
    if (forceApproved) {
      const handleForceApproved = async () => {
        try {
          // For restaurant role, check if restaurant is already set up
          if (user?.role === 'restaurant') {
            if (user?.restaurantId) {
              navigation.replace('RestaurantDashboard');
            } else {
              navigation.replace('SetupRestaurant');
            }
          } else if (user?.role === 'rider') {
            // For riders, set auto-online and go to rider dashboard
            try {
              await api.put('/riders/auto-online');
              console.log('✅ Rider automatically set to online');
            } catch (error) {
              console.log('⚠️ Failed to set rider online automatically:', error.message);
            }
            navigation.replace('RiderDashboard');
          } else {
            // For other users, go to main app
            navigation.replace('MainTabs');
          }
        } catch (error) {
          console.error('Error in handleForceApproved:', error);
          // Fallback navigation based on role
          if (user?.role === 'restaurant') {
            navigation.replace('SetupRestaurant');
          } else if (user?.role === 'rider') {
            navigation.replace('RiderDashboard');
          } else {
            navigation.replace('MainTabs');
          }
        }
      };

      const getForceMessage = () => {
        if (user?.role === 'restaurant') {
          return 'Your KYC has been approved. You can now set up your restaurant.';
        } else if (user?.role === 'rider') {
          return 'Your KYC has been approved. You can now start accepting delivery orders.';
        } else {
          return 'Your KYC has been approved. You can now access all features.';
        }
      };

      return {
        title: 'KYC Approved!',
        message: getForceMessage(),
        icon: <MaterialIcons name="check-circle" size={80} color="#4CAF50" />,
        buttonText: 'Get Started',
        showButton: true,
        onPress: handleForceApproved
      };
    }
    
    switch (user?.kycStatus) {
      case KYC_STATUS.PENDING:
        // Check if user has uploaded documents
        const hasDocuments = user?.kycDocuments && user.kycDocuments.length > 0;
        return {
          title: 'KYC Under Review',
          message: hasDocuments 
            ? 'Your KYC documents are under review. This may take up to 24-48 hours. Please wait for approval.'
            : 'Please upload your KYC documents to proceed.',
          icon: <MaterialIcons name="pending" size={80} color="#FFA500" />,
          buttonText: hasDocuments ? 'Refresh Status' : 'Upload Documents',
          showButton: true,
          onPress: hasDocuments 
            ? () => dispatch(loadUser()) 
            : () => navigation.navigate('KYCUpload')
        };
      case KYC_STATUS.APPROVED:
        const handleGetStarted = async () => {
          try {
            // For restaurant role, check if restaurant is already set up
            if (user?.role === 'restaurant') {
              if (user?.restaurantId) {
                // Restaurant already exists, go to dashboard
                navigation.replace('RestaurantDashboard');
              } else {
                // No restaurant set up yet, go to setup
                navigation.replace('SetupRestaurant');
              }
            } else if (user?.role === 'rider') {
              // For riders, set auto-online and go to rider dashboard
              try {
                await api.put('/riders/auto-online');
                console.log('✅ Rider automatically set to online');
              } catch (error) {
                console.log('⚠️ Failed to set rider online automatically:', error.message);
              }
              navigation.replace('RiderDashboard');
            } else {
              // For other users, go to main app
              navigation.replace('MainTabs');
            }
          } catch (error) {
            console.error('Error in handleGetStarted:', error);
            // Fallback navigation based on role
            if (user?.role === 'restaurant') {
              navigation.replace('SetupRestaurant');
            } else if (user?.role === 'rider') {
              navigation.replace('RiderDashboard');
            } else {
              navigation.replace('MainTabs');
            }
          }
        };
        
        const getMessage = () => {
          if (user?.role === 'restaurant') {
            return 'Your KYC has been approved. You can now set up your restaurant.';
          } else if (user?.role === 'rider') {
            return 'Your KYC has been approved. You can now start accepting delivery orders.';
          } else {
            return 'Your KYC has been approved. You can now access all features.';
          }
        };
        
        return {
          title: 'KYC Approved!',
          message: getMessage(),
          icon: <MaterialIcons name="check-circle" size={80} color="#4CAF50" />,
          buttonText: 'Get Started',
          showButton: true,
          onPress: handleGetStarted
        };
      case KYC_STATUS.REJECTED:
        return {
          title: 'KYC Rejected',
          message: 'Your KYC documents were rejected. Please check the reason and re-submit.',
          icon: <MaterialIcons name="error" size={80} color="#F44336" />,
          buttonText: 'Re-submit KYC',
          showButton: true,
          onPress: () => navigation.navigate('KYCUpload')
        };
      default:
        return {
          title: 'KYC Status Unknown',
          message: 'Unable to determine your KYC status. Please contact support.',
          icon: <MaterialIcons name="help" size={80} color="#9E9E9E" />,
          showButton: true,
          onPress: () => navigation.navigate('Support')
        };
    }
  };

  const status = getStatusDetails();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {status.icon}
      </View>
      <Text style={styles.title}>{status.title}</Text>
      <Text style={styles.message}>{status.message}</Text>
      
      {status.showButton && (
        <View>
          <TouchableOpacity 
            style={styles.button}
            onPress={status.onPress || (() => dispatch(loadUser()))}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{status.buttonText}</Text>
            )}
          </TouchableOpacity>
          
          {/* Force Approve Button (Development Only) */}
          {__DEV__ && !forceApproved && (
            <TouchableOpacity 
              style={[styles.button, { marginTop: 10, backgroundColor: '#FF9800' }]}
              onPress={() => setForceApproved(true)}
            >
              <Text style={styles.buttonText}>Force Approve (Dev Only)</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default KYCStatusScreen;
