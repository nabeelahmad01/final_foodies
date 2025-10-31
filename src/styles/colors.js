// src/styles/colors.js
export default {
  primary: '#FF6B35',
  secondary: '#F44336',
  background: '#F5F5F5',
  white: '#FFFFFF',
  black: '#1A1A2E',
  gray: '#9E9E9E',
  lightGray: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  text: {
    primary: '#1A1A2E',
    secondary: '#757575',
    light: '#9E9E9E',
  },
  border: '#E0E0E0',
  shadow: '#00000029',
};
// Update colors.js
// src/styles/colors.js
const lightColors = {
  primary: '#FF6B35',
  background: '#F5F5F5',
  card: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#757575',
  border: '#E0E0E0',
};

const darkColors = {
  primary: '#FF6B35',
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#2C2C2C',
};

export const getColors = (isDark) => (isDark ? darkColors : lightColors);