// src/navigation/AppNavigator.js
import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from '../redux/slices/authSlice';

// Import Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import TabNavigator from './TabNavigator';
import RestaurantDetailScreen from '../screens/user/RestaurantDetailScreen';
import CheckoutScreen from '../screens/user/CheckoutScreen';
import OrderTrackingScreen from '../screens/user/OrderTrackingScreen';
import KYCUploadScreen from '../screens/auth/KYCUploadScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import AddressManagementScreen from '../screens/user/AddressManagementScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Auth Screens
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        // Main App Screens
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen
            name="RestaurantDetail"
            component={RestaurantDetailScreen}
          />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
          <Stack.Screen name="KYCUpload" component={KYCUploadScreen} />
          <Stack.Screen name="ChatScreen" component={ChatScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
