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
import ProfileScreen from '../screens/user/ProfileScreen';
import RestaurantDashboard from '../screens/restaurant/RestaurantDashboard';
import RestaurantMenuManagement from '../screens/restaurant/MenuManagement';
import RestaurantOrders from '../screens/restaurant/OrdersScreen';
import RiderDashboard from '../screens/rider/RiderDashboard';
import RiderDelivery from '../screens/rider/DeliveryScreen';

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
          <Stack.Screen name="AddressManagement" component={AddressManagementScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="RestaurantDashboard" component={RestaurantDashboard} />
          <Stack.Screen name="MenuManagement" component={RestaurantMenuManagement} />
          <Stack.Screen name="RestaurantOrders" component={RestaurantOrders} />
          <Stack.Screen name="RiderDashboard" component={RiderDashboard} />
          <Stack.Screen name="DeliveryScreen" component={RiderDelivery} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
