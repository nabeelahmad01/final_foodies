import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import colors from '../styles/colors';

const CustomButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary', // 'primary' | 'outline'
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'outline' ? styles.outline : styles.primary,
        isDisabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.white} />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'outline' ? styles.textOutline : styles.textPrimary,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
  textPrimary: {
    color: colors.white,
  },
  textOutline: {
    color: colors.primary,
  },
});

export default CustomButton;

