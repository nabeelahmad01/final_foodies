// src/screens/auth/LoginScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { login } from '../../redux/slices/authSlice';
import colors from '../../styles/colors';
import { useToast } from '../../context.js/ToastContext';
import { handleApiError, showSuccess } from '../../utils/helpers';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const { isLoading, isAuthenticated, user } = useSelector(state => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      const targetRoute = user?.role === 'rider'
        ? 'RiderDashboard'
        : user?.role === 'restaurant'
          ? 'RestaurantDashboard'
          : 'MainTabs';

      navigation.reset({
        index: 0,
        routes: [{ name: targetRoute }],
      });
    }
  }, [isAuthenticated, navigation, user?.role]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.show('Please fill in all fields', 'error');
      return;
    }

    try {
      console.log('Attempting to login with:', { email });
      const user = await dispatch(login({ email, password })).unwrap();
      
      if (user) {
        console.log('Login successful, user:', user);
        showSuccess(toast, 'Login successful');
        // Track successful login
        try {
          if (typeof Analytics !== 'undefined' && Analytics) {
            Analytics.logLogin?.('email');
            if (user._id) {
              Analytics.setUserId?.(user._id.toString());
            }
            Analytics.setUserProperties?.({
              user_role: user.role || 'customer',
              kyc_status: user.kycStatus || 'not_submitted',
            });
          }
        } catch (analyticsError) {
          console.warn('Analytics error:', analyticsError);
        }
      }
    } catch (error) {
      handleApiError(error, toast);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoEmoji}>🍔</Text>
          </View>
          <Text style={styles.brandName}>Foodie</Text>
          <Text style={styles.tagline}>Delicious food, delivered fast</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Login to your account</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Icon name="mail-outline" size={20} color={colors.gray} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.gray}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Icon name="lock-closed-outline" size={20} color={colors.gray} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.gray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={colors.gray}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <Icon name="logo-google" size={24} color="#DB4437" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Icon name="logo-facebook" size={24} color="#4267B2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Icon name="logo-apple" size={24} color={colors.black} />
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 50,
  },
  brandName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  formContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: colors.text.secondary,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  signupText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  signupLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
