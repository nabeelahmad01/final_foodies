// src/utils/networkUtils.js
import { API_URL, FALLBACK_API_URL } from './constants';

/**
 * Check if the device has internet connectivity using a simple fetch test
 */
export const checkNetworkConnectivity = async () => {
  try {
    // Test with a reliable endpoint
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
    });
    return {
      isConnected: true,
      type: 'unknown',
      isInternetReachable: true,
    };
  } catch (error) {
    console.warn('Failed to check network connectivity:', error);
    return {
      isConnected: false,
      type: 'unknown',
      isInternetReachable: false,
    };
  }
};

/**
 * Test API endpoint connectivity
 */
export const testApiConnectivity = async (url, timeout = 5000) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    return {
      success: response.ok,
      status: response.status,
      url: url,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      url: url,
    };
  }
};

/**
 * Get the best available API URL by testing connectivity
 */
export const getBestApiUrl = async () => {
  console.log('🔍 Testing API connectivity...');
  
  // First check network connectivity
  const networkStatus = await checkNetworkConnectivity();
  if (!networkStatus.isConnected) {
    console.warn('❌ No network connection detected');
    return { url: API_URL, networkStatus };
  }
  
  // Test primary API URL
  const primaryTest = await testApiConnectivity(API_URL);
  if (primaryTest.success) {
    console.log('✅ Primary API URL is accessible:', API_URL);
    return { url: API_URL, networkStatus, testResult: primaryTest };
  }
  
  console.warn('⚠️ Primary API URL failed, testing fallback:', primaryTest);
  
  // Test fallback API URL
  const fallbackTest = await testApiConnectivity(FALLBACK_API_URL);
  if (fallbackTest.success) {
    console.log('✅ Fallback API URL is accessible:', FALLBACK_API_URL);
    return { url: FALLBACK_API_URL, networkStatus, testResult: fallbackTest };
  }
  
  console.error('❌ Both API URLs failed:', { primaryTest, fallbackTest });
  
  // Return primary URL as default even if tests failed
  return { 
    url: API_URL, 
    networkStatus, 
    testResult: primaryTest,
    fallbackResult: fallbackTest 
  };
};

/**
 * Enhanced error handling for network requests
 */
export const handleNetworkError = (error, context = '') => {
  const errorInfo = {
    message: error.message,
    code: error.code,
    status: error.response?.status,
    context,
    timestamp: new Date().toISOString(),
  };
  
  console.error(`🚨 Network Error ${context}:`, errorInfo);
  
  // Determine user-friendly error message
  let userMessage = 'Something went wrong. Please try again.';
  
  if (error.message === 'Network Error' || error.code === 'NETWORK_ERROR') {
    userMessage = 'Cannot connect to server. Please check your internet connection.';
  } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    userMessage = 'Request timed out. Please check your connection and try again.';
  } else if (error.response?.status === 401) {
    userMessage = 'Authentication failed. Please log in again.';
  } else if (error.response?.status === 403) {
    userMessage = 'Access denied. Please check your permissions.';
  } else if (error.response?.status === 404) {
    userMessage = 'Service not found. Please try again later.';
  } else if (error.response?.status >= 500) {
    userMessage = 'Server error. Please try again later.';
  } else if (error.response?.data?.message) {
    userMessage = error.response.data.message;
  }
  
  return {
    ...errorInfo,
    userMessage,
  };
};
