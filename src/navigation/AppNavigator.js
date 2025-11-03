// src/navigation/AppNavigator.js
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// Auth Screens
import KYCStatusScreen from '../screens/auth/KYCStatusScreen';
import KYCUploadScreen from '../screens/auth/KYCUploadScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';


// User Screens
import AddressManagementScreen from '../screens/user/AddressManagementScreen';
import CheckoutScreen from '../screens/user/CheckoutScreen';
import OrderTrackingScreen from '../screens/user/OrderTrackingScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import RestaurantDetailScreen from '../screens/user/RestaurantDetailScreen';
import TabNavigator from './TabNavigator';

// Restaurant Screens
import RestaurantMenuManagement from '../screens/restaurant/MenuManagement';
import RestaurantOrders from '../screens/restaurant/OrdersScreen';
import RestaurantDashboard from '../screens/restaurant/RestaurantDashboard';
import SetupRestaurantScreen from '../screens/restaurant/SetupRestaurantScreen';

// Rider Screens
import RiderDelivery from '../screens/rider/DeliveryScreen';
import RiderDashboard from '../screens/rider/RiderDashboard';

// Common Screens
import ChatScreen from '../screens/chat/ChatScreen';
// Misc Screens
import HelpScreen from '../screens/misc/HelpScreen';
import NotificationsScreen from '../screens/misc/NotificationsScreen';
import PaymentMethodsScreen from '../screens/misc/PaymentMethodsScreen';
import TermsScreen from '../screens/misc/TermsScreen';
import WalletScreen from '../screens/misc/WalletScreen';
import AddressPickerScreen from '../screens/user/AddressPickerScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const authState = useSelector(state => state.auth);
  const { isAuthenticated, user } = React.useMemo(() => ({
    isAuthenticated: authState.isAuthenticated,
    user: authState.user
  }), [authState.isAuthenticated, authState.user]);

  useEffect(() => {
    // Remove automatic user loading
    // Users must now log in manually
  }, [dispatch]);

  // Determine initial route based on authentication status and restaurant setup
  const getInitialRoute = () => {
    if (!isAuthenticated) return 'Login';
    
    // For restaurant owners, check if they've completed setup
    if (user?.role === 'restaurant_owner') {
      // If KYC is not approved, show KYC status
      if (user?.kycStatus !== 'approved') {
        return 'KYCStatus';
      }
      // If KYC is approved but no restaurant is set up, show setup screen
      if (!user?.restaurantId) {
        return 'SetupRestaurant';
      }
      // After setup, go directly to RestaurantDashboard
      return 'RestaurantDashboard';
    }
    
    // For other roles
    if (user?.role === 'rider') return 'RiderDashboard';
    if (user?.role === 'restaurant') return 'RestaurantDashboard';
    
    // Default for regular users
    return 'MainTabs';
  };

  return (
    <Stack.Navigator 
      initialRouteName={getInitialRoute()}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      {/* Auth Screens */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      
      {/* Main App Screens */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      
      {/* Role-based Screens */}
      <Stack.Screen 
        name="RiderDashboard" 
        component={RiderDashboard} 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="AddressPicker" 
        component={AddressPickerScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Wallet" 
        component={WalletScreen}
        options={{ headerShown: false, }}
      />
      <Stack.Screen 
        name="PaymentMethods" 
        component={PaymentMethodsScreen}
        options={{ headerShown: false, }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ headerShown: false, }}
      />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen}
        options={{ headerShown: false, }}
      />
      <Stack.Screen 
        name="Terms" 
        component={TermsScreen}
        options={{ headerShown: false,}}
      />
      <Stack.Screen 
        name="RiderDelivery" 
        component={RiderDelivery}
        options={{
          headerShown: false, // Hide default header
          gestureEnabled: true,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="RestaurantDashboard" 
        component={RestaurantDashboard}
        options={{
          headerShown: false,
          headerLeft: () => null, // Prevent going back to MenuManagement
          gestureEnabled: false // Disable swipe back
        }}
      />
      <Stack.Screen 
        name="MenuManagement" 
        component={RestaurantMenuManagement}
        options={{
          headerShown: false,
          gestureEnabled: true
        }}
      />
      {/* KYC and Restaurant Setup Flow */}
      <Stack.Screen 
        name="KYCStatus" 
        component={KYCStatusScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="SetupRestaurant" 
        component={SetupRestaurantScreen}
        options={{
          headerShown: false,
          headerLeft: () => null, // Prevent going back to KYC status
          gestureEnabled: false // Disable swipe back
        }}
      />
      
      {/* Common Screens */}
      <Stack.Screen 
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="OrderTracking" 
        component={OrderTrackingScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="KYCUpload" 
        component={KYCUploadScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="ChatScreen" 
        component={ChatScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="AddressManagement" 
        component={AddressManagementScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      
      {/* Restaurant Management */}
      <Stack.Screen 
        name="RestaurantOrders" 
        component={RestaurantOrders}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
