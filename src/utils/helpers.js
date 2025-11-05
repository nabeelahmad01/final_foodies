// src/utils/helpers.js
// Common helpers and error handling utilities

export const wait = (ms = 500) => new Promise(res => setTimeout(res, ms));

export const formatCurrency = (amount, currency = 'PKR', locale = 'en-PK') => {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(amount || 0));
  } catch (_) {
    return `${currency} ${Number(amount || 0).toFixed(0)}`;
  }
};

export const safeGet = (obj, path, fallback = undefined) => {
  try {
    return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj) ?? fallback;
  } catch (_) {
    return fallback;
  }
};

export const isEmpty = (val) => {
  if (val == null) return true;
  if (Array.isArray(val) || typeof val === 'string') return val.length === 0;
  if (typeof val === 'object') return Object.keys(val).length === 0;
  return false;
};

// Extract a human-readable API error message
export const extractApiErrorMessage = (error, defaultMsg = 'Something went wrong') => {
  if (!error) return defaultMsg;
  
  // Handle specific timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Request timed out. Please check your internet connection and try again.';
  }
  
  // Handle network errors
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    return 'Network error. Please check your internet connection.';
  }
  
  const msg =
    safeGet(error, 'response.data.message') ||
    safeGet(error, 'response.data.error') ||
    safeGet(error, 'message') ||
    (typeof error === 'string' ? error : null);
  return msg || defaultMsg;
};

// Handle API errors; uses optional toast.show if available
export const handleApiError = (error, toast) => {
  const message = extractApiErrorMessage(error);
  if (toast && typeof toast.show === 'function') {
    toast.show(message, 'error');
  }
  return message;
};

// Convenience wrappers for toasts
export const showSuccess = (toast, message = 'Success') => toast?.show?.(message, 'success');
export const showError = (toast, message = 'Error') => toast?.show?.(message, 'error');

