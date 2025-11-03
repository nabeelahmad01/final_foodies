import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from 'react-native-toast-notifications';
import { useNavigation } from '@react-navigation/native';
import { loadUser } from '../../redux/slices/authSlice';
import { KYC_STATUS } from '../../utils/constants';

const KYCStatusScreen = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const navigation = useNavigation();
  const { user, loading } = useSelector((state) => state.auth);
  
  // Refresh user data periodically to check KYC status
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(loadUser());
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [dispatch]);

  const getStatusDetails = () => {
    switch (user?.kycStatus) {
      case KYC_STATUS.PENDING:
        return {
          title: 'KYC Under Review',
          message: 'Your KYC documents are under review. This may take up to 24-48 hours.',
          icon: <MaterialIcons name="pending" size={80} color="#FFA500" />,
          buttonText: 'Refresh Status',
          showButton: true
        };
      case KYC_STATUS.APPROVED:
        return {
          title: 'KYC Approved!',
          message: 'Your KYC has been approved. You can now set up your restaurant.',
          icon: <MaterialIcons name="check-circle" size={80} color="#4CAF50" />,
          buttonText: 'Setup Restaurant',
          showButton: true,
          onPress: () => navigation.replace('SetupRestaurant')
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
